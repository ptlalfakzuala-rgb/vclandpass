import React, { useState, useEffect } from 'react';
import { UserProfile, LandPass } from '../types';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  Building2,
  Phone,
  Calendar,
  Search,
  Check,
  User,
  ShieldCheck,
  Maximize2,
  FileText,
  MapPin,
  Sparkles,
  RefreshCw,
  KeyRound,
  Copy,
  Trash2
} from 'lucide-react';
import { DeleteUserModal } from './DeleteUserModal';

interface FullAuthorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  passes?: LandPass[];
  onApproveUser: (uid: string) => Promise<void> | void;
  onRejectUser: (uid: string, reason?: string) => Promise<void> | void;
  onApprovePass?: (passId: string) => Promise<void> | void;
  onDeleteUser?: (user: UserProfile) => Promise<void> | void;
  onExitAuthorityMode?: () => void;
  onTransferToRTDB?: () => Promise<void> | void;
}

export const FullAuthorityModal: React.FC<FullAuthorityModalProps> = ({
  isOpen,
  onClose,
  users,
  passes = [],
  onApproveUser,
  onRejectUser,
  onApprovePass,
  onDeleteUser,
  onExitAuthorityMode,
  onTransferToRTDB,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'passes'>('users');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [rejectingUser, setRejectingUser] = useState<UserProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [userToDeleteForWarning, setUserToDeleteForWarning] = useState<UserProfile | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Local optimistic state for instant UI reaction
  const [localUsers, setLocalUsers] = useState<UserProfile[]>(users);
  const [localPasses, setLocalPasses] = useState<LandPass[]>(passes);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [processingPassId, setProcessingPassId] = useState<string | null>(null);

  const handleCopyKey = (uid: string, key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2500);
  };

  const handleConfirmDeleteUser = async (user: UserProfile) => {
    setProcessingUid(user.uid);
    try {
      if (onDeleteUser) {
        await onDeleteUser(user);
      }
      setLocalUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setProcessingUid(null);
      setUserToDeleteForWarning(null);
    }
  };

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  useEffect(() => {
    setLocalPasses(passes);
  }, [passes]);

  if (!isOpen) return null;

  const filteredUsers = localUsers.filter((u) => {
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.displayName?.toLowerCase().includes(term) ?? false) ||
      (u.username?.toLowerCase().includes(term) ?? false) ||
      (u.villageName?.toLowerCase().includes(term) ?? false) ||
      (u.phoneNumber?.toLowerCase().includes(term) ?? false) ||
      (u.paymentRef?.toLowerCase().includes(term) ?? false);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = localUsers.filter((u) => u.status === 'pending').length;
  const approvedCount = localUsers.filter((u) => u.status === 'approved').length;
  const rejectedCount = localUsers.filter((u) => u.status === 'rejected').length;

  const pendingPassesCount = localPasses.filter((p) => p.approvalStatus === 'pending_approval').length;

  const handleApproveUserClick = async (uid: string) => {
    setProcessingUid(uid);
    // Instant optimistic update
    setLocalUsers((prev) =>
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

    try {
      await onApproveUser(uid);
    } catch (e) {
      console.error('Failed to approve user:', e);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingUser) return;
    const targetUid = rejectingUser.uid;
    const reason = rejectionReason || 'Payment details could not be verified';

    setProcessingUid(targetUid);
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.uid === targetUid
          ? {
              ...u,
              status: 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewedBy: 'Full Authority',
              rejectionReason: reason,
            }
          : u
      )
    );

    setRejectingUser(null);
    setRejectionReason('');

    try {
      await onRejectUser(targetUid, reason);
    } catch (err) {
      console.error('Failed to reject user:', err);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleApprovePassClick = async (passId: string) => {
    setProcessingPassId(passId);
    setLocalPasses((prev) =>
      prev.map((p) =>
        p.id === passId
          ? {
              ...p,
              approvalStatus: 'live',
              approvedAt: new Date().toISOString(),
              approvedBy: 'Full Authority',
            }
          : p
      )
    );

    try {
      if (onApprovePass) {
        await onApprovePass(passId);
      }
    } catch (err) {
      console.error('Failed to approve pass:', err);
    } finally {
      setProcessingPassId(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-300 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-linear-to-r from-amber-950 via-neutral-900 to-amber-950 text-white flex items-center justify-between border-b border-amber-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-600 rounded-xl shadow-md text-amber-950">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-amber-100">
                    Full Authority Management
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    LIFETIME APPROVAL ACTIVE
                  </span>
                </div>
                <p className="text-xs text-amber-200/80">
                  Review &amp; approve VC Secretary accounts (lifetime live) and new Land Passes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onTransferToRTDB && (
                <button
                  type="button"
                  onClick={onTransferToRTDB}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                  title="Transfer all data to Firebase Realtime Database"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Transfer to RTDB</span>
                </button>
              )}
              {onExitAuthorityMode && (
                <button
                  type="button"
                  onClick={onExitAuthorityMode}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition border border-neutral-700"
                >
                  Exit Authority Mode
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Section Tabs (Users vs Land Passes) */}
          <div className="bg-neutral-100 px-6 pt-3 border-b border-neutral-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t border-x ${
                  activeTab === 'users'
                    ? 'bg-white text-amber-950 border-neutral-200 shadow-xs'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900 border-transparent'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Secretary Registrations</span>
                {pendingCount > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('passes')}
                className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-t border-x ${
                  activeTab === 'passes'
                    ? 'bg-white text-emerald-950 border-neutral-200 shadow-xs'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-900 border-transparent'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Land Passes Live Approval</span>
                {pendingPassesCount > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingPassesCount}
                  </span>
                )}
              </button>
            </div>

            <div className="text-[11px] text-neutral-500 pb-2">
              Authority Contact: <strong>ptlalfakzuala@gmail.com</strong> / <strong>7005504074</strong>
            </div>
          </div>

          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <>
              {/* Stats Bar */}
              <div className="bg-neutral-50 px-6 py-2.5 border-b border-neutral-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-neutral-200 flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Total Users:</span>
                  <span className="font-bold font-mono text-neutral-900 text-sm">{localUsers.length}</span>
                </div>
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-amber-800 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending:
                  </span>
                  <span className="font-bold font-mono text-amber-950 text-sm">{pendingCount}</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-emerald-800 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved:
                  </span>
                  <span className="font-bold font-mono text-emerald-950 text-sm">{approvedCount}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 flex items-center justify-between">
                  <span className="text-rose-800 font-medium flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Rejected:
                  </span>
                  <span className="font-bold font-mono text-rose-950 text-sm">{rejectedCount}</span>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="p-4 bg-white border-b border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search user, phone, UTR..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filterStatus === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    All ({localUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      filterStatus === 'pending'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('approved')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      filterStatus === 'approved'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    }`}
                  >
                    Approved ({approvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus('rejected')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      filterStatus === 'rejected'
                        ? 'bg-rose-700 text-white'
                        : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                    }`}
                  >
                    Rejected ({rejectedCount})
                  </button>
                </div>
              </div>

              {/* User Registrations List */}
              <div className="p-6 overflow-y-auto space-y-4">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                    <ShieldCheck className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                    <h4 className="font-bold text-neutral-700 text-sm">No registrations found</h4>
                    <p className="text-xs text-neutral-500 mt-1">
                      There are no user registration requests matching your current filter.
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isSecretary = user.userType === 'secretary';
                    const isPending = user.status === 'pending';
                    const isApproved = user.status === 'approved';
                    const isRejected = user.status === 'rejected';
                    const isProcessing = processingUid === user.uid;

                    return (
                      <div
                        key={user.uid}
                        className={`p-4 rounded-xl border transition shadow-2xs ${
                          isPending
                            ? 'bg-amber-50/50 border-amber-300'
                            : isApproved
                            ? 'bg-white border-neutral-200 hover:border-emerald-300'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Left: User identity & contact */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-neutral-950 text-base">
                                {user.displayName || user.username}
                              </span>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  isSecretary
                                    ? 'bg-amber-200 text-amber-950 border border-amber-300'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                              >
                                {isSecretary ? 'VC Secretary Applicant' : 'Citizen'}
                              </span>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isApproved
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {isPending && <Clock className="w-3 h-3 text-amber-700 animate-pulse" />}
                                {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                                {isRejected && <XCircle className="w-3 h-3 text-rose-700" />}
                                <span className="uppercase">
                                  {isPending ? 'Pending Approval' : isApproved ? 'Approved (Live for Lifetime)' : 'Rejected'}
                                </span>
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{user.phoneNumber || 'No phone provided'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                                <span>{user.villageName || 'Village configured in profile'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                                <span>
                                  Registered:{' '}
                                  {user.registrationDate
                                    ? new Date(user.registrationDate).toLocaleDateString()
                                    : 'Recently'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Fee: ₹{user.paymentAmount || 299} (Lifetime Access)</span>
                              </div>
                            </div>

                            {/* Every User Secret Key & Credentials Display */}
                            <div className="pt-1 flex items-center gap-2 flex-wrap">
                              <div className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs transition">
                                <KeyRound className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                                  Secret Key:
                                </span>
                                <span className="font-mono font-black text-xs text-neutral-950 bg-white px-2.5 py-0.5 rounded-md border border-amber-300 shadow-2xs select-all">
                                  {user.password || user.passkey || 'N/A'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(user.uid, user.password || user.passkey || '')}
                                  className="text-amber-800 hover:text-amber-950 hover:bg-amber-200/80 p-1 rounded-md transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                  title="Copy Secret Key to clipboard"
                                >
                                  {copiedUid === user.uid ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 text-[10px]">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="text-[10px]">Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {user.username && (
                                <div className="text-[11px] text-neutral-500 font-medium bg-neutral-100 px-2 py-1 rounded-lg border border-neutral-200">
                                  Username: <strong className="font-mono text-neutral-900">{user.username}</strong>
                                </div>
                              )}
                            </div>

                            {user.rejectionReason && (
                              <div className="text-xs bg-rose-100 text-rose-900 p-2 rounded-lg border border-rose-200">
                                <strong>Rejection Reason:</strong> {user.rejectionReason}
                              </div>
                            )}
                          </div>

                          {/* Middle: Payment Screenshot Thumbnail */}
                          {user.paymentScreenshotUrl ? (
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedPhoto({
                                    url: user.paymentScreenshotUrl!,
                                    title: `Payment Proof - ${user.displayName || user.username} (₹${user.paymentAmount || 299})`,
                                  })
                                }
                                className="relative group rounded-xl overflow-hidden border-2 border-emerald-600/60 shadow-md hover:border-emerald-700 transition"
                                title="Click to view full payment screenshot"
                              >
                                <img
                                  src={user.paymentScreenshotUrl}
                                  alt="Payment Screenshot Proof"
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                  <Maximize2 className="w-5 h-5" />
                                </div>
                              </button>
                              <span className="text-[10px] text-neutral-500 font-mono">
                                Proof Screenshot
                              </span>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center text-center p-1 text-[10px] text-neutral-400">
                              <span>No screenshot</span>
                            </div>
                          )}

                          {/* Right: Actions (Approve / Reject / Delete) */}
                          <div className="flex flex-row md:flex-col items-center justify-end gap-2 shrink-0">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleApproveUserClick(user.uid)}
                                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                  title="Approve registration and make live for lifetime"
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                  <span>{isProcessing ? 'Approving...' : 'Accept & Approve'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => setRejectingUser(user)}
                                  className="px-3 py-2 bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-700 rounded-xl text-xs font-semibold transition border border-neutral-200 hover:border-rose-300 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full font-bold border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Approved &bull; Live for Lifetime</span>
                                </span>
                              </div>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApproveUserClick(user.uid)}
                                className="px-3 py-1.5 bg-neutral-100 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 rounded-lg text-xs font-medium transition border border-neutral-300 disabled:opacity-50"
                              >
                                Reconsider / Approve
                              </button>
                            )}

                            {/* Permanent Delete User with Warning Dialogue */}
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setUserToDeleteForWarning(user)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded-xl text-xs font-semibold transition border border-rose-200 hover:border-rose-300 flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                              title="Permanently delete this user account"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete User</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 2: LAND PASSES APPROVAL */}
          {activeTab === 'passes' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <strong>Land Pass Approval Gate:</strong> Passes are not live until approved by Full Authority.
                </div>
                <span className="font-mono font-bold text-emerald-950">
                  {pendingPassesCount} Pending Approval
                </span>
              </div>

              {localPasses.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
                  <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                  <h4 className="font-bold text-neutral-700 text-sm">No Land Passes issued yet</h4>
                </div>
              ) : (
                localPasses.map((pass) => {
                  const isLive = pass.approvalStatus === 'live' || !pass.approvalStatus;
                  const isProcessing = processingPassId === pass.id;

                  return (
                    <div
                      key={pass.id}
                      className={`p-4 rounded-xl border transition shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isLive
                          ? 'bg-white border-neutral-200'
                          : 'bg-amber-50/70 border-amber-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 text-sm bg-neutral-100 px-2.5 py-0.5 rounded-lg border border-neutral-200">
                            {pass.passNumber}
                          </span>
                          <span className="text-xs font-bold text-neutral-800">
                            {pass.ownerName}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {pass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-3">
                          <span>Council: <strong>{pass.villageName || 'Mizoram VC'}</strong></span>
                          <span>Issue Date: {pass.issueDate}</span>
                          <span>Area: {pass.areaSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLive ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full flex items-center gap-1 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>LIVE FOR LIFETIME</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprovePassClick(pass.id)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{isProcessing ? 'Approving...' : 'Approve & Make Live'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500">
            <span>
              Full Authority actions are verified and permanently recorded in the council audit log and Firestore.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full-Size Payment Screenshot */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800">
              <span className="font-semibold text-sm truncate">{selectedPhoto.title}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto flex-1 bg-black/50">
              <img
                src={selectedPhoto.url}
                alt="Enlarged payment screenshot proof"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg border border-neutral-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 border border-rose-300 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-rose-800">
              <XCircle className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-base">Reject Registration</h4>
            </div>

            <p className="text-xs text-neutral-600">
              Are you sure you want to reject the registration of{' '}
              <strong>{rejectingUser.displayName || rejectingUser.username}</strong>?
            </p>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Reason for Rejection (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Payment screenshot unreadable, invalid UTR, or incorrect village authority..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setRejectingUser(null);
                  setRejectionReason('');
                }}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete User Warning Dialogue Modal */}
      <DeleteUserModal
        isOpen={!!userToDeleteForWarning}
        user={userToDeleteForWarning}
        onClose={() => setUserToDeleteForWarning(null)}
        onConfirmDelete={handleConfirmDeleteUser}
      />
    </>
  );
};
