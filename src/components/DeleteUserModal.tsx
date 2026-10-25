import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AlertTriangle, Trash2, X, KeyRound, Building2, Phone, Calendar, User, ShieldAlert, RefreshCw } from 'lucide-react';

interface DeleteUserModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (user: UserProfile) => Promise<void> | void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const secretKey = user.password || user.passkey || 'N/A';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(user);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-dialog-title"
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Warning Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-200 text-rose-900 uppercase">
                Warning Dialogue
              </span>
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Irreversible Action
              </span>
            </div>
            <h3
              id="delete-user-dialog-title"
              className="text-lg font-bold text-neutral-900 mt-1"
            >
              Permanently Delete User Account?
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Please review the account credentials and details before confirming permanent deletion.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Details Overview Box */}
        <div className="p-6 space-y-4">
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2.5 text-xs">
            {/* Username & Display Name */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-neutral-400" /> Username:
              </span>
              <span className="font-mono font-bold text-neutral-950 bg-white px-2.5 py-0.5 rounded-lg border border-neutral-300">
                {user.username || user.displayName || user.uid}
              </span>
            </div>

            {/* Secret Key Display */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 bg-amber-50/70 -mx-4 px-4 py-2 border-t border-amber-200/60">
              <span className="text-amber-900 font-semibold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-700" /> Secret Key / Passkey:
              </span>
              <span className="font-mono font-black text-xs text-amber-950 bg-white px-2.5 py-1 rounded-md border border-amber-300 shadow-2xs select-all">
                {secretKey}
              </span>
            </div>

            {/* Display Name */}
            {user.displayName && user.displayName !== user.username && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Display Name:</span>
                <span className="font-semibold text-neutral-800">{user.displayName}</span>
              </div>
            )}

            {/* Jurisdiction / Village */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" /> Jurisdiction:
              </span>
              <span className="font-semibold text-neutral-800">
                {user.villageName || 'Mizoram Village Council'}
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-400" /> Phone Number:
              </span>
              <span className="font-mono text-neutral-800">{user.phoneNumber || 'Not provided'}</span>
            </div>

            {/* Account Status */}
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Account Status:</span>
              <span className="capitalize font-bold px-2 py-0.5 rounded-full text-[10px] bg-neutral-200 text-neutral-800">
                {user.status || 'Active'} ({user.userType || 'User'})
              </span>
            </div>

            {/* Registration Date */}
            {user.registrationDate && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Registered On:
                </span>
                <span className="text-neutral-600">
                  {new Date(user.registrationDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Severe Warning Alert */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 leading-relaxed">
              <strong>Warning:</strong> Deleting this user will completely erase their account,
              secret key credentials, and access rights from both <strong>Firestore</strong> and the <strong>Realtime Database</strong>.
              They will not be able to log in or issue passes again unless re-registered and re-approved.
            </div>
          </div>
        </div>

        {/* Confirmation Actions */}
        <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-white text-xs font-semibold transition disabled:opacity-50"
          >
            Cancel / Thulh Leh Rawh
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deleting User...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Yes, Permanently Delete User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
