import React, { useState } from 'react';
import { LandPass } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DeletePassModalProps {
  pass: LandPass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (pass: LandPass) => Promise<void> | void;
}

export const DeletePassModal: React.FC<DeletePassModalProps> = ({
  pass,
  isOpen,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen || !pass) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirmDelete(pass);
      setIsDeleting(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete pass:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-rose-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Warning Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-200 text-rose-900 uppercase">
                Warning Dialog
              </span>
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Irreversible Action
              </span>
            </div>
            <h3
              id="delete-dialog-title"
              className="text-lg font-bold text-neutral-900 mt-1"
            >
              Permanently Delete Land Pass?
            </h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Please review the record details before confirming deletion from the Village Council registry.
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

        {/* Record Overview Box */}
        <div className="p-6 space-y-4">
          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-neutral-500 font-medium">Pass Number:</span>
              <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-300">
                {pass.passNumber}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Owner (Neitu):</span>
              <span className="font-bold text-neutral-900 text-sm">
                {pass.ownerName}
              </span>
            </div>

            {pass.parentName && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 font-medium">Parent (Nu/Pa):</span>
                <span className="font-medium text-neutral-700">{pass.parentName}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Pass Category:</span>
              <span className="font-bold uppercase text-neutral-800">
                {pass.passType === 'huan_ram' ? '🌳 Huan Ram (Garden)' : '🏠 In Hmun (Residential)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Location:</span>
              <span className="font-medium text-neutral-700 truncate max-w-[240px]">
                {pass.locationAddress || 'Village Jurisdiction'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Issue Date:</span>
              <span className="font-mono text-neutral-700">{pass.issueDate}</span>
            </div>
          </div>

          {/* High-visibility Warning Notice */}
          <div className="bg-rose-50/80 border border-rose-300 rounded-xl p-3.5 flex items-start gap-3 text-rose-950 text-xs">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Permanent Deletion Notice:</p>
              <p className="text-rose-900 text-[11px] leading-relaxed">
                Deleting this record will immediately purge it from the local device storage and the live cloud Firebase database. All QR code verification links for pass #{pass.passNumber} will become invalid.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold border border-neutral-300 transition"
          >
            Cancel &amp; Keep Record
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting Record...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Land Pass</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
