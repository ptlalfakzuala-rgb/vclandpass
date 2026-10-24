import React from 'react';
import { UserProfile, SyncStatus, VillageConfig } from '../types';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  History,
  Users,
  Plus,
  LogIn,
  LogOut,
  Building2,
  Settings,
  UserPlus,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  User,
  KeyRound,
  Clock,
  Camera,
  FileText
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isFullAuthority: boolean;
  canIssuePass: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  currentVillage: VillageConfig;
  currentPage: 'passes' | 'secretary_profile' | 'village_council';
  onNavigatePage: (page: 'passes' | 'secretary_profile' | 'village_council') => void;
  onOpenVillageProfile: () => void;
  onOpenUserProfile: () => void;
  onOpenRegister: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenAddPass: () => void;
  onOpenAuditLog: () => void;
  onOpenVerify: () => void;
  onManualSync: () => void;
  onOpenFullAuthority: () => void;
  onOpenAuthorityKeyModal: () => void;
  activeFilter: 'all' | 'huan_ram' | 'in_hmun';
  onFilterChange: (f: 'all' | 'huan_ram' | 'in_hmun') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isAdmin,
  isFullAuthority,
  canIssuePass,
  syncStatus,
  pendingSyncCount,
  currentVillage,
  currentPage,
  onNavigatePage,
  onOpenVillageProfile,
  onOpenUserProfile,
  onOpenRegister,
  onOpenAuth,
  onLogout,
  onOpenSettings,
  onOpenAddPass,
  onOpenAuditLog,
  onOpenVerify,
  onManualSync,
  onOpenFullAuthority,
  onOpenAuthorityKeyModal,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-950 text-white shadow-lg border-b border-emerald-900">
      {/* Top village council identity bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Brand Logo & Council Title */}
          <div className="flex items-center gap-3">
            {/* Council Seal / Logo Frame */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              {currentVillage.logoUrl ? (
                <img
                  src={currentVillage.logoUrl}
                  alt={`${currentVillage.villageName} Council Logo`}
                  className="w-full h-full object-contain rounded-[10px] bg-white p-0.5"
                />
              ) : (
                <div className="w-full h-full bg-emerald-950 rounded-[10px] flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[10px] font-black text-amber-400 leading-none">VC</span>
                  <span className="text-[7px] font-serif font-bold text-neutral-200 mt-0.5">COURT</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif font-bold text-base sm:text-lg tracking-wide text-white leading-tight">
                  {currentVillage.villageName ? `${currentVillage.villageName} VILLAGE COUNCIL` : 'VILLAGE COUNCIL, MIZORAM'}
                </h1>

                {/* Status badge */}
                {currentUser?.status === 'approved' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/90 text-emerald-300 border border-emerald-700/80 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Approved &bull; Lifetime Live</span>
                  </div>
                ) : currentUser?.status === 'pending' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-900/90 text-amber-300 border border-amber-700/80 shadow-2xs animate-pulse">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Pending Authority Approval</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/90 text-amber-300 border border-emerald-700/80 shadow-2xs">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>Perspective Jurisdiction</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-emerald-300/90 font-medium">
                {currentVillage.districtName ? `${currentVillage.districtName}` : 'Mizoram'} {currentVillage.blockName ? `• ${currentVillage.blockName}` : ''} {currentVillage.pinCode ? `(PIN: ${currentVillage.pinCode})` : ''}
              </p>
            </div>
          </div>

          {/* Action Controls & Authentication */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Real-time Online/Offline Sync Indicator */}
            <div className="hidden lg:flex items-center">
              {syncStatus === 'online' ? (
                <button
                  type="button"
                  onClick={onManualSync}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-800 transition"
                  title="Cloud Synced with Firebase Realtime Database. Click to refresh."
                >
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Realtime Cloud Synced</span>
                  {pendingSyncCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                      {pendingSyncCount}
                    </span>
                  )}
                </button>
              ) : syncStatus === 'syncing' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Syncing...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onManualSync}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/90 text-amber-200 border border-amber-700"
                  title="Offline mode. All data is securely encrypted in device local cache."
                >
                  <WifiOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>Offline Encrypted</span>
                </button>
              )}
            </div>

            {/* QR Quick Verify Button */}
            <button
              onClick={onOpenVerify}
              className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-emerald-800 shadow-2xs"
              title="Verify Land Pass QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Verify Pass</span>
            </button>

            {/* Full Authority Mode Button */}
            {isFullAuthority ? (
              <button
                onClick={onOpenFullAuthority}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm border border-amber-400/50"
                title="Full Authority Mode is Active - Manage Registrations & Approvals"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Full Authority</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthorityKeyModal}
                className="px-2.5 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-emerald-800 shadow-2xs"
                title="Full Authority Portal (Registration Approvals)"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Authority</span>
              </button>
            )}

            {/* Print Theme & Font Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-xl transition border border-emerald-800"
              title="Certificate Print & Theme Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* User Profile Bar */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800">
                {/* Profile Photo / Avatar Clickable to navigate to Secretary Profile Page */}
                <button
                  type="button"
                  onClick={() => onNavigatePage('secretary_profile')}
                  className={`flex items-center gap-2 p-1.5 rounded-xl transition group text-left ${
                    currentPage === 'secretary_profile' ? 'bg-emerald-800 border border-emerald-600' : 'hover:bg-emerald-900/80'
                  }`}
                  title="Open Secretary Profile Page"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 bg-emerald-900 flex items-center justify-center shrink-0">
                    {currentUser.profilePhotoUrl ? (
                      <img
                        src={currentUser.profilePhotoUrl}
                        alt={currentUser.displayName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-amber-300" />
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-white block leading-tight group-hover:text-amber-300 transition">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <span className="text-[10px] text-emerald-300 block">
                      Profile &bull; {currentUser.userType === 'secretary' ? 'Secretary' : 'Citizen'}
                    </span>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-emerald-900 hover:bg-rose-900 text-emerald-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition border border-emerald-800"
                  title="Logout and return to Login page"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-emerald-800">
                <button
                  onClick={onOpenRegister}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                <button
                  onClick={onOpenAuth}
                  className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition border border-emerald-800"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar: Dedicated Page Switcher Tabs */}
        <div className="py-2.5 border-t border-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Main Page Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 p-1 rounded-xl border border-emerald-900 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => onNavigatePage('passes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentPage === 'passes'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Land Passes Registry</span>
            </button>

            <button
              onClick={() => onNavigatePage('secretary_profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentPage === 'secretary_profile'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Secretary Profile</span>
            </button>

            <button
              onClick={() => onNavigatePage('village_council')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                currentPage === 'village_council'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-900/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>My Village Council</span>
            </button>
          </div>

          {/* Right Sub-nav Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {currentPage === 'passes' && (
              <div className="flex items-center gap-1 bg-emerald-900/70 p-0.5 rounded-lg border border-emerald-800 text-xs">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => onFilterChange('huan_ram')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeFilter === 'huan_ram' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  🌳 Huan Ram
                </button>
                <button
                  onClick={() => onFilterChange('in_hmun')}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    activeFilter === 'in_hmun' ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  🏠 In Hmun
                </button>
              </div>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={onOpenAuditLog}
                  className="px-2.5 py-1 text-xs text-emerald-200 hover:text-white hover:bg-emerald-900 rounded-lg transition flex items-center gap-1 border border-emerald-900"
                  title="View Audit Logs"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Audit Trail</span>
                </button>


                {/* Authority Gate: Only approved users can issue new pass */}
                {canIssuePass ? (
                  <button
                    onClick={onOpenAddPass}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue Land Pass</span>
                  </button>
                ) : (
                  <div className="px-3 py-1 bg-amber-900/40 border border-amber-600/50 rounded-xl text-[11px] text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pass Issuance Locked until Authority Approved</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
