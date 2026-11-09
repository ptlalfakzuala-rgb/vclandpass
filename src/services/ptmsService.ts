import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { ref, set, remove, onValue, off } from 'firebase/database';
import { db, rtdb, handleFirestoreError, OperationType } from './firebase';
import { encryptData, decryptData } from './encryption';
import { HouseholdFamily, PropertyTaxRecord } from '../types';
import { cleanForFirestore } from './userService';

const HOUSEHOLDS_CACHE_KEY = 'mizoram_vc_encrypted_households_cache';
const TAX_RECORDS_CACHE_KEY = 'mizoram_vc_encrypted_tax_records_cache';

// Clean object for RTDB
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
// HOUSEHOLD / FAMILY ID CRUD & OFFLINE CACHE
// =========================================================================

export async function getCachedHouseholds(): Promise<HouseholdFamily[]> {
  try {
    const raw = localStorage.getItem(HOUSEHOLDS_CACHE_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<HouseholdFamily[]>(raw);
    return decrypted || [];
  } catch (err) {
    console.warn('Error reading cached households:', err);
    return [];
  }
}

export async function setCachedHouseholds(households: HouseholdFamily[]): Promise<void> {
  try {
    const encrypted = await encryptData(households);
    localStorage.setItem(HOUSEHOLDS_CACHE_KEY, encrypted);
  } catch (err) {
    console.warn('Error setting cached households:', err);
  }
}

export async function fetchHouseholdsFromCloud(): Promise<HouseholdFamily[]> {
  if (!db || !navigator.onLine) {
    return getCachedHouseholds();
  }
  try {
    const colRef = collection(db, 'households');
    const snapshot = await getDocs(colRef);
    const list: HouseholdFamily[] = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as HouseholdFamily),
      id: docSnap.id,
      syncedToCloud: true
    }));
    setCachedHouseholds(list);
    return list;
  } catch (error) {
    console.warn('Fetch households from firestore failed, fallback to cache:', error);
    return getCachedHouseholds();
  }
}

export async function saveHouseholdRecord(household: HouseholdFamily): Promise<HouseholdFamily> {
  const itemToSave: HouseholdFamily = {
    ...household,
    updatedAt: new Date().toISOString(),
    syncedToCloud: false
  };

  // 1. Update offline cache
  const cached = await getCachedHouseholds();
  const idx = cached.findIndex((h) => h.id === itemToSave.id);
  if (idx >= 0) {
    cached[idx] = itemToSave;
  } else {
    cached.unshift(itemToSave);
  }
  setCachedHouseholds(cached);

  // 2. Write to Firestore if online
  if (db && navigator.onLine) {
    try {
      const docRef = doc(db, 'households', itemToSave.id);
      const cleanData = cleanForFirestore({ ...itemToSave, syncedToCloud: true });
      await setDoc(docRef, cleanData);
      itemToSave.syncedToCloud = true;

      // Update cache with synced flag
      const updatedCache = cached.map((h) => (h.id === itemToSave.id ? itemToSave : h));
      setCachedHouseholds(updatedCache);
    } catch (err) {
      console.warn('Error saving household to Firestore:', err);
    }
  }

  // 3. Write to RTDB for silent realtime broadcast
  if (rtdb) {
    try {
      const rtdbRef = ref(rtdb, `households/${itemToSave.id}`);
      await set(rtdbRef, cleanForRTDB(itemToSave));
    } catch (err) {
      console.warn('Error saving household to RTDB:', err);
    }
  }

  return itemToSave;
}

export async function deleteHouseholdRecord(householdId: string): Promise<void> {
  // 1. Update cache
  const cached = await getCachedHouseholds();
  const filtered = cached.filter((h) => h.id !== householdId);
  setCachedHouseholds(filtered);

  // 2. Delete from Firestore
  if (db && navigator.onLine) {
    try {
      await deleteDoc(doc(db, 'households', householdId));
    } catch (err) {
      console.warn('Error deleting household from Firestore:', err);
    }
  }

  // 3. Delete from RTDB
  if (rtdb) {
    try {
      await remove(ref(rtdb, `households/${householdId}`));
    } catch (err) {
      console.warn('Error deleting household from RTDB:', err);
    }
  }
}

// =========================================================================
// PROPERTY TAX RECORDS CRUD & OFFLINE CACHE
// =========================================================================

export async function getCachedTaxRecords(): Promise<PropertyTaxRecord[]> {
  try {
    const raw = localStorage.getItem(TAX_RECORDS_CACHE_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<PropertyTaxRecord[]>(raw);
    return decrypted || [];
  } catch (err) {
    console.warn('Error reading cached tax records:', err);
    return [];
  }
}

export async function setCachedTaxRecords(taxes: PropertyTaxRecord[]): Promise<void> {
  try {
    const encrypted = await encryptData(taxes);
    localStorage.setItem(TAX_RECORDS_CACHE_KEY, encrypted);
  } catch (err) {
    console.warn('Error setting cached tax records:', err);
  }
}

export async function fetchTaxRecordsFromCloud(): Promise<PropertyTaxRecord[]> {
  if (!db || !navigator.onLine) {
    return getCachedTaxRecords();
  }
  try {
    const colRef = collection(db, 'property_taxes');
    const snapshot = await getDocs(colRef);
    const list: PropertyTaxRecord[] = snapshot.docs.map((docSnap) => ({
      ...(docSnap.data() as PropertyTaxRecord),
      id: docSnap.id,
      syncedToCloud: true
    }));
    setCachedTaxRecords(list);
    return list;
  } catch (error) {
    console.warn('Fetch property taxes from firestore failed, fallback to cache:', error);
    return getCachedTaxRecords();
  }
}

export async function saveTaxRecord(tax: PropertyTaxRecord): Promise<PropertyTaxRecord> {
  const itemToSave: PropertyTaxRecord = {
    ...tax,
    updatedAt: new Date().toISOString(),
    syncedToCloud: false
  };

  // 1. Update cache
  const cached = await getCachedTaxRecords();
  const idx = cached.findIndex((t) => t.id === itemToSave.id);
  if (idx >= 0) {
    cached[idx] = itemToSave;
  } else {
    cached.unshift(itemToSave);
  }
  setCachedTaxRecords(cached);

  // 2. Write to Firestore
  if (db && navigator.onLine) {
    try {
      const docRef = doc(db, 'property_taxes', itemToSave.id);
      const cleanData = cleanForFirestore({ ...itemToSave, syncedToCloud: true });
      await setDoc(docRef, cleanData);
      itemToSave.syncedToCloud = true;

      const updatedCache = cached.map((t) => (t.id === itemToSave.id ? itemToSave : t));
      setCachedTaxRecords(updatedCache);
    } catch (err) {
      console.warn('Error saving property tax to Firestore:', err);
    }
  }

  // 3. Write to RTDB
  if (rtdb) {
    try {
      const rtdbRef = ref(rtdb, `property_taxes/${itemToSave.id}`);
      await set(rtdbRef, cleanForRTDB(itemToSave));
    } catch (err) {
      console.warn('Error saving property tax to RTDB:', err);
    }
  }

  return itemToSave;
}

export async function deleteTaxRecord(taxId: string): Promise<void> {
  // 1. Update cache
  const cached = await getCachedTaxRecords();
  const filtered = cached.filter((t) => t.id !== taxId);
  setCachedTaxRecords(filtered);

  // 2. Delete from Firestore
  if (db && navigator.onLine) {
    try {
      await deleteDoc(doc(db, 'property_taxes', taxId));
    } catch (err) {
      console.warn('Error deleting property tax from Firestore:', err);
    }
  }

  // 3. Delete from RTDB
  if (rtdb) {
    try {
      await remove(ref(rtdb, `property_taxes/${taxId}`));
    } catch (err) {
      console.warn('Error deleting property tax from RTDB:', err);
    }
  }
}

// =========================================================================
// REALTIME SUBSCRIPTIONS
// =========================================================================

export function subscribeToRTDBHouseholds(callback: (households: HouseholdFamily[]) => void): () => void {
  if (!rtdb) return () => {};
  const householdsRef = ref(rtdb, 'households');
  const unsubscribe = onValue(
    householdsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: HouseholdFamily[] = Object.values(val);
      callback(list);
    },
    (err) => console.warn('RTDB Households subscription error:', err)
  );

  return () => {
    try {
      off(householdsRef);
    } catch {}
  };
}

export function subscribeToRTDBTaxRecords(callback: (records: PropertyTaxRecord[]) => void): () => void {
  if (!rtdb) return () => {};
  const taxesRef = ref(rtdb, 'property_taxes');
  const unsubscribe = onValue(
    taxesRef,
    (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        callback([]);
        return;
      }
      const list: PropertyTaxRecord[] = Object.values(val);
      callback(list);
    },
    (err) => console.warn('RTDB Tax records subscription error:', err)
  );

  return () => {
    try {
      off(taxesRef);
    } catch {}
  };
}

// =========================================================================
// HELPER: GENERATE NEXT SEQUENTIAL FAMILY ID
// e.g. "SPH-FAM-0001", "MZ-VC-FAM-0002"
// =========================================================================
export function generateNextFamilyId(
  existingHouseholds: HouseholdFamily[],
  prefix: string = 'VC-FAM-',
  startNumber: number = 1
): string {
  const cleanPrefix = (prefix || 'VC-FAM-').trim();
  
  // Find highest current sequence number (starts from 0 so first ID is 0001)
  let maxSeq = Math.max(0, startNumber - 1);
  const escapedPrefix = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');
  const anyTrailingNumRegex = /(\\d+)$/;

  existingHouseholds.forEach((h) => {
    if (!h.familyId) return;
    const match = h.familyId.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    } else {
      const trailingMatch = h.familyId.match(anyTrailingNumRegex);
      if (trailingMatch && trailingMatch[1]) {
        const num = parseInt(trailingMatch[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${cleanPrefix}${padded}`;
}

// =========================================================================
// HELPER: GENERATE NEXT SEQUENTIAL TAX INVOICE NUMBER
// e.g. "PTMS-SPH-2025-0001"
// =========================================================================
export function generateNextTaxInvoiceNumber(
  existingTaxes: PropertyTaxRecord[],
  prefix: string = 'PTMS-VC-',
  taxYear: string = '2026-2027',
  startNumber: number = 1
): string {
  const yearSuffix = taxYear.split('-')[0] || '2026';
  const cleanPrefix = `${(prefix || 'PTMS-VC-').trim()}${yearSuffix}-`;
  
  let maxSeq = startNumber - 1;
  const escapedPrefix = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');

  existingTaxes.forEach((t) => {
    const match = t.taxInvoiceNumber?.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const padded = String(nextSeq).padStart(4, '0');
  return `${cleanPrefix}${padded}`;
}
