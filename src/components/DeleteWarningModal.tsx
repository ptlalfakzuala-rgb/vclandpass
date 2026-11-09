import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteWarningModalProps {
  isOpen: boolean;
  title: string;
  itemIdentifier?: string;
  description?: string;
  confirmButtonText?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteWarningModal: React.FC<DeleteWarningModalProps> = ({
  isOpen,
  title,
  itemIdentifier,
  description = 'Are you sure you want to delete this record? This action cannot be undone and the record will be permanently removed.',
  confirmButtonText = 'Delete Permanently',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-base font-bold text-neutral-900 leading-tight">
              {title}
            </h3>
            <p className="text-xs text-rose-700 font-medium mt-0.5">
              Warning: Irreversible Action
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {itemIdentifier && (
            <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-200">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
                Target Record
              </span>
              <span className="text-sm font-bold font-mono text-neutral-800 break-all">
                {itemIdentifier}
              </span>
            </div>
          )}

          <p className="text-sm text-neutral-600 leading-relaxed">
            {description}
          </p>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-start space-x-2 text-xs text-amber-900">
            <span className="font-bold text-amber-700 shrink-0">Hriattirna:</span>
            <span>He thil hi i paih chuan a data zawng zawng he app leh online database atangin a bo hlen dawn a ni.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 active:scale-95 transition-all"
          >
            Cancel (Bansan)
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-sm hover:shadow transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
