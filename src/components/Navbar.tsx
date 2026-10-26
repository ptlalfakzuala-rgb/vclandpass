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
  FileText,
  BookOpen
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile | null;
  isAdmin: boolean;
  isFullAuthority: boolean;
  canIssuePass: boolean;
  isVillageConfigured?: boolean;
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
  onOpenAbout?: () => void;
  activeFilter: 'all' | 'huan_ram' | 'in_hmun';
  onFilterChange: (f: 'all' | 'huan_ram' | 'in_hmun') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  isAdmin,
  isFullAuthority,
  canIssuePass,
  isVillageConfigured = false,
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
  onOpenAbout,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-neutral-900 shadow-xs border-b border-neutral-200 print:hidden">
      {/* Top village council identity bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Brand Logo & Council Title */}
          <div className="flex items-center gap-3">
            {/* Council Seal / Logo Frame */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-0.5 shadow-xs flex items-center justify-center shrink-0">
              {currentVillage.logoUrl ? (
                <img
                  src={currentVillage.logoUrl}
                  alt={`${currentVillage.villageName} Council Logo`}
                  className="w-full h-full object-contain rounded-[10px] bg-white p-0.5"
                />
              ) : (
                <div className="w-full h-full bg-emerald-900 rounded-[10px] flex flex-col items-center justify-center text-center p-1">
                  <span className="text-[10px] font-black text-amber-300 leading-none">VC</span>
                  <span className="text-[7px] font-serif font-bold text-neutral-100 mt-0.5">COURT</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-serif font-black text-base sm:text-lg tracking-wide text-neutral-900 leading-tight">
                  {currentVillage.villageName ? `${currentVillage.villageName} VILLAGE COUNCIL` : 'VILLAGE COUNCIL, MIZORAM'}
                </h1>

                {/* Status badge */}
                {currentUser?.status === 'approved' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Approved &bull; Lifetime Live</span>
                  </div>
                ) : currentUser?.status === 'pending' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs animate-pulse">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Pending Authority Approval</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-2xs">
                    <Building2 className="w-3 h-3 text-neutral-600" />
                    <span>Perspective Jurisdiction</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-neutral-500 font-medium">
                {currentVillage.districtName ? `${currentVillage.districtName}` : 'Mizoram'} {currentVillage.blockName ? `• ${currentVillage.blockName}` : ''} {currentVillage.pinCode ? `(PIN: ${currentVillage.pinCode})` : ''}
              </p>
            </div>
          </div>

          {/* Action Controls & Authentication (Realtime sync button removed; syncs silently in background) */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* QR Quick Verify Button */}
            <button
              onClick={onOpenVerify}
              className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 shadow-2xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
              title="Verify Land Pass QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-200 group-hover:scale-110" />
              <span className="hidden sm:inline">Verify Pass</span>
            </button>

            {/* Full Authority Mode Button */}
            {isFullAuthority ? (
              <button
                onClick={onOpenFullAuthority}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-400 shadow-xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
                title="Full Authority Mode is Active - Manage Registrations & Approvals"
              >
                <ShieldCheck className="w-4 h-4 text-neutral-950" />
                <span>Full Authority</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuthorityKeyModal}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-neutral-200 shadow-2xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
                title="Full Authority Portal (Registration Approvals)"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Authority</span>
              </button>
            )}

            {/* Print Theme & Font Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-xl border border-neutral-200 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-90 group"
              title="Certificate Print & Theme Settings"
            >
              <Sliders className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
            </button>

            {/* App Chungchang (Mizo Guide) Button */}
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 shadow-2xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95 group"
                title="App Chungchang (Mizo Tawngin Hrilhfiahna - Share & PDF)"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-700 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden md:inline">App Chungchang</span>
              </button>
            )}

            {/* User Profile Bar */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                {/* Profile Photo / Avatar Clickable to navigate to Secretary Profile Page */}
                <button
                  type="button"
                  onClick={() => onNavigatePage('secretary_profile')}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left border cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group ${
                    currentPage === 'secretary_profile' ? 'bg-emerald-50 border-emerald-300 shadow-2xs' : 'hover:bg-neutral-100 border-transparent'
                  }`}
                  title="Open Secretary Profile Page"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-600 bg-neutral-100 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                    {currentUser.profilePhotoUrl ? (
                      <img
                        src={currentUser.profilePhotoUrl}
                        alt={currentUser.displayName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-emerald-800" />
                    )}
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-xs font-bold text-neutral-900 block leading-tight group-hover:text-emerald-700 transition-colors">
                      {currentUser.displayName || currentUser.username}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Profile &bull; {currentUser.userType === 'secretary' ? 'Secretary' : 'Citizen'}
                    </span>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-700 hover:text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-neutral-200 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 group"
                  title="Logout and return to Login page"
                >
                  <LogOut className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-200">
                <button
                  onClick={onOpenRegister}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                <button
                  onClick={onOpenAuth}
                  className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium flex items-center gap-1 border border-neutral-200 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar: Dedicated Page Switcher Tabs */}
        <div className="py-2.5 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Main Page Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => onNavigatePage('passes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                currentPage === 'passes'
                  ? 'bg-white text-emerald-800 shadow-xs border border-neutral-200/80 -translate-y-0.5'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 transition-transform duration-200 ${currentPage === 'passes' ? 'scale-110 text-emerald-700' : ''}`} />
              <span>Land Passes Registry</span>
            </button>

            <button
              onClick={() => onNavigatePage('secretary_profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                currentPage === 'secretary_profile'
                  ? 'bg-white text-emerald-800 shadow-xs border border-neutral-200/80 -translate-y-0.5'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <User className={`w-3.5 h-3.5 transition-transform duration-200 ${currentPage === 'secretary_profile' ? 'scale-110 text-emerald-700' : ''}`} />
              <span>Secretary Profile</span>
            </button>

            <button
              onClick={() => onNavigatePage('village_council')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                currentPage === 'village_council'
                  ? 'bg-white text-emerald-800 shadow-xs border border-neutral-200/80 -translate-y-0.5'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 transition-transform duration-200 ${currentPage === 'village_council' ? 'scale-110 text-emerald-700' : ''}`} />
              <span>My Village Council</span>
            </button>
          </div>

          {/* Right Sub-nav Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {currentPage === 'passes' && (
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
                <button
                  onClick={() => onFilterChange('all')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                    activeFilter === 'all' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => onFilterChange('huan_ram')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                    activeFilter === 'huan_ram' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  🌳 Huan Ram
                </button>
                <button
                  onClick={() => onFilterChange('in_hmun')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-all duration-200 ease-out active:scale-95 ${
                    activeFilter === 'in_hmun' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  🏠 In Hmun
                </button>
              </div>
            )}

            {isAdmin && (
              <>
                {/* Audit Trail: Restricted to Full Authority Mode Only */}
                {isFullAuthority && (
                  <button
                    onClick={onOpenAuditLog}
                    className="px-2.5 py-1 text-xs text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 font-semibold cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-1"
                    title="View Audit Logs (Full Authority Exclusive)"
                  >
                    <History className="w-3.5 h-3.5 text-amber-700" />
                    <span className="hidden sm:inline">Audit Trail</span>
                  </button>
                )}

                {/* Village Configuration & Authority Gate */}
                {canIssuePass ? (
                  <button
                    onClick={onOpenAddPass}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 group"
                  >
                    <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
                    <span>Issue Land Pass</span>
                  </button>
                ) : !isVillageConfigured && (isFullAuthority || currentUser?.status === 'approved') ? (
                  <button
                    onClick={onOpenVillageProfile}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold rounded-xl text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95"
                    title="Configure Village Council Profile first to unlock Land Pass Issuance"
                  >
                    <Building2 className="w-3.5 h-3.5 text-neutral-950" />
                    <span>Configure Village to Unlock Pass</span>
                  </button>
                ) : (
                  <div className="px-3 py-1 bg-amber-50 border border-amber-300 rounded-xl text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
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
