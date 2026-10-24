import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, UserStatus } from '../types';
import { encryptData, decryptData } from './encryption';
import { saveUserToRTDB } from './realtimeSync';

const ENCRYPTED_USERS_KEY = 'mizoram_vc_encrypted_users_cache';
export const FULL_AUTHORITY_KEY_VALUE = '785392';

// Clean initial empty state
export const INITIAL_USERS: UserProfile[] = [];

/**
 * Strips out any `undefined` properties recursively before writing to Firestore.
 * Firestore strictly throws an exception if any property is undefined.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) return null;
  const cleaned: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) {
      continue;
    }
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      cleaned[key] = cleanForFirestore(val);
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

export async function getCachedUsers(): Promise<UserProfile[]> {
  try {
    const raw = localStorage.getItem(ENCRYPTED_USERS_KEY);
    if (!raw) return [];
    const decrypted = await decryptData<UserProfile[]>(raw);
    return decrypted && Array.isArray(decrypted) ? decrypted : [];
  } catch {
    return [];
  }
}

export async function setCachedUsers(users: UserProfile[]): Promise<void> {
  try {
    const encrypted = await encryptData(users);
    localStorage.setItem(ENCRYPTED_USERS_KEY, encrypted);
  } catch (e) {
    console.warn('Failed to cache encrypted users:', e);
  }
}

export async function fetchUsersFromCloud(): Promise<UserProfile[]> {
  try {
    if (!navigator.onLine) return getCachedUsers();
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return getCachedUsers();
    }

    const loadedUsers: UserProfile[] = [];
    snapshot.forEach((d) => {
      loadedUsers.push(d.data() as UserProfile);
    });
    await setCachedUsers(loadedUsers);
    return loadedUsers;
  } catch (e) {
    console.warn('Failed to fetch users from cloud, fallback to local cache:', e);
    return getCachedUsers();
  }
}

export async function saveOrUpdateUser(user: UserProfile): Promise<void> {
  const current = await getCachedUsers();
  const exists = current.some((u) => u.uid === user.uid);
  const updated = exists
    ? current.map((u) => (u.uid === user.uid ? user : u))
    : [user, ...current];

  await setCachedUsers(updated);

  if (navigator.onLine) {
    try {
      const payload = cleanForFirestore(user);
      await setDoc(doc(db, 'users', user.uid), payload, { merge: true });
      await saveUserToRTDB(payload);
    } catch (e) {
      console.error('Failed to save user to cloud:', e);
    }
  }
}

export async function updateUserStatus(
  uid: string,
  status: UserStatus,
  reviewerName: string,
  rejectionReason?: string
): Promise<UserProfile | null> {
  const nowIso = new Date().toISOString();

  // 1. Try to find user in cache
  const current = await getCachedUsers();
  let user = current.find((u) => u.uid === uid);

  // 2. If not found in cache, fetch directly from Firestore doc
  if (!user && navigator.onLine) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        user = snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Failed to fetch user from cloud during status update:', e);
    }
  }

  // 3. Construct updated user profile
  const updatedUser: UserProfile = {
    ...(user || {
      uid,
      userType: 'secretary',
      role: 'admin',
      status: 'approved',
      displayName: 'Secretary',
      email: `${uid}@vclandpass.mizoram.gov.in`,
    }),
    uid,
    status,
    isLifetimeApproved: status === 'approved',
    role: status === 'approved' ? 'admin' : (user?.role || 'member'),
    reviewedAt: nowIso,
    reviewedBy: reviewerName,
    rejectionReason: status === 'rejected' ? (rejectionReason || 'Details could not be verified') : '',
  };

  // 4. Update Firestore and Realtime Database directly
  if (navigator.onLine) {
    try {
      const payload = cleanForFirestore(updatedUser);
      await setDoc(doc(db, 'users', uid), payload, { merge: true });
      try {
        await saveUserToRTDB(payload);
      } catch (err) {
        console.warn('Realtime Database write user error:', err);
      }
    } catch (e) {
      console.error('CRITICAL: Failed to update user status in Firestore:', e);
      throw e;
    }
  }

  // 5. Update local cache
  const exists = current.some((u) => u.uid === uid);
  const updatedCache = exists
    ? current.map((u) => (u.uid === uid ? updatedUser : u))
    : [updatedUser, ...current];
  await setCachedUsers(updatedCache);

  return updatedUser;
}

// User Profile Update (Username, Password/Secret Key, Profile Photo, Phone)
export async function updateUserProfile(
  uid: string,
  updates: {
    username?: string;
    displayName?: string;
    password?: string;
    passkey?: string;
    profilePhotoUrl?: string;
    phoneNumber?: string;
  }
): Promise<UserProfile | null> {
  const current = await getCachedUsers();
  let user = current.find((u) => u.uid === uid);

  if (!user && navigator.onLine) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        user = snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Failed to get user doc from cloud:', e);
    }
  }

  if (!user) return null;

  const updatedUser: UserProfile = {
    ...user,
    username: updates.username !== undefined ? updates.username.trim() : user.username,
    displayName: updates.displayName !== undefined ? updates.displayName.trim() : (updates.username || user.displayName),
    password: updates.password !== undefined ? updates.password.trim() : user.password,
    passkey: updates.passkey !== undefined ? updates.passkey.trim() : (updates.password || user.passkey),
    profilePhotoUrl: updates.profilePhotoUrl !== undefined ? updates.profilePhotoUrl : user.profilePhotoUrl,
    phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber.trim() : user.phoneNumber,
  };

  await saveOrUpdateUser(updatedUser);
  return updatedUser;
}

// Authenticate VC Secretary by Username (or Phone) and Secret Key / Password
export async function authenticateSecretary(
  username: string,
  secretKey: string
): Promise<{ user: UserProfile | null; error?: string }> {
  const cleanUser = username.trim().toLowerCase();
  const cleanKey = secretKey.trim();

  if (!cleanUser || !cleanKey) {
    return { user: null, error: 'Username and Secret Key are both required.' };
  }

  // Fetch all users from cloud (or offline cache)
  let allUsers = await fetchUsersFromCloud();
  if (!allUsers || allUsers.length === 0) {
    allUsers = await getCachedUsers();
  }

  // Look for matching VC Secretary account
  const matched = allUsers.find((u) => {
    const uUsername = (u.username || '').toLowerCase().trim();
    const uName = (u.displayName || '').toLowerCase().trim();
    const uPhone = (u.phoneNumber || '').replace(/\D/g, '');
    const searchPhone = cleanUser.replace(/\D/g, '');

    const usernameMatches =
      uUsername === cleanUser ||
      uName === cleanUser ||
      uName.replace(' (vc secretary)', '') === cleanUser;

    const phoneMatches = searchPhone.length >= 8 && uPhone.includes(searchPhone);

    const keyMatches = (u.passkey === cleanKey) || (u.password === cleanKey);

    return (usernameMatches || phoneMatches) && keyMatches;
  });

  if (!matched) {
    return {
      user: null,
      error: 'Invalid VC Secretary username or secret key. Please check your credentials.',
    };
  }

  return { user: matched };
}

export function verifyFullAuthorityKey(key: string): boolean {
  return key.trim() === FULL_AUTHORITY_KEY_VALUE;
}

// Approve Land Pass to make it Live for Lifetime
export async function approveLandPassLive(
  passId: string,
  approverName: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  try {
    if (navigator.onLine) {
      await setDoc(
        doc(db, 'land_passes', passId),
        cleanForFirestore({
          approvalStatus: 'live',
          approvedAt: nowIso,
          approvedBy: approverName,
        }),
        { merge: true }
      );

      try {
        const { rtdb } = await import('./firebase');
        if (rtdb) {
          const { ref, update } = await import('firebase/database');
          await update(ref(rtdb, `land_passes/${passId}`), {
            approvalStatus: 'live',
            approvedAt: nowIso,
            approvedBy: approverName,
          });
        }
      } catch (err) {
        console.warn('Realtime database pass approval update:', err);
      }
    }
    return true;
  } catch (e) {
    console.warn('Failed to update pass approval in Firestore:', e);
    return false;
  }
}
