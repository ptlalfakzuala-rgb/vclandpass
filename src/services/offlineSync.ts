import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { encryptData, decryptData } from './encryption';
import { LandPass, PassType, AuditLog } from '../types';
import { cleanForFirestore } from './userService';

const ENCRYPTED_PASSES_STORAGE_KEY = 'saiphai_vc_encrypted_passes_cache';
const OFFLINE_MUTATION_QUEUE_KEY = 'saiphai_vc_offline_queue';
const ENCRYPTED_AUDIT_LOGS_STORAGE_KEY = 'saiphai_vc_encrypted_audit_cache';

interface QueuedMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  pass: LandPass;
  timestamp: number;
}

// Initial sample data if no passes exist yet
export const INITIAL_LAND_PASSES: LandPass[] = [
  {
    id: 'SPH_VC_HR_1001',
    passNumber: 'SPH/VC/HR/1001',
    passType: 'huan_ram',
    villageId: 'saiphai',
    villageName: 'Saiphai',
    ownerName: 'Lalremruata',
    parentName: 'Rochhunga (L)',
    contactNumber: '+91 94361 24589',
    locationCoordinates: '24.2415, 92.9350',
    locationAddress: 'Vaphai Road Huan, Saiphai',
    boundaryNorth: 'Pu Sangliana ramri lungphun leh kawngpui chin',
    boundaryEast: 'Tlawng luite kam leh mau hmun pial',
    boundaryWest: 'Pi Thangkhumi huan leh thingpui hmun inriatna',
    boundarySouth: 'Kawngpui lian chhimlam huam chin',
    areaSize: '3.5 Bighas (approx. 4,680 Sq. M)',
    issueDate: '2025-02-14',
    presidentSignatory: 'LALTHANSANGA',
    secretarySignatory: 'C. Lalramnghaka',
    qrCodeData: 'https://saiphai.mizoram.gov.in/verify/SPH/VC/HR/1001',
    notes: 'Kut thlak tan tawh a ni a, betel nut leh thingpui thar tan mek a ni.',
    createdBy: 'system_bootstrap',
    createdAt: new Date('2025-02-14T10:00:00Z').toISOString(),
    updatedAt: new Date('2025-02-14T10:00:00Z').toISOString(),
    syncedToCloud: true,
  },
  {
    id: 'SPH_VC_HR_1002',
    passNumber: 'SPH/VC/HR/1002',
    passType: 'huan_ram',
    villageId: 'saiphai',
    villageName: 'Saiphai',
    ownerName: 'Zothanpuii',
    parentName: 'Kapthanga (L)',
    contactNumber: '+91 98623 77120',
    locationCoordinates: '24.2389, 92.9312',
    locationAddress: 'Saiphai Chhim Veng Ram',
    boundaryNorth: 'Sawrkar kawngpui peng leh lungphun lian',
    boundaryEast: 'Pu Lalzirliana oil palm huan ri',
    boundaryWest: 'Tuikhur luikawr thlanglam',
    boundarySouth: 'Pu Vanlalhlua serthlum huan inriatna chin',
    areaSize: '2.0 Bighas',
    issueDate: '2025-03-01',
    presidentSignatory: 'LALTHANSANGA',
    secretarySignatory: 'C. Lalramnghaka',
    qrCodeData: 'https://saiphai.mizoram.gov.in/verify/SPH/VC/HR/1002',
    notes: 'Bilkhawthlir RD block ramri piah deuh huan ram thlan.',
    createdBy: 'system_bootstrap',
    createdAt: new Date('2025-03-01T11:30:00Z').toISOString(),
    updatedAt: new Date('2025-03-01T11:30:00Z').toISOString(),
    syncedToCloud: true,
  },
  {
    id: 'SPH_VC_IH_1001',
    passNumber: 'SPH/VC/IH/1001',
    passType: 'in_hmun',
    villageId: 'saiphai',
    villageName: 'Saiphai',
    ownerName: 'Vanlalhruaia',
    parentName: 'Lalbiakkima',
    contactNumber: '+91 87941 12044',
    locationCoordinates: '24.2432, 92.9378',
    locationAddress: 'Saiphai Bazar Veng, Near Primary Health Sub-Centre',
    boundaryNorth: 'Bazar kawngpui lian kawtthler',
    boundaryEast: 'Sub-Centre compound lungbang',
    boundaryWest: 'Pu Hmangaiha in bang inriatna',
    boundarySouth: 'Drainage tuihawk luangna kawr thleng',
    areaSize: '65 x 85 feet (5,525 sq.ft)',
    issueDate: '2025-01-20',
    presidentSignatory: 'LALTHANSANGA',
    secretarySignatory: 'C. Lalramnghaka',
    qrCodeData: 'https://saiphai.mizoram.gov.in/verify/SPH/VC/IH/1001',
    notes: 'Chenna in hmun puitling, NOC VC Court in a pawmpui tawh.',
    createdBy: 'system_bootstrap',
    createdAt: new Date('2025-01-20T09:15:00Z').toISOString(),
    updatedAt: new Date('2025-01-20T09:15:00Z').toISOString(),
    syncedToCloud: true,
  },
  {
    id: 'SPH_VC_IH_1002',
    passNumber: 'SPH/VC/IH/1002',
    passType: 'in_hmun',
    villageId: 'saiphai',
    villageName: 'Saiphai',
    ownerName: 'C. Lalrintluanga',
    parentName: 'C. Chhuanvawra',
    contactNumber: '+91 96120 44901',
    locationCoordinates: '24.2460, 92.9395',
    locationAddress: 'Saiphai Hmar Veng, Near Community Hall',
    boundaryNorth: 'Community Hall fencing bang',
    boundaryEast: 'Kawngpui peng chhaklam',
    boundaryWest: 'Pu K. Zothansanga in compound',
    boundarySouth: 'VC Reserved area ri',
    areaSize: '50 x 70 feet (3,500 sq.ft)',
    issueDate: '2025-02-10',
    presidentSignatory: 'LALTHANSANGA',
    secretarySignatory: 'C. Lalramnghaka',
    qrCodeData: 'https://saiphai.mizoram.gov.in/verify/SPH/VC/IH/1002',
    notes: 'In sakna tur a thlan, VC resolution no. 14 hmanga pawm.',
    createdBy: 'system_bootstrap',
    createdAt: new Date('2025-02-10T14:20:00Z').toISOString(),
    updatedAt: new Date('2025-02-10T14:20:00Z').toISOString(),
    syncedToCloud: true,
  }
];

// Read encrypted local cache
export async function getCachedPasses(): Promise<LandPass[]> {
  try {
    const raw = localStorage.getItem(ENCRYPTED_PASSES_STORAGE_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<LandPass[]>(raw);
    return decrypted || [];
  } catch (e) {
    console.error('Failed to read encrypted cache:', e);
    return [];
  }
}

// Save encrypted local cache
export async function setCachedPasses(passes: LandPass[]): Promise<void> {
  try {
    const encrypted = await encryptData(passes);
    localStorage.setItem(ENCRYPTED_PASSES_STORAGE_KEY, encrypted);
  } catch (e) {
    console.error('Failed to save encrypted cache:', e);
  }
}

// Audit Logs encrypted cache
export async function getCachedAuditLogs(): Promise<AuditLog[]> {
  try {
    const raw = localStorage.getItem(ENCRYPTED_AUDIT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<AuditLog[]>(raw);
    return decrypted || [];
  } catch {
    return [];
  }
}

export async function setCachedAuditLogs(logs: AuditLog[]): Promise<void> {
  try {
    const encrypted = await encryptData(logs);
    localStorage.setItem(ENCRYPTED_AUDIT_LOGS_STORAGE_KEY, encrypted);
  } catch (e) {
    console.error('Failed to save encrypted audit logs:', e);
  }
}

// Calculate next pass number according to custom Village Prefix or standard series
export function getNextPassNumber(
  type: PassType,
  existingPasses: LandPass[],
  customPrefix?: string,
  villageId?: string,
  startingNumber?: number
): string {
  const prefix = customPrefix || (type === 'huan_ram' ? 'SPH/VC/HR/' : 'SPH/VC/IH/');
  const defaultStart = startingNumber && !isNaN(startingNumber) && startingNumber > 0 ? startingNumber : 1001;

  let maxNum = defaultStart - 1;
  for (const pass of existingPasses) {
    if (
      pass.passType === type &&
      (!villageId || pass.villageId === villageId) &&
      pass.passNumber.startsWith(prefix)
    ) {
      const part = pass.passNumber.replace(prefix, '').trim();
      const num = parseInt(part, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  return `${prefix}${maxNum + 1}`;
}

// Queue offline mutation
export function queueOfflineMutation(mutation: QueuedMutation) {
  try {
    const raw = localStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
    const queue: QueuedMutation[] = raw ? JSON.parse(raw) : [];
    queue.push(mutation);
    localStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to queue offline mutation', e);
  }
}

// Sync offline mutations to Firebase when back online
export async function syncOfflineQueueToFirestore(): Promise<number> {
  if (!navigator.onLine) return 0;
  const raw = localStorage.getItem(OFFLINE_MUTATION_QUEUE_KEY);
  if (!raw) return 0;

  let queue: QueuedMutation[] = [];
  try {
    queue = JSON.parse(raw);
  } catch {
    return 0;
  }

  if (queue.length === 0) return 0;

  let processedCount = 0;
  const remainingQueue: QueuedMutation[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'CREATE' || item.type === 'UPDATE') {
        const passDocRef = doc(db, 'land_passes', item.pass.id);
        const { syncedToCloud, ...payload } = item.pass;
        const cleaned = cleanForFirestore({ ...payload, syncedToCloud: true });
        await setDoc(passDocRef, cleaned);
        try {
          const { savePassToRTDB } = await import('./realtimeSync');
          await savePassToRTDB(cleaned);
        } catch {}
        processedCount++;
      } else if (item.type === 'DELETE') {
        const passDocRef = doc(db, 'land_passes', item.pass.id);
        await deleteDoc(passDocRef);
        try {
          const { deletePassFromRTDB } = await import('./realtimeSync');
          await deletePassFromRTDB(item.pass.id);
        } catch {}
        processedCount++;
      }
    } catch (err) {
      console.warn('Could not sync queued item yet:', item, err);
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(OFFLINE_MUTATION_QUEUE_KEY, JSON.stringify(remainingQueue));
  return processedCount;
}

// Fetch passes or return empty clean array
export async function seedInitialPassesIfEmpty(): Promise<LandPass[]> {
  try {
    const colRef = collection(db, 'land_passes');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      await setCachedPasses([]);
      return [];
    } else {
      const passes: LandPass[] = [];
      snapshot.forEach(docSnap => {
        passes.push(docSnap.data() as LandPass);
      });
      await setCachedPasses(passes);
      return passes;
    }
  } catch (e) {
    const cached = await getCachedPasses();
    return cached || [];
  }
}
