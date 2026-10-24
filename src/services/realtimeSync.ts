import { ref, set, get, remove, onValue, off } from 'firebase/database';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import { UserProfile, LandPass, VillageConfig, AuditLog } from '../types';
import { cleanForFirestore } from './userService';

/**
 * Strips undefined properties recursively before writing to Realtime Database.
 */
function cleanForRTDB(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForRTDB);
  const out: any = {};
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    if (val !== undefined) {
      out[k] = cleanForRTDB(val);
    }
  }
  return out;
}

// =========================================================================
// REALTIME DATABASE WRITES
// =========================================================================

export async function saveUserToRTDB(user: UserProfile): Promise<void> {
  if (!rtdb) return;
  try {
    const userRef = ref(rtdb, `users/${user.uid}`);
    await set(userRef, cleanForRTDB(user));
  } catch (err) {
    console.warn('Realtime Database write user error:', err);
  }
}

export async function deleteUserFromRTDB(uid: string): Promise<void> {
  if (!rtdb) return;
  try {
    const userRef = ref(rtdb, `users/${uid}`);
    await remove(userRef);
  } catch (err) {
    console.warn('Realtime Database remove user error:', err);
  }
}

export async function savePassToRTDB(pass: LandPass): Promise<void> {
  if (!rtdb) return;
  try {
    const passRef = ref(rtdb, `land_passes/${pass.id}`);
    await set(passRef, cleanForRTDB(pass));
  } catch (err) {
    console.warn('Realtime Database write land pass error:', err);
  }
}

export async function deletePassFromRTDB(passId: string): Promise<void> {
  if (!rtdb) return;
  try {
    const passRef = ref(rtdb, `land_passes/${passId}`);
    await remove(passRef);
  } catch (err) {
    console.warn('Realtime Database remove land pass error:', err);
  }
}

export async function saveVillageToRTDB(village: VillageConfig): Promise<void> {
  if (!rtdb) return;
  try {
    const villageRef = ref(rtdb, `villages/${village.id}`);
    await set(villageRef, cleanForRTDB(village));
  } catch (err) {
    console.warn('Realtime Database write village error:', err);
  }
}

export async function saveAuditLogToRTDB(log: AuditLog): Promise<void> {
  if (!rtdb) return;
  try {
    const logRef = ref(rtdb, `audit_logs/${log.id}`);
    await set(logRef, cleanForRTDB(log));
  } catch (err) {
    console.warn('Realtime Database write audit log error:', err);
  }
}

// =========================================================================
// REALTIME DATABASE LISTENERS (AUTO SYNC)
// =========================================================================

export function subscribeToRTDBUsers(callback: (users: UserProfile[]) => void): () => void {
  if (!rtdb) return () => {};
  const usersRef = ref(rtdb, 'users');
  const unsubscribe = onValue(
    usersRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: UserProfile[] = Object.values(val);
      callback(list);
    },
    (error) => {
      console.warn('RTDB Users subscribe error:', error);
    }
  );

  return () => {
    try {
      off(usersRef);
    } catch {}
  };
}

export function subscribeToRTDBPasses(callback: (passes: LandPass[]) => void): () => void {
  if (!rtdb) return () => {};
  const passesRef = ref(rtdb, 'land_passes');
  const unsubscribe = onValue(
    passesRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: LandPass[] = Object.values(val);
      callback(list);
    },
    (error) => {
      console.warn('RTDB Passes subscribe error:', error);
    }
  );

  return () => {
    try {
      off(passesRef);
    } catch {}
  };
}

export function subscribeToRTDBVillages(callback: (villages: VillageConfig[]) => void): () => void {
  if (!rtdb) return () => {};
  const villagesRef = ref(rtdb, 'villages');
  const unsubscribe = onValue(
    villagesRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: VillageConfig[] = Object.values(val);
      callback(list);
    },
    (error) => {
      console.warn('RTDB Villages subscribe error:', error);
    }
  );

  return () => {
    try {
      off(villagesRef);
    } catch {}
  };
}

export function subscribeToRTDBAuditLogs(callback: (logs: AuditLog[]) => void): () => void {
  if (!rtdb) return () => {};
  const logsRef = ref(rtdb, 'audit_logs');
  const unsubscribe = onValue(
    logsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: AuditLog[] = Object.values(val);
      callback(list);
    },
    (error) => {
      console.warn('RTDB AuditLogs subscribe error:', error);
    }
  );

  return () => {
    try {
      off(logsRef);
    } catch {}
  };
}

// =========================================================================
// TRANSFER / MIGRATE ALL DATA TO FIREBASE REALTIME DATABASE
// =========================================================================

export interface TransferResult {
  passes: number;
  villages: number;
  users: number;
  auditLogs: number;
  success: boolean;
  message: string;
}

export async function transferAllDataToRTDB(
  explicitPasses?: LandPass[],
  explicitVillages?: VillageConfig[],
  explicitUsers?: UserProfile[],
  explicitLogs?: AuditLog[]
): Promise<TransferResult> {
  const result: TransferResult = {
    passes: 0,
    villages: 0,
    users: 0,
    auditLogs: 0,
    success: false,
    message: '',
  };

  if (!rtdb) {
    result.message = 'Firebase Realtime Database is not initialized or offline.';
    return result;
  }

  try {
    // 1. Land Passes
    let passesToTransfer = explicitPasses || [];
    if (passesToTransfer.length === 0 && db && navigator.onLine) {
      try {
        const snap = await getDocs(collection(db, 'land_passes'));
        snap.forEach((d) => passesToTransfer.push(d.data() as LandPass));
      } catch (e) {
        console.warn('Error reading Firestore land_passes for RTDB transfer:', e);
      }
    }
    for (const pass of passesToTransfer) {
      if (pass && pass.id) {
        await savePassToRTDB(pass);
        result.passes++;
      }
    }

    // 2. Villages
    let villagesToTransfer = explicitVillages || [];
    if (villagesToTransfer.length === 0 && db && navigator.onLine) {
      try {
        const snap = await getDocs(collection(db, 'villages'));
        snap.forEach((d) => villagesToTransfer.push(d.data() as VillageConfig));
      } catch (e) {
        console.warn('Error reading Firestore villages for RTDB transfer:', e);
      }
    }
    for (const v of villagesToTransfer) {
      if (v && v.id) {
        await saveVillageToRTDB(v);
        result.villages++;
      }
    }

    // 3. Users
    let usersToTransfer = explicitUsers || [];
    if (usersToTransfer.length === 0 && db && navigator.onLine) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((d) => usersToTransfer.push(d.data() as UserProfile));
      } catch (e) {
        console.warn('Error reading Firestore users for RTDB transfer:', e);
      }
    }
    for (const u of usersToTransfer) {
      if (u && u.uid) {
        await saveUserToRTDB(u);
        result.users++;
      }
    }

    // 4. Audit Logs
    let logsToTransfer = explicitLogs || [];
    if (logsToTransfer.length === 0 && db && navigator.onLine) {
      try {
        const snap = await getDocs(collection(db, 'audit_logs'));
        snap.forEach((d) => logsToTransfer.push(d.data() as AuditLog));
      } catch (e) {
        console.warn('Error reading Firestore audit_logs for RTDB transfer:', e);
      }
    }
    for (const log of logsToTransfer) {
      if (log && log.id) {
        await saveAuditLogToRTDB(log);
        result.auditLogs++;
      }
    }

    result.success = true;
    result.message = `Successfully transferred ${result.passes} Land Passes, ${result.villages} Villages, ${result.users} Users, and ${result.auditLogs} Audit Logs to Firebase Realtime Database.`;
    return result;
  } catch (err: any) {
    result.success = false;
    result.message = `Transfer to RTDB failed: ${err?.message || err}`;
    return result;
  }
}

// =========================================================================
// PURGE & RESET ALL DATA AND USERS ACROSS FIREBASE
// =========================================================================

export async function clearAllDataAndUsersFromFirebase(): Promise<void> {
  // 1. Clear Realtime Database
  if (rtdb) {
    try {
      await remove(ref(rtdb, 'users'));
      await remove(ref(rtdb, 'land_passes'));
      await remove(ref(rtdb, 'villages'));
      await remove(ref(rtdb, 'audit_logs'));
      console.log('Realtime Database cleared completely.');
    } catch (e) {
      console.warn('Failed to clear RTDB:', e);
    }
  }

  // 2. Clear Firestore collections
  if (db && navigator.onLine) {
    try {
      const collections = ['users', 'land_passes', 'villages', 'audit_logs'];
      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          await deleteDoc(doc(db, colName, d.id));
        }
      }
      console.log('Firestore collections cleared completely.');
    } catch (e) {
      console.warn('Failed to clear Firestore:', e);
    }
  }

  // 3. Clear Local Storage caches
  try {
    localStorage.removeItem('mizoram_vc_encrypted_users_cache');
    localStorage.removeItem('mizoram_vc_current_user');
    localStorage.removeItem('mizoram_vc_offline_passes_cache');
    localStorage.removeItem('mizoram_vc_villages_cache');
    localStorage.removeItem('mizoram_vc_audit_logs');
    localStorage.removeItem('mizoram_vc_offline_mutation_queue');
    sessionStorage.removeItem('mizoram_vc_full_authority');
  } catch {}
}
