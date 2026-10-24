import { doc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { VillageConfig, UserProfile } from '../types';
import { encryptData, decryptData } from './encryption';
import { cleanForFirestore } from './userService';
import { saveVillageToRTDB } from './realtimeSync';

const ENCRYPTED_VILLAGES_STORAGE_KEY = 'mizoram_vc_villages_cache';
const ACTIVE_VILLAGE_ID_KEY = 'mizoram_vc_active_village_id';

export const DEFAULT_CONDITIONS_MIZO = `CONDITIONS & RESTRICTION
1. Huan ram / In hmun hi ramri ziah anga pek a ni a.
2. An ri-te inkar chin a huam ang.
3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.
4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.
5. VC ten tul bik thil ah an cancel thei ang.
6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.`;

export const DEFAULT_VILLAGE_EMBLEM_URL = '/assets/aistudio/images__3__109dbb99.jpg';

export const DEFAULT_EMPTY_VILLAGE: VillageConfig = {
  id: 'village_default',
  villageName: 'VILLAGE COUNCIL',
  blockName: '',
  districtName: '',
  stateName: 'Mizoram',
  pinCode: '',
  huanRamPrefix: 'VC/HR/',
  inHmunPrefix: 'VC/IH/',
  startingPassNumber: 1001,
  startingHuanRamNumber: 1001,
  startingInHmunNumber: 1001,
  conditionsAndTerms: DEFAULT_CONDITIONS_MIZO,
  presidentName: '',
  secretaryName: '',
  emblemLogoUrl: DEFAULT_VILLAGE_EMBLEM_URL,
};

export function createDefaultVillageForUser(user: UserProfile): VillageConfig {
  const vId = user.villageId || `village_${user.uid}`;
  const vName = user.villageName?.trim() || `${user.displayName || user.username || 'Council'} Village`;
  const cleanInit = (vName.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'VC').toUpperCase();
  return {
    id: vId,
    villageName: vName,
    blockName: '',
    districtName: '',
    stateName: 'Mizoram',
    pinCode: '',
    huanRamPrefix: `VC/${cleanInit}/HR/`,
    inHmunPrefix: `VC/${cleanInit}/IH/`,
    startingPassNumber: 1001,
    startingHuanRamNumber: 1001,
    startingInHmunNumber: 1001,
    conditionsAndTerms: DEFAULT_CONDITIONS_MIZO,
    presidentName: '',
    secretaryName: user.displayName || user.username || '',
    emblemLogoUrl: DEFAULT_VILLAGE_EMBLEM_URL,
  };
}

export function getVillageForUser(user: UserProfile | null, villages: VillageConfig[]): VillageConfig {
  if (!user) {
    return {
      ...DEFAULT_EMPTY_VILLAGE,
      emblemLogoUrl: DEFAULT_VILLAGE_EMBLEM_URL,
    };
  }
  
  const targetId = user.villageId || `village_${user.uid}`;
  const matchedById = villages.find((v) => v.id === targetId || v.id === user.villageId);
  if (matchedById) {
    return {
      ...matchedById,
      emblemLogoUrl: matchedById.emblemLogoUrl || DEFAULT_VILLAGE_EMBLEM_URL,
    };
  }

  // Only match by name if explicitly belonging to this user's village id or created for them
  if (user.villageName) {
    const matchedByName = villages.find(
      (v) =>
        v.id === targetId ||
        (v.id.includes(user.uid) && v.villageName.toLowerCase() === user.villageName?.toLowerCase())
    );
    if (matchedByName) {
      return {
        ...matchedByName,
        emblemLogoUrl: matchedByName.emblemLogoUrl || DEFAULT_VILLAGE_EMBLEM_URL,
      };
    }
  }

  return createDefaultVillageForUser(user);
}

/**
 * Checks if the Village Council profile configuration has been completed.
 * "do not make it live New Land Pass Issue until Configure Village Profile is done"
 */
export function isVillageProfileConfigured(village?: VillageConfig | null): boolean {
  if (!village) return false;
  if (village.isConfigured === true) return true;
  const name = village.villageName?.trim() || '';
  const isGeneric = !name || name === 'VILLAGE COUNCIL' || name === 'Mizoram Generic';
  const hasBlock = Boolean(village.blockName && village.blockName.trim());
  const hasDistrict = Boolean(village.districtName && village.districtName.trim());
  const hasPresident = Boolean(village.presidentName && village.presidentName.trim());
  const hasPrefixes = Boolean(village.huanRamPrefix && village.inHmunPrefix);
  const hasTerms = Boolean(village.conditionsAndTerms && village.conditionsAndTerms.trim());
  return !isGeneric && hasBlock && hasDistrict && hasPresident && hasPrefixes && hasTerms;
}

export async function getCachedVillages(): Promise<VillageConfig[]> {
  try {
    const raw = localStorage.getItem(ENCRYPTED_VILLAGES_STORAGE_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<VillageConfig[]>(raw);
    return decrypted && Array.isArray(decrypted) ? decrypted : [];
  } catch {
    return [];
  }
}

export async function setCachedVillages(villages: VillageConfig[]): Promise<void> {
  try {
    const encrypted = await encryptData(villages);
    localStorage.setItem(ENCRYPTED_VILLAGES_STORAGE_KEY, encrypted);
  } catch (e) {
    console.warn('Failed to cache villages encrypted:', e);
  }
}

export function getStoredActiveVillageId(): string {
  return localStorage.getItem(ACTIVE_VILLAGE_ID_KEY) || 'village_default';
}

export function setStoredActiveVillageId(id: string): void {
  localStorage.setItem(ACTIVE_VILLAGE_ID_KEY, id);
}

export async function saveVillageConfig(config: VillageConfig): Promise<void> {
  const villages = await getCachedVillages();
  const index = villages.findIndex(v => v.id === config.id);
  let updated: VillageConfig[];
  if (index >= 0) {
    updated = villages.map(v => v.id === config.id ? config : v);
  } else {
    updated = [...villages, config];
  }

  await setCachedVillages(updated);

  // Write to both Firestore and Firebase Realtime Database
  const cleaned = cleanForFirestore(config);
  if (navigator.onLine) {
    try {
      const docRef = doc(db, 'villages', config.id);
      await setDoc(docRef, cleaned);
    } catch (e) {
      console.warn('Could not save village config to Firestore:', e);
    }
  }

  try {
    await saveVillageToRTDB(cleaned);
  } catch (e) {
    console.warn('Could not save village config to RTDB:', e);
  }
}

export async function fetchVillagesFromCloud(): Promise<VillageConfig[]> {
  if (navigator.onLine) {
    try {
      const snap = await getDocs(collection(db, 'villages'));
      if (!snap.empty) {
        const cloudVillages: VillageConfig[] = [];
        snap.forEach(d => cloudVillages.push(d.data() as VillageConfig));
        await setCachedVillages(cloudVillages);
        return cloudVillages;
      }
    } catch (e) {
      console.warn('Could not fetch villages from cloud:', e);
    }
  }
  return await getCachedVillages();
}
