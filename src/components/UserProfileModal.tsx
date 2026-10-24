import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import {
  X,
  User,
  KeyRound,
  Phone,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Save
} from 'lucide-react';
import { updateUserProfile } from '../services/userService';
import { logActivity } from '../services/auditLogger';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [username, setUsername] = useState<string>(
    currentUser.username || currentUser.displayName || ''
  );
  const [password, setPassword] = useState<string>(
    currentUser.password || currentUser.passkey || ''
  );
  const [phoneNumber, setPhoneNumber] = useState<string>(
    currentUser.phoneNumber || ''
  );
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>(
    currentUser.profilePhotoUrl || ''
  );
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Profile Photo Upload with client-side scaling/compression
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG or PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setProfilePhotoUrl(compressed);
          } else {
            setProfilePhotoUrl(reader.result as string);
          }
          setError(null);
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhotoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    if (!password.trim()) {
      setError('Password / Secret Key cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateUserProfile(currentUser.uid, {
        username: username.trim(),
        displayName: username.trim(),
        password: password.trim(),
        passkey: password.trim(),
        profilePhotoUrl,
        phoneNumber: phoneNumber.trim(),
      });

      if (updated) {
        onProfileUpdated(updated);
        await logActivity(
          'USER_PROFILE_UPDATED',
          currentUser.uid,
          username.trim(),
          username.trim(),
          `Updated user profile (username, password, and photo) for ${username.trim()}`
        );
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <User className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">
                User Profile Update
              </h3>
              <p className="text-[11px] text-emerald-300 font-sans">
                Update Username, Password / Secret Key &amp; Profile Photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Photo Picker */}
          <div className="flex flex-col items-center justify-center gap-3 pb-2 border-b border-neutral-100">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-emerald-600 bg-neutral-100 flex items-center justify-center shadow-md">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt="Profile Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-neutral-400" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-lg transition"
                title="Upload Profile Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                {profilePhotoUrl ? 'Change Photo' : 'Upload Profile Photo'}
              </button>
              {profilePhotoUrl && (
                <>
                  <span className="text-neutral-300">•</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
            </div>
          </div>

          {/* Password / Secret Key Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Password / Secret Key <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password / secret key"
                className="w-full pl-9 pr-10 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Used to log into your VC Secretary account.
            </p>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +91 94361 24589"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
