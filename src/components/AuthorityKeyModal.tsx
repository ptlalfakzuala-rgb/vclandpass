import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, Check, AlertCircle } from 'lucide-react';
import { verifyFullAuthorityKey } from '../services/userService';

interface AuthorityKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthorityKeyModal: React.FC<AuthorityKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [keyInput, setKeyInput] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyFullAuthorityKey(keyInput)) {
      setError('');
      setKeyInput('');
      onSuccess();
      onClose();
    } else {
      setError('Invalid Authority Key. Access denied.');
      setKeyInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-300 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Full Authority Access
              </h3>
              <p className="text-xs text-neutral-500">
                Enter Master Authority Authorization Key
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setError('');
              setKeyInput('');
              onClose();
            }}
            className="text-neutral-400 hover:text-neutral-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Authority Passkey *
            </label>
            <input
              type="password"
              required
              autoFocus
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-center font-mono text-lg tracking-widest font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setKeyInput('');
                onClose();
              }}
              className="px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Verify &amp; Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
