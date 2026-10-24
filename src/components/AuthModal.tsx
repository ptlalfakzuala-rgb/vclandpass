import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  KeyRound,
  User,
  ShieldCheck,
  LogIn,
  AlertCircle,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { authenticateSecretary } from '../services/userService';
import { logActivity } from '../services/auditLogger';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (profile: UserProfile) => void;
  onLogout: () => void;
  onSwitchToRegister: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onSwitchToRegister,
}) => {
  // Pure VC Secretary Login Mode: Username & Secret Key only (NO PRE-FILLED INPUTS)
  const [username, setUsername] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSecretaryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !secretKey.trim()) {
      setErrorMsg('Please enter both your Username and Secret Key.');
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await authenticateSecretary(username, secretKey);

      if (error || !user) {
        setErrorMsg(error || 'Invalid VC Secretary username or secret key.');
        setLoading(false);
        return;
      }

      await logActivity(
        'ROLE_CHANGE',
        user.uid,
        user.displayName || 'VC Secretary',
        user.phoneNumber || 'User',
        `VC Secretary ${user.displayName} logged in with Secret Key`
      );

      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMsg('Login failed. Please check your credentials or network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-300 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">VC Secretary Login</h3>
              <p className="text-xs text-emerald-300">
                Village Council Secretary Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {currentUser ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <User className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900 text-base">{currentUser.displayName}</h4>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{currentUser.phoneNumber || currentUser.email}</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {currentUser.status === 'approved' ? 'Active VC Secretary' : 'Registration Pending Approval'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition shadow-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <form onSubmit={handleSecretaryLogin} className="space-y-4 text-sm">
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                Log in with your official <strong>Username</strong> and <strong>Secret Key</strong> to manage land passes for your village council.
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Username */}
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Enter Secretary Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 2. Secret Key */}
              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Secret Key *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter Secret Key"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In as VC Secretary</span>
                  </>
                )}
              </button>

              {/* Register switch link */}
              <div className="pt-3 border-t border-neutral-200 text-center">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Secretary? Create Account &amp; Register</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
