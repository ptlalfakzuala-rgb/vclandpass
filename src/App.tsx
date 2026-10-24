import React, { useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, testConnection } from './services/firebase';
import {
  LandPass,
  UserProfile,
  SyncStatus,
  VillageConfig,
  PrintSettings
} from './types';
import {
  getCachedPasses,
  setCachedPasses,
  seedInitialPassesIfEmpty,
  queueOfflineMutation,
  syncOfflineQueueToFirestore,
} from './services/offlineSync';
import {
  getCachedVillages,
  setCachedVillages,
  getStoredActiveVillageId,
  setStoredActiveVillageId,
  saveVillageConfig,
  fetchVillagesFromCloud,
  getVillageForUser,
  isVillageProfileConfigured,
} from './services/villageService';
import {
  fetchUsersFromCloud,
  saveOrUpdateUser,
  updateUserStatus,
  getCachedUsers,
  setCachedUsers,
  approveLandPassLive,
  cleanForFirestore,
} from './services/userService';
import { logActivity } from './services/auditLogger';
import {
  savePassToRTDB,
  deletePassFromRTDB,
  saveUserToRTDB,
  saveVillageToRTDB,
  transferAllDataToRTDB,
  subscribeToRTDBPasses,
  subscribeToRTDBUsers,
  subscribeToRTDBVillages,
} from './services/realtimeSync';

// UI Components
import { Navbar } from './components/Navbar';
import { LandPassCard } from './components/LandPassCard';
import { PrintableLandPass } from './components/PrintableLandPass';
import { AddEditLandPassModal } from './components/AddEditLandPassModal';
import { AuthPortalPage } from './components/AuthPortalPage';
import { SecretaryProfilePage } from './components/SecretaryProfilePage';
import { VillageCouncilPage } from './components/VillageCouncilPage';
import { UserProfileModal } from './components/UserProfileModal';
import { VillageProfileModal } from './components/VillageProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { VerifyPassModal } from './components/VerifyPassModal';
import { FullAuthorityModal } from './components/FullAuthorityModal';
import { AuthorityKeyModal } from './components/AuthorityKeyModal';
import { DeletePassModal } from './components/DeletePassModal';

import {
  Search,
  Plus,
  FileText,
  ShieldCheck,
  Download,
  TreePine,
  Home,
  CheckCircle2,
  Lock,
  QrCode,
  Settings,
  Clock,
  XCircle,
  Building2,
  User,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

const PRINT_SETTINGS_STORAGE_KEY = 'mizoram_vc_print_settings';
const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  theme: 'classic_heritage',
  fontStyle: 'sans',
  showWatermark: true,
  borderStyle: 'double',
  fontSize: 'standard',
};

// Default Mizoram generic template when no user-specific village exists yet
const DEFAULT_GENERIC_VILLAGE: VillageConfig = {
  id: 'mizoram_generic',
  villageName: 'VILLAGE COUNCIL, MIZORAM',
  blockName: '',
  districtName: 'Mizoram',
  stateName: 'Mizoram',
  pinCode: '',
  huanRamPrefix: 'MZ-VC-HR-',
  inHmunPrefix: 'MZ-VC-IH-',
  conditionsAndTerms: `CONDITIONS & RESTRICTION
1. Huan ram / In hmun hi ramri ziah anga pek a ni a.
2. An ri-te inkar chin a huam ang.
3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.
4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.
5. VC ten tul bik thil ah an cancel thei ang.
6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.`,
  presidentName: '',
  emblemLogoUrl: '/assets/aistudio/images__3__109dbb99.jpg',
};

export default function App() {
  const [passes, setPasses] = useState<LandPass[]>([]);
  const [villages, setVillages] = useState<VillageConfig[]>([]);
  const [activeVillageId, setActiveVillageId] = useState<string>(getStoredActiveVillageId());

  // User Authentication & Roles
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('mizoram_vc_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Full Authority Mode State (Key is 785392)
  const [isFullAuthority, setIsFullAuthority] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('mizoram_vc_full_authority') === 'true';
    } catch {
      return false;
    }
  });
  const [isFullAuthorityModalOpen, setIsFullAuthorityModalOpen] = useState<boolean>(false);
  const [isAuthorityKeyModalOpen, setIsAuthorityKeyModalOpen] = useState<boolean>(false);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    navigator.onLine ? 'online' : 'offline'
  );
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Search & Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'huan_ram' | 'in_hmun'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'pass_asc' | 'name_asc'>('date_desc');

  // Settings State for Themes & Fonts
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    try {
      const raw = localStorage.getItem(PRINT_SETTINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_PRINT_SETTINGS;
    } catch {
      return DEFAULT_PRINT_SETTINGS;
    }
  });

  const [currentPage, setCurrentPage] = useState<'passes' | 'secretary_profile' | 'village_council'>('passes');
  const [selectedPassForPrint, setSelectedPassForPrint] = useState<LandPass | null>(null);
  const [editingPass, setEditingPass] = useState<LandPass | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState<boolean>(false);
  const [isVillageProfileOpen, setIsVillageProfileOpen] = useState<boolean>(false);
  const [isMandatoryProfileUpdate, setIsMandatoryProfileUpdate] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState<boolean>(false);

  // Users list
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Warning dialogue box state for deleting a Land Pass
  const [passToDeleteForWarning, setPassToDeleteForWarning] = useState<LandPass | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Distinct Village for Every User
  const currentVillage: VillageConfig = getVillageForUser(currentUser, villages);

  // Authority Approval & Village Profile Configuration Gates:
  // "do not make it live New Land Pass Issue until Configure Village Profile is done"
  const isApproved = isFullAuthority || currentUser?.status === 'approved';
  const isVillageConfigured = isVillageProfileConfigured(currentVillage);
  const canIssuePass = isApproved && isVillageConfigured;
  const isAdmin = true;

  // Realtime Firestore Data Sync
  useEffect(() => {
    testConnection();

    // Load villages from Firestore with Realtime listener
    getCachedVillages().then((cachedV) => {
      setVillages(cachedV);
      fetchVillagesFromCloud().then((cloudV) => {
        if (cloudV && cloudV.length > 0) setVillages(cloudV);
      });
    });

    // Load registered users with Realtime listener
    getCachedUsers().then((cachedUsers) => {
      setUsersList(cachedUsers);
      fetchUsersFromCloud().then((cloudUsers) => {
        if (cloudUsers && cloudUsers.length > 0) setUsersList(cloudUsers);
      });
    });

    // Load cached passes
    getCachedPasses().then((cached) => {
      if (cached && cached.length > 0) {
        setPasses(cached);
      } else {
        seedInitialPassesIfEmpty().then((seeded) => {
          setPasses(seeded);
        });
      }
    });

    // Auto-store/transfer all database state to Firebase Realtime Database
    if (navigator.onLine) {
      setTimeout(() => {
        transferAllDataToRTDB().catch(() => {});
      }, 1500);
    }

    // Network status listener
    const handleOnline = () => {
      setSyncStatus('syncing');
      syncOfflineQueueToFirestore().then((count) => {
        setSyncStatus('online');
        setPendingSyncCount(0);
        if (count > 0) {
          showNotification(`Connection restored! Synced ${count} offline updates to cloud.`, 'success');
        }
      });
    };

    const handleOffline = () => {
      setSyncStatus('offline');
      showNotification('Operating in offline mode. Records are encrypted on device.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Live Snapshot Listeners for passes and users (Firestore + Firebase Realtime Database)
    let unsubscribeFirestorePasses: (() => void) | null = null;
    let unsubscribeFirestoreUsers: (() => void) | null = null;
    let unsubscribeRTDBPasses: (() => void) | null = null;
    let unsubscribeRTDBUsers: (() => void) | null = null;
    let unsubscribeRTDBVillages: (() => void) | null = null;

    if (navigator.onLine) {
      // 1. Firebase Realtime Database Live Listeners
      try {
        unsubscribeRTDBPasses = subscribeToRTDBPasses((livePasses) => {
          if (livePasses && livePasses.length > 0) {
            setPasses(livePasses);
            setCachedPasses(livePasses);
          }
        });

        unsubscribeRTDBUsers = subscribeToRTDBUsers((liveUsers) => {
          if (liveUsers && liveUsers.length > 0) {
            setUsersList(liveUsers);
            setCachedUsers(liveUsers);

            let storedUser: UserProfile | null = null;
            try {
              const raw = localStorage.getItem('mizoram_vc_current_user');
              if (raw) storedUser = JSON.parse(raw);
            } catch {}

            const activeIdentity = storedUser || currentUser;
            if (activeIdentity) {
              const updatedSelf = liveUsers.find(
                (u) =>
                  u.uid === activeIdentity.uid ||
                  (u.username && activeIdentity.username && u.username.toLowerCase() === activeIdentity.username.toLowerCase())
              );

              if (updatedSelf) {
                const hadPendingStatus = activeIdentity.status !== 'approved';
                const isNowApproved = updatedSelf.status === 'approved';

                if (updatedSelf.status !== activeIdentity.status || updatedSelf.role !== activeIdentity.role) {
                  setCurrentUser(updatedSelf);
                  localStorage.setItem('mizoram_vc_current_user', JSON.stringify(updatedSelf));
                  if (hadPendingStatus && isNowApproved) {
                    showNotification(
                      '🎉 Your VC Secretary account has been Approved by Authority! Pass Issuing is now Live for Lifetime.',
                      'success'
                    );
                  }
                }
              }
            }
          }
        });

        unsubscribeRTDBVillages = subscribeToRTDBVillages((liveVillages) => {
          if (liveVillages && liveVillages.length > 0) {
            setVillages(liveVillages);
            setCachedVillages(liveVillages);
          }
        });
      } catch (err) {
        console.warn('Realtime Database listener init:', err);
      }

      // 2. Firestore Snapshot Listeners
      try {
        const passesCol = collection(db, 'land_passes');
        unsubscribeFirestorePasses = onSnapshot(
          passesCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const livePasses: LandPass[] = [];
              snapshot.forEach((d) => {
                livePasses.push(d.data() as LandPass);
              });
              setPasses(livePasses);
              setCachedPasses(livePasses);
            }
          },
          (err) => {
            console.warn('Firestore snapshot error (using local cache):', err);
          }
        );

        const usersCol = collection(db, 'users');
        unsubscribeFirestoreUsers = onSnapshot(
          usersCol,
          (snapshot) => {
            const liveUsers: UserProfile[] = [];
            snapshot.forEach((d) => {
              liveUsers.push(d.data() as UserProfile);
            });
            setUsersList(liveUsers);
            setCachedUsers(liveUsers);

            // Auto sync: check if the logged in user or stored user was updated in cloud (e.g. approved by Authority!)
            let storedUser: UserProfile | null = null;
            try {
              const raw = localStorage.getItem('mizoram_vc_current_user');
              if (raw) storedUser = JSON.parse(raw);
            } catch {}

            const activeIdentity = storedUser || currentUser;
            if (activeIdentity) {
              const updatedSelf = liveUsers.find(
                (u) =>
                  u.uid === activeIdentity.uid ||
                  (u.username && activeIdentity.username && u.username.toLowerCase() === activeIdentity.username.toLowerCase())
              );

              if (updatedSelf) {
                const hadPendingStatus = activeIdentity.status !== 'approved';
                const isNowApproved = updatedSelf.status === 'approved';

                if (updatedSelf.status !== activeIdentity.status || updatedSelf.role !== activeIdentity.role) {
                  setCurrentUser(updatedSelf);
                  localStorage.setItem('mizoram_vc_current_user', JSON.stringify(updatedSelf));
                  if (hadPendingStatus && isNowApproved) {
                    showNotification(
                      '🎉 Your VC Secretary account has been Approved by Authority! Pass Issuing is now Live for Lifetime.',
                      'success'
                    );
                  }
                }
              }
            }
          },
          (err) => {
            console.warn('Users realtime snapshot error:', err);
          }
        );
      } catch (e) {
        console.warn('Could not attach Firestore listener:', e);
      }
    }

    return () => {
      if (unsubscribeRTDBPasses) unsubscribeRTDBPasses();
      if (unsubscribeRTDBUsers) unsubscribeRTDBUsers();
      if (unsubscribeRTDBVillages) unsubscribeRTDBVillages();
      if (unsubscribeFirestorePasses) unsubscribeFirestorePasses();
      if (unsubscribeFirestoreUsers) unsubscribeFirestoreUsers();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser?.uid, currentUser?.status]);

  // Save Print Settings
  const handleSaveSettings = (newSettings: PrintSettings) => {
    setPrintSettings(newSettings);
    localStorage.setItem(PRINT_SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    showNotification('Print & Certificate display settings applied!', 'success');
  };

  // Save Village Profile (No pre-filled fake data)
  const handleSaveVillageProfile = async (updatedConfig: VillageConfig) => {
    await saveVillageConfig(updatedConfig);
    try {
      await saveVillageToRTDB(cleanForFirestore(updatedConfig));
    } catch (e) {
      console.warn('Realtime Database village write:', e);
    }
    setVillages((prev) => {
      const exists = prev.some((v) => v.id === updatedConfig.id);
      if (exists) {
        return prev.map((v) => (v.id === updatedConfig.id ? updatedConfig : v));
      }
      return [updatedConfig, ...prev];
    });

    setActiveVillageId(updatedConfig.id);
    setStoredActiveVillageId(updatedConfig.id);

    // Sync currentUser's village reference
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        villageId: updatedConfig.id,
        villageName: updatedConfig.villageName,
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('mizoram_vc_current_user', JSON.stringify(updatedUser));
      await saveOrUpdateUser(updatedUser);
      setUsersList((prev) => prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)));
    }

    setIsMandatoryProfileUpdate(false);
    showNotification(`Village Council profile for ${updatedConfig.villageName} saved!`, 'success');
  };

  // Full Authority Key Verified Handlers
  const handleAuthorityKeySuccess = () => {
    setIsFullAuthority(true);
    try {
      sessionStorage.setItem('mizoram_vc_full_authority', 'true');
    } catch {}
    logActivity(
      'AUTHORITY_ELEVATION',
      'full_authority',
      'Full Authority',
      currentUser?.displayName || 'Administrator',
      'Unlocked Full Authority Mode for registration & pass approvals'
    );
    showNotification('Full Authority Mode Unlocked! Reviewing registrations.', 'success');
    setIsFullAuthorityModalOpen(true);
  };

  const handleExitAuthorityMode = () => {
    setIsFullAuthority(false);
    try {
      sessionStorage.removeItem('mizoram_vc_full_authority');
    } catch {}
    setIsFullAuthorityModalOpen(false);
    showNotification('Exited Full Authority Mode.', 'info');
  };

  // Full Authority User Approve / Reject: Once approved, completely live for lifetime
  const handleApproveUser = async (uid: string) => {
    try {
      // 1. Instant optimistic state update
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? {
                ...u,
                status: 'approved',
                isLifetimeApproved: true,
                role: 'admin',
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Full Authority',
              }
            : u
        )
      );

      // 2. Persist to Firestore and local cache
      const updated = await updateUserStatus(uid, 'approved', 'Full Authority');

      // 3. Update current user if this is the active user
      if (currentUser?.uid === uid || (currentUser && currentUser.username === updated?.username)) {
        const freshUser = updated || {
          ...currentUser,
          status: 'approved',
          isLifetimeApproved: true,
          role: 'admin',
        };
        setCurrentUser(freshUser);
        localStorage.setItem('mizoram_vc_current_user', JSON.stringify(freshUser));
      }

      await logActivity(
        'USER_REGISTRATION_APPROVED',
        uid,
        updated?.displayName || updated?.username || 'User',
        'Full Authority',
        `Approved ${updated?.userType || 'secretary'} registration for lifetime access (${updated?.displayName || updated?.username || uid})`
      );

      showNotification(
        `Registration for ${updated?.displayName || updated?.username || 'Secretary'} approved! Completely Live for Lifetime.`,
        'success'
      );
    } catch (err: any) {
      console.error('Error approving user:', err);
      showNotification(`Failed to save approval to database: ${err?.message || err}`, 'warn');
    }
  };

  const handleRejectUser = async (uid: string, reason?: string) => {
    try {
      // 1. Instant optimistic state update
      setUsersList((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? {
                ...u,
                status: 'rejected',
                rejectionReason: reason || 'Details could not be verified',
                reviewedAt: new Date().toISOString(),
                reviewedBy: 'Full Authority',
              }
            : u
        )
      );

      const updated = await updateUserStatus(uid, 'rejected', 'Full Authority', reason);
      if (currentUser?.uid === uid) {
        const freshUser = updated || { ...currentUser, status: 'rejected', rejectionReason: reason };
        setCurrentUser(freshUser);
        localStorage.setItem('mizoram_vc_current_user', JSON.stringify(freshUser));
      }

      await logActivity(
        'USER_REGISTRATION_REJECTED',
        uid,
        updated?.displayName || updated?.username || 'User',
        'Full Authority',
        `Rejected ${updated?.userType || 'secretary'} registration. Reason: ${reason || 'N/A'}`
      );

      showNotification(`Registration for ${updated?.displayName || updated?.username || 'user'} rejected.`, 'warn');
    } catch (err: any) {
      console.error('Error rejecting user:', err);
      showNotification(`Error rejecting user: ${err?.message || err}`, 'warn');
    }
  };

  // Full Authority Land Pass Live Approval
  const handleApprovePass = async (passId: string) => {
    try {
      setPasses((prev) =>
        prev.map((p) => (p.id === passId ? { ...p, approvalStatus: 'live', approvedAt: new Date().toISOString(), approvedBy: 'Full Authority' } : p))
      );

      await approveLandPassLive(passId, 'Full Authority');

      await logActivity(
        'PASS_APPROVED_LIVE',
        passId,
        passId,
        'Full Authority',
        `Approved Land Pass ${passId} to Live for Lifetime status`
      );
      showNotification('Land Pass approved! Now completely Live for Lifetime.', 'success');
    } catch (err: any) {
      console.error('Error approving pass:', err);
      showNotification(`Error approving pass: ${err?.message || err}`, 'warn');
    }
  };

  // Logout Handler: Immediately clears session and redirects back to Login Portal page
  const handleLogout = () => {
    signOut(auth);
    setCurrentUser(null);
    setIsFullAuthority(false);
    try {
      sessionStorage.removeItem('mizoram_vc_full_authority');
    } catch {}
    localStorage.removeItem('mizoram_vc_current_user');
    showNotification('Logged out successfully. Returned to Login page.', 'info');
  };

  // Manual Trigger to re-sync
  const handleManualSync = async () => {
    setSyncStatus('syncing');
    try {
      const count = await syncOfflineQueueToFirestore();
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
      setPendingSyncCount(0);
      showNotification(
        navigator.onLine
          ? `Synced successfully with Firebase. ${count} updates committed.`
          : 'Refreshed local encrypted cache.',
        'success'
      );
    } catch {
      setSyncStatus(navigator.onLine ? 'online' : 'offline');
    }
  };

  // Add or Edit Land Record: Newly created pass is pending until Authority approved (unless created by Full Authority)
  const handleSavePass = async (
    passData: Omit<LandPass, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud'>,
    isEdit: boolean,
    existingId?: string
  ) => {
    if (!isVillageConfigured) {
      showNotification('Configure Village Profile must be completed before issuing a Land Pass.', 'warn');
      setIsMandatoryProfileUpdate(true);
      setIsVillageProfileOpen(true);
      return;
    }

    const nowIso = new Date().toISOString();
    const id = isEdit && existingId ? existingId : `MZ_${passData.passType.toUpperCase()}_${Date.now()}`;

    const newOrUpdatedPass: LandPass = {
      ...passData,
      id,
      villageId: currentVillage.id,
      villageName: currentVillage.villageName,
      createdBy: isEdit && editingPass?.createdBy ? editingPass.createdBy : (currentUser?.uid || 'authority'),
      createdAt: isEdit && editingPass ? editingPass.createdAt : nowIso,
      updatedAt: nowIso,
      syncedToCloud: navigator.onLine,
      approvalStatus: (isFullAuthority || (isApproved && isVillageConfigured))
        ? 'live'
        : isEdit && editingPass?.approvalStatus
        ? editingPass.approvalStatus
        : 'pending_approval',
    };

    let updatedList: LandPass[];
    if (isEdit) {
      updatedList = passes.map((p) => (p.id === id ? newOrUpdatedPass : p));
    } else {
      updatedList = [newOrUpdatedPass, ...passes];
    }
    setPasses(updatedList);
    await setCachedPasses(updatedList);

    const cleanedPass = cleanForFirestore({ ...newOrUpdatedPass, syncedToCloud: true });
    if (navigator.onLine) {
      try {
        const docRef = doc(db, 'land_passes', id);
        await setDoc(docRef, cleanedPass);
      } catch {
        queueOfflineMutation({
          id,
          type: isEdit ? 'UPDATE' : 'CREATE',
          pass: newOrUpdatedPass,
          timestamp: Date.now(),
        });
        setPendingSyncCount((prev) => prev + 1);
      }
    } else {
      queueOfflineMutation({
        id,
        type: isEdit ? 'UPDATE' : 'CREATE',
        pass: newOrUpdatedPass,
        timestamp: Date.now(),
      });
      setPendingSyncCount((prev) => prev + 1);
    }

    // Always mirror to Firebase Realtime Database
    try {
      await savePassToRTDB(cleanedPass);
    } catch (e) {
      console.warn('Realtime Database pass write:', e);
    }

    await logActivity(
      isEdit ? 'UPDATE_PASS' : 'CREATE_PASS',
      id,
      newOrUpdatedPass.passNumber,
      currentUser?.displayName || currentUser?.username || 'Secretary',
      `${isEdit ? 'Updated' : 'Issued new'} ${newOrUpdatedPass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'} Pass for ${newOrUpdatedPass.ownerName} (${newOrUpdatedPass.passNumber})`
    );

    setIsAddEditOpen(false);
    setEditingPass(null);

    // Auto-open Printable View for document review
    setSelectedPassForPrint(newOrUpdatedPass);
    showNotification(
      isEdit
        ? `Pass ${newOrUpdatedPass.passNumber} updated!`
        : `New Land Pass ${newOrUpdatedPass.passNumber} issued!`,
      'success'
    );
  };

  // Open Warning Dialogue Box to delete a Land Pass
  const handleDeletePass = (passToDelete: LandPass) => {
    setPassToDeleteForWarning(passToDelete);
  };

  // Confirmed Permanent Delete Execution from Warning Dialogue Box
  const handleConfirmDeletePass = async (passToDelete: LandPass) => {
    const filtered = passes.filter((p) => p.id !== passToDelete.id);
    setPasses(filtered);
    await setCachedPasses(filtered);

    // If currently viewing deleted pass in print preview or editing, close modal
    if (selectedPassForPrint?.id === passToDelete.id) {
      setSelectedPassForPrint(null);
    }
    if (editingPass?.id === passToDelete.id) {
      setEditingPass(null);
    }

    if (navigator.onLine) {
      try {
        await deleteDoc(doc(db, 'land_passes', passToDelete.id));
      } catch {
        queueOfflineMutation({
          id: passToDelete.id,
          type: 'DELETE',
          pass: passToDelete,
          timestamp: Date.now(),
        });
        setPendingSyncCount((prev) => prev + 1);
      }
    } else {
      queueOfflineMutation({
        id: passToDelete.id,
        type: 'DELETE',
        pass: passToDelete,
        timestamp: Date.now(),
      });
      setPendingSyncCount((prev) => prev + 1);
    }

    try {
      await deletePassFromRTDB(passToDelete.id);
    } catch (e) {
      console.warn('Realtime Database pass delete:', e);
    }

    await logActivity(
      'DELETE_PASS',
      passToDelete.id,
      passToDelete.passNumber,
      currentUser?.displayName || currentUser?.username || 'Secretary',
      `Permanently deleted land pass ${passToDelete.passNumber} for ${passToDelete.ownerName}`
    );

    showNotification(
      `Land Pass ${passToDelete.passNumber} (${passToDelete.ownerName}) permanently deleted.`,
      'info'
    );
    setPassToDeleteForWarning(null);
  };

  // Transfer all database records to Firebase Realtime Database
  const handleTransferToRTDB = async () => {
    showNotification('Transferring all data to Firebase Realtime Database...', 'info');
    try {
      const result = await transferAllDataToRTDB(passes, villages, usersList);
      if (result.success) {
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'warn');
      }
    } catch (e: any) {
      showNotification(`Realtime Database transfer error: ${e?.message || e}`, 'warn');
    }
  };

  // Export Council Database JSON Archive
  const handleExportArchive = () => {
    const perspectivePasses = passes.filter(
      (p) =>
        !p.villageId ||
        p.villageId === currentVillage.id ||
        (p.villageName && p.villageName.toLowerCase() === currentVillage.villageName.toLowerCase())
    );
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(perspectivePasses, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `VC_Land_Pass_Registry_${currentVillage.villageName}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification(`Council registry archive exported.`, 'success');
  };

  // Strictly scoped to user's dedicated village and profile (never shared with other users)
  const perspectivePasses = passes.filter((p) => {
    if (!currentUser && !isFullAuthority) return false;
    // Master Full Authority (Key 785392) can view all passes for administration and verification
    if (isFullAuthority) return true;

    // Never show sample/bootstrap passes from other villages to any real secretary
    if (p.createdBy === 'system_bootstrap') return false;

    // 1. Pass was created by this logged-in secretary
    if (currentUser?.uid && p.createdBy === currentUser.uid) return true;

    // 2. Pass was issued for this user's distinct village council
    const userVillageId = currentUser?.villageId || currentVillage.id;
    const isGenericVillage = !userVillageId || userVillageId === 'village_default' || userVillageId === 'mizoram_generic';
    if (!isGenericVillage && p.villageId === userVillageId) {
      return true;
    }

    return false;
  });

  const filteredPasses = perspectivePasses.filter((p) => {
    const matchesFilter =
      activeFilter === 'all' ? true : p.passType === activeFilter;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.passNumber.toLowerCase().includes(term) ||
      p.ownerName.toLowerCase().includes(term) ||
      p.parentName.toLowerCase().includes(term) ||
      p.contactNumber.toLowerCase().includes(term) ||
      p.boundaryNorth.toLowerCase().includes(term) ||
      p.boundaryEast.toLowerCase().includes(term) ||
      p.boundaryWest.toLowerCase().includes(term) ||
      p.boundarySouth.toLowerCase().includes(term) ||
      p.locationAddress.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const sortedPasses = [...filteredPasses].sort((a, b) => {
    if (sortBy === 'date_desc') return b.issueDate.localeCompare(a.issueDate);
    if (sortBy === 'date_asc') return a.issueDate.localeCompare(b.issueDate);
    if (sortBy === 'pass_asc') return a.passNumber.localeCompare(b.passNumber);
    if (sortBy === 'name_asc') return a.ownerName.localeCompare(b.ownerName);
    return 0;
  });

  const huanRamCount = perspectivePasses.filter((p) => p.passType === 'huan_ram').length;
  const inHmunCount = perspectivePasses.filter((p) => p.passType === 'in_hmun').length;

  // =========================================================================
  // VIEW 1: NOT LOGGED IN -> DEDICATED AUTHENTICATION & PUBLIC PORTAL PAGE
  // "when logout, go back to login page. Do not make available for public view mode,
  // make only Land Pass QR Code verification (with camera scanner) in login page for public"
  // "Default Letter Head for Website is VILLAGE COUNCIL, MIZORAM"
  // "do not show Village, Block, State name, Pin code and logo before creating user."
  // =========================================================================
  if (!currentUser && !isFullAuthority) {
    return (
      <>
        <AuthPortalPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('mizoram_vc_current_user', JSON.stringify(user));
            showNotification(`Welcome, ${user.displayName || user.username}!`, 'success');
          }}
          onOpenAuthorityMode={() => {
            setIsFullAuthority(true);
            try {
              sessionStorage.setItem('mizoram_vc_full_authority', 'true');
            } catch {}
            setIsFullAuthorityModalOpen(true);
          }}
          allPasses={passes}
          onViewPass={(pass) => {
            setSelectedPassForPrint(pass);
          }}
        />

        {/* Printable Land Pass Modal (if public verifies and views certificate) */}
        {selectedPassForPrint && (
          <PrintableLandPass
            pass={selectedPassForPrint}
            village={
              villages.find((v) => v.id === selectedPassForPrint.villageId) || {
                ...DEFAULT_GENERIC_VILLAGE,
                villageName: selectedPassForPrint.villageName || DEFAULT_GENERIC_VILLAGE.villageName,
              }
            }
            onClose={() => setSelectedPassForPrint(null)}
            currentUserEmail={null}
            settings={printSettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* Full Authority Modal if unlocked via key */}
        <FullAuthorityModal
          isOpen={isFullAuthorityModalOpen}
          onClose={() => setIsFullAuthorityModalOpen(false)}
          users={usersList}
          passes={passes}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
          onApprovePass={handleApprovePass}
          onExitAuthorityMode={handleExitAuthorityMode}
        />
      </>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED IN COUNCIL DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900 selection:bg-emerald-200">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        isAdmin={isAdmin}
        isFullAuthority={isFullAuthority}
        canIssuePass={canIssuePass}
        isVillageConfigured={isVillageConfigured}
        syncStatus={syncStatus}
        pendingSyncCount={pendingSyncCount}
        currentVillage={currentVillage}
        currentPage={currentPage}
        onNavigatePage={(page) => setCurrentPage(page)}
        onOpenVillageProfile={() => {
          setIsMandatoryProfileUpdate(!isVillageConfigured);
          setIsVillageProfileOpen(true);
        }}
        onOpenUserProfile={() => setCurrentPage('secretary_profile')}
        onOpenRegister={() => {}}
        onOpenAuth={() => {}}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAddPass={() => {
          setEditingPass(null);
          setIsAddEditOpen(true);
        }}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onManualSync={handleManualSync}
        onOpenFullAuthority={() => setIsFullAuthorityModalOpen(true)}
        onOpenAuthorityKeyModal={() => setIsAuthorityKeyModalOpen(true)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Temporary Alert Banner */}
      {notification && (
        <div className="bg-emerald-950 text-white px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2 shadow-inner transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* VIEW A: DEDICATED SECRETARY PROFILE PAGE */}
        {currentPage === 'secretary_profile' && currentUser && (
          <SecretaryProfilePage
            currentUser={currentUser}
            currentVillage={currentVillage}
            userPasses={perspectivePasses}
            onProfileUpdated={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('mizoram_vc_current_user', JSON.stringify(updated));
              setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
              showNotification('Secretary profile updated successfully!', 'success');
            }}
            onNavigateToVillage={() => setCurrentPage('village_council')}
            onNavigateToPasses={() => setCurrentPage('passes')}
          />
        )}

        {/* VIEW B: DEDICATED VILLAGE COUNCIL PAGE */}
        {currentPage === 'village_council' && currentUser && (
          <VillageCouncilPage
            currentVillage={currentVillage}
            currentUser={currentUser}
            onVillageSaved={handleSaveVillageProfile}
            onNavigateToSecretaryProfile={() => setCurrentPage('secretary_profile')}
            onNavigateToPasses={() => setCurrentPage('passes')}
          />
        )}

        {/* VIEW C: LAND PASSES REGISTRY */}
        {currentPage === 'passes' && (
          <>
            {/* Registration Pending Review Notification Banner for VC Secretary */}
        {currentUser?.userType === 'secretary' && currentUser?.status === 'pending' && (
          <div className="bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
            <div className="flex items-start gap-3.5">
              <Clock className="w-6 h-6 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>Account Pending Full Authority Approval</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    UNDER REVIEW
                  </span>
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                  Your VC Secretary account registration and ₹299 payment proof have been submitted. <strong>Issuing new Land Passes is locked</strong> until approved by Authority. Once approved, it is completely Live for Lifetime!
                </p>
              </div>
            </div>

            {/* Direct WhatsApp / Email Notification triggers */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://wa.me/917005504074?text=${encodeURIComponent(
                  `Hello Authority, my VC Secretary username is ${currentUser.username || currentUser.displayName} (Phone: ${currentUser.phoneNumber || 'N/A'}). I have uploaded the ₹299 payment screenshot. Please approve my account. Thank you!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp Authority (7005504074)</span>
              </a>

              <a
                href={`mailto:ptlalfakzuala@gmail.com?subject=${encodeURIComponent(
                  `Approval Needed: VC Secretary ${currentUser.username || currentUser.displayName}`
                )}&body=${encodeURIComponent(
                  `Hello Authority,\n\nI have registered as VC Secretary with Username: ${currentUser.username || currentUser.displayName}.\nPlease review my ₹299 payment proof and approve my account.\n\nThank you.`
                )}`}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Authority</span>
              </a>
            </div>
          </div>
        )}

        {/* Registration Rejected Notification Banner */}
        {currentUser?.status === 'rejected' && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3.5 text-rose-950 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-rose-950">
                Registration Rejected by Full Authority
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                {currentUser.rejectionReason
                  ? `Reason: ${currentUser.rejectionReason}. `
                  : 'Your application could not be verified. '}
                Please contact Authority at <strong>ptlalfakzuala@gmail.com</strong> or WhatsApp <strong>7005504074</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Perspective Council Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-700" />
                {currentVillage.villageName} Council
              </span>
              <span className="text-xs font-mono text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                {currentVillage.districtName || 'Mizoram'} {currentVillage.blockName ? `• ${currentVillage.blockName}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {currentVillage.logoUrl ? (
                <img
                  src={currentVillage.logoUrl}
                  alt={`${currentVillage.villageName} Logo`}
                  className="w-14 h-14 object-contain rounded-xl border border-neutral-200 p-0.5 bg-white shadow-2xs"
                />
              ) : (
                <div className="w-14 h-14 bg-emerald-950 text-white rounded-xl flex flex-col items-center justify-center p-1 font-serif font-black shadow-2xs">
                  <span className="text-xs text-amber-400">VC</span>
                  <span className="text-[8px] text-neutral-300">COURT</span>
                </div>
              )}
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-black text-neutral-900 leading-tight">
                  {currentVillage.villageName} Land Registry
                </h2>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">
                  Assigned Prefixes: Huan Ram (<strong>{currentVillage.huanRamPrefix || 'MZ-HR-'}</strong>) &bull; In Hmun (<strong>{currentVillage.inHmunPrefix || 'MZ-IH-'}</strong>)
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl leading-relaxed pt-1">
              Official Land Pass registry system for {currentVillage.villageName}. Issue and archive A4 certificates with automatic sequential numbering, QR verification, and separate conditions back page.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-center min-w-[70px]">
                <span className="text-[11px] text-neutral-500 font-medium block">Total</span>
                <span className="text-xl font-black font-mono text-neutral-900">{perspectivePasses.length}</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center min-w-[80px]">
                <div className="flex items-center justify-center gap-1 text-emerald-800 text-[11px] font-bold">
                  <TreePine className="w-3 h-3" />
                  <span>HR</span>
                </div>
                <span className="text-xl font-black font-mono text-emerald-950">{huanRamCount}</span>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center min-w-[80px]">
                <div className="flex items-center justify-center gap-1 text-blue-800 text-[11px] font-bold">
                  <Home className="w-3 h-3" />
                  <span>IH</span>
                </div>
                <span className="text-xl font-black font-mono text-blue-950">{inHmunCount}</span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setIsMandatoryProfileUpdate(false);
                  setIsVillageProfileOpen(true);
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition border border-neutral-300"
                title="Configure Village Name, Block, District, Terms & Logo (Starts Blank)"
              >
                <Settings className="w-3.5 h-3.5 text-neutral-600" />
                <span>Configure Village Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Village Profile Setup Gate Notice */}
        {isApproved && !isVillageConfigured && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 shadow-xs">
            <div className="flex items-start gap-3.5">
              <Building2 className="w-6 h-6 text-amber-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>Village Council Profile Configuration Required</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    SETUP REQUIRED
                  </span>
                </h4>
                <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                  Your account is approved! However, <strong>New Land Pass Issuance is locked</strong> until you configure your official Village Council profile (Village Name, Block, District, President signatory, and Pass prefixes).
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMandatoryProfileUpdate(true);
                setIsVillageProfileOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>Configure Village Profile Now</span>
            </button>
          </div>
        )}

        {/* Pending Authority Approval Notice for New Users */}
        {!isApproved && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-amber-800 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Account Registration Pending Authority Approval
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your Village Council Secretary profile has been registered and is awaiting verification by the State Authority. <strong>Issue Land Pass</strong> will be placed and activated automatically as soon as your account is approved.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-200/90 text-amber-950 font-mono text-[11px] font-bold shrink-0">
              STATUS: PENDING APPROVAL
            </div>
          </div>
        )}

        {/* Search & Quick Action Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={`Search ${currentVillage.villageName} passes by owner, phone, boundaries...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Sorter and Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date_desc">Latest Issued</option>
              <option value="date_asc">Oldest Issued</option>
              <option value="pass_asc">Pass Number</option>
              <option value="name_asc">Owner Name</option>
            </select>

            <button
              onClick={handleExportArchive}
              className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-neutral-200"
              title="Export database archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>

            {/* Issue Pass Button - strictly NOT live before Authority approval and Village Profile is configured */}
            {canIssuePass ? (
              <button
                onClick={() => {
                  setEditingPass(null);
                  setIsAddEditOpen(true);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Issue Pass</span>
              </button>
            ) : !isVillageConfigured && isApproved ? (
              <button
                onClick={() => {
                  setIsMandatoryProfileUpdate(true);
                  setIsVillageProfileOpen(true);
                }}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
                title="Configure Village Council Profile first to unlock and make Live New Land Pass Issuance"
              >
                <Building2 className="w-3.5 h-3.5 text-neutral-950" />
                <span>Configure Village to Unlock Pass</span>
              </button>
            ) : (
              <div
                className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-2xs"
                title="Account is pending State Authority verification. Issue Land Pass will be placed once approved."
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                <span className="font-semibold text-[11px]">Awaiting Authority Approval</span>
              </div>
            )}
          </div>
        </div>

        {/* Pass Records Grid */}
        {sortedPasses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-800">
                {searchTerm ? 'No matching Land Passes found' : `No Land Passes registered for ${currentVillage.villageName}`}
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                {searchTerm
                  ? 'Try a different search term (owner name, parent name, location or serial number).'
                  : canIssuePass
                  ? 'Click "+ Issue Pass" above to generate your first official Land Pass certificate.'
                  : !isVillageConfigured && isApproved
                  ? 'New Land Pass Issue is locked until Configure Village Profile is done. Please configure your village details above.'
                  : 'Your account is currently awaiting State Authority approval. Land Pass issuance will be placed and activated automatically upon verification.'}
              </p>
            </div>
            {canIssuePass && (
              <button
                onClick={() => {
                  setEditingPass(null);
                  setIsAddEditOpen(true);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Issue First Land Pass</span>
              </button>
            )}
            {!canIssuePass && (
              !isVillageConfigured && isApproved ? (
                <div className="inline-flex flex-col sm:flex-row items-center gap-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-700" />
                    <span>New Land Pass Issue is locked until Configure Village Profile is done.</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMandatoryProfileUpdate(true);
                      setIsVillageProfileOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Configure Village Profile Now
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Pass Issuance is disabled until Authority Approval is granted.</span>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPasses.map((pass) => (
              <LandPassCard
                key={pass.id}
                pass={pass}
                isAdmin={isAdmin}
                onPrint={() => setSelectedPassForPrint(pass)}
                onEdit={() => {
                  setEditingPass(pass);
                  setIsAddEditOpen(true);
                }}
                onDelete={() => handleDeletePass(pass)}
                onVerify={() => setSelectedPassForPrint(pass)}
              />
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Official State Footer */}
      <footer className="mt-auto bg-neutral-900 text-neutral-400 text-xs py-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-neutral-200">
              {currentVillage.villageName || 'VILLAGE COUNCIL, MIZORAM'}
            </span>
            <span className="text-[11px] text-neutral-500 block">
              Official Electronic Land Pass System &bull; Live Realtime Database Synced
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Authority Support: <strong>ptlalfakzuala@gmail.com</strong> &bull; WhatsApp: <strong>7005504074</strong>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS & PANELS                                                           */}
      {/* ========================================================================= */}

      {/* 1. Printable Land Pass Modal */}
      {selectedPassForPrint && (
        <PrintableLandPass
          pass={selectedPassForPrint}
          village={currentVillage}
          onClose={() => setSelectedPassForPrint(null)}
          currentUserEmail={currentUser?.email}
          settings={printSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onVillageUpdated={handleSaveVillageProfile}
          onPassUpdated={(updatedPass) => {
            setPasses((prev) => prev.map((p) => (p.id === updatedPass.id ? updatedPass : p)));
            setSelectedPassForPrint(updatedPass);
          }}
          onDelete={handleDeletePass}
        />
      )}

      {/* 2. Add / Edit Land Pass Modal (Pass Number is strictly sequential & non-editable) */}
      <AddEditLandPassModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingPass(null);
        }}
        onSave={handleSavePass}
        editingPass={editingPass}
        village={currentVillage}
        existingPasses={passes}
      />

      {/* 3. User Profile Update Modal (Username, Password/Secret Key, Profile Photo) */}
      {currentUser && (
        <UserProfileModal
          isOpen={isUserProfileOpen}
          onClose={() => setIsUserProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('mizoram_vc_current_user', JSON.stringify(updated));
            setUsersList((prev) => prev.map((u) => (u.uid === updated.uid ? updated : u)));
            showNotification('User profile updated successfully!', 'success');
          }}
        />
      )}

      {/* 4. Village Profile Modal (No pre-filled fake text/photo) */}
      <VillageProfileModal
        isOpen={isVillageProfileOpen}
        onClose={() => setIsVillageProfileOpen(false)}
        village={currentVillage}
        onSave={handleSaveVillageProfile}
        currentUserDisplayName={currentUser?.displayName}
        isMandatory={isMandatoryProfileUpdate}
      />

      {/* 5. Print Settings & RTDB Storage Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={printSettings}
        onSaveSettings={handleSaveSettings}
        onTransferToRTDB={handleTransferToRTDB}
      />

      {/* 6. Audit Trail Modal */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />


      {/* 8. QR Verification Modal */}
      <VerifyPassModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        allPasses={passes}
        onOpenPrint={(pass) => setSelectedPassForPrint(pass)}
      />

      {/* 9. Full Authority Management Modal */}
      <FullAuthorityModal
        isOpen={isFullAuthorityModalOpen}
        onClose={() => setIsFullAuthorityModalOpen(false)}
        users={usersList}
        passes={passes}
        onApproveUser={handleApproveUser}
        onRejectUser={handleRejectUser}
        onApprovePass={handleApprovePass}
        onExitAuthorityMode={handleExitAuthorityMode}
        onTransferToRTDB={handleTransferToRTDB}
      />

      {/* 10. Master Authority Key Modal (Key 785392) */}
      <AuthorityKeyModal
        isOpen={isAuthorityKeyModalOpen}
        onClose={() => setIsAuthorityKeyModalOpen(false)}
        onSuccess={handleAuthorityKeySuccess}
      />

      {/* 11. Delete Land Pass Warning Dialogue Box Modal */}
      <DeletePassModal
        isOpen={!!passToDeleteForWarning}
        pass={passToDeleteForWarning}
        onClose={() => setPassToDeleteForWarning(null)}
        onConfirmDelete={handleConfirmDeletePass}
      />
    </div>
  );
}
