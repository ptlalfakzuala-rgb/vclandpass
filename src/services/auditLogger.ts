import { doc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuditLog } from '../types';
import { getCachedAuditLogs, setCachedAuditLogs } from './offlineSync';
import { saveAuditLogToRTDB } from './realtimeSync';

export async function logActivity(
  action: AuditLog['action'],
  targetId: string,
  targetName: string,
  performedBy: string,
  details: string
): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    action,
    targetId,
    targetName,
    performedBy,
    details,
    timestamp: new Date().toISOString()
  };

  // Add to local encrypted cache first
  try {
    const cached = await getCachedAuditLogs();
    const updated = [newLog, ...cached].slice(0, 200);
    await setCachedAuditLogs(updated);
  } catch (e) {
    console.warn('Could not cache audit log locally:', e);
  }

  // If online, write to Firestore
  if (navigator.onLine) {
    try {
      const docRef = doc(db, 'audit_logs', newLog.id);
      await setDoc(docRef, newLog);
    } catch (e) {
      console.warn('Failed to send audit log to Firestore (will remain in offline cache):', e);
    }
  }

  // Also write to Realtime Database
  try {
    await saveAuditLogToRTDB(newLog);
  } catch (e) {
    console.warn('Failed to save audit log to RTDB:', e);
  }

  return newLog;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  if (navigator.onLine) {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const remoteLogs: AuditLog[] = [];
        snap.forEach(d => remoteLogs.push(d.data() as AuditLog));
        await setCachedAuditLogs(remoteLogs);
        return remoteLogs;
      }
    } catch (e) {
      console.warn('Failed to fetch remote audit logs, using local cache:', e);
    }
  }
  return await getCachedAuditLogs();
}
