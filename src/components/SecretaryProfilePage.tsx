import React, { useState, useRef } from 'react';
import { UserProfile, LandPass, VillageConfig } from '../types';
import {
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
  Building2,
  Calendar,
  Clock,
  Send,
  FileText,
  Save,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { updateUserProfile } from '../services/userService';
import { logActivity } from '../services/auditLogger';

interface SecretaryProfilePageProps {
  currentUser: UserProfile;
  currentVillage: VillageConfig;
  userPasses: LandPass[];
  onProfileUpdated: (updated: UserProfile) => void;
  onNavigateToVillage: () => void;
  onNavigateToPasses: () => void;
}

export const SecretaryProfilePage: React.FC<SecretaryProfilePageProps> = ({
  currentUser,
  currentVillage,
  userPasses,
  onProfileUpdated,
  onNavigateToVillage,
  onNavigateToPasses,
}) => {
  const [username, setUsername] = useState<string>(currentUser.username || '');
  const [displayName, setDisplayName] = useState<string>(currentUser.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser.phoneNumber || '');
  const [photoUrl, setPhotoUrl] = useState<string>(currentUser.profilePhotoUrl || '');
  const [password, setPassword] = useState<string>(currentUser.password || currentUser.passkey || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isApproved = currentUser.status === 'approved';

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please upload an image file (JPEG or PNG)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
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
            setPhotoUrl(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            setPhotoUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setStatusMsg({ type: 'error', text: 'Username cannot be blank' });
      return;
    }
    if (!password.trim()) {
      setStatusMsg({ type: 'error', text: 'Password / Secret key cannot be blank' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const updated = await updateUserProfile(currentUser.uid, {
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        phoneNumber: phoneNumber.trim(),
        profilePhotoUrl: photoUrl,
        password: password.trim(),
        passkey: password.trim(),
      });

      await logActivity(
        'USER_PROFILE_UPDATED',
        currentUser.uid,
        username.trim(),
        username.trim(),
        `Updated secretary profile details (username: ${username.trim()}, phone: ${phoneNumber.trim()})`
      );

      if (updated) {
        onProfileUpdated(updated);
      } else {
        const fallback: UserProfile = {
          ...currentUser,
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          phoneNumber: phoneNumber.trim(),
          profilePhotoUrl: photoUrl,
          password: password.trim(),
          passkey: password.trim(),
        };
        onProfileUpdated(fallback);
      }
      setStatusMsg({ type: 'success', text: 'Secretary profile updated successfully in Firestore!' });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const notifyAuthorityWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Authority,\n\nI have registered as VC Secretary on the VC LAND PASS Portal.\nUsername: ${currentUser.username}\nVillage: ${currentUser.villageName || currentVillage.villageName}\nPhone: ${currentUser.phoneNumber || 'N/A'}\nUID: ${currentUser.uid}\n\nPlease approve my account so I can issue Land Passes.`
    );
    window.open(`https://wa.me/917005504074?text=${text}`, '_blank');
  };

  const notifyAuthorityEmail = () => {
    const subject = encodeURIComponent(`VC Land Pass Secretary Approval Request - ${currentUser.username}`);
    const body = encodeURIComponent(
      `Respected Authority,\n\nI have created my VC Secretary account for ${currentUser.villageName || currentVillage.villageName}.\n\nDetails:\nUsername: ${currentUser.username}\nUID: ${currentUser.uid}\nPhone: ${currentUser.phoneNumber || 'N/A'}\nVillage: ${currentUser.villageName || currentVillage.villageName}\nRegistration Fee: Paid (Screenshot Attached)\n\nPlease approve my account for Lifetime Live access.\n\nThank you,\n${currentUser.displayName || currentUser.username}`
    );
    window.location.href = `mailto:ptlalfakzuala@gmail.com?subject=${subject}&body=${body}`;
  };

  const huanRamCount = userPasses.filter((p) => p.passType === 'huan_ram').length;
  const inHmunCount = userPasses.filter((p) => p.passType === 'in_hmun').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-800">
            Secretary Account &amp; Identity
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900">
            Secretary Profile Page
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Manage your personal credentials, contact details, profile photo, and security password.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToVillage}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>My Village Council</span>
          </button>
          <button
            onClick={onNavigateToPasses}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Land Records ({userPasses.length})</span>
          </button>
        </div>
      </div>

      {/* Approval Status Banner */}
      {isApproved ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-950">
                  Approved by Authority • Completely Live for Lifetime
                </h3>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Verified
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your Village Council Secretary authority is fully authorized to issue, sign, and print official Land Passes.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Account Pending Authority Approval
                </h3>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Issuing new Land Passes is held until Full Authority reviews your ₹299 registration fee proof and activates your account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={notifyAuthorityWhatsApp}
              className="flex-1 md:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Authority</span>
            </button>
            <button
              onClick={notifyAuthorityEmail}
              className="flex-1 md:flex-none px-3.5 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>Email Authority</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-sm">
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Top Profile Photo Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-neutral-100">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-neutral-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl shadow-md transition"
                title="Upload Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-neutral-900">
                  {currentUser.displayName || currentUser.username || 'Secretary User'}
                </h2>
                <span className="px-2.5 py-0.5 bg-neutral-100 border border-neutral-300 rounded-full text-[11px] font-mono font-bold text-neutral-700">
                  {currentUser.userType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                UID: {currentUser.uid}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition"
                >
                  Upload New Photo
                </button>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">Huan Ram</span>
                <span className="text-lg font-black text-emerald-900 font-mono">{huanRamCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500 block">In Hmun</span>
                <span className="text-lg font-black text-emerald-900 font-mono">{inHmunCount}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Login Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter login username"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  required
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Used to log into this Secretary portal account.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Secretary Full Name / Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. C. Lalramnghaka"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Name printed on official passes as Secretary Signatory.
              </p>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Contact Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9436124589"
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Primary phone for authority notifications and verification.
              </p>
            </div>

            {/* Password / Secret Key */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                Password / Secret Access Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter login password / secret key"
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Keep this safe. You will enter this key when logging into your council portal.
              </p>
            </div>
          </div>

          {/* Associated Village Council Card */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-neutral-300 flex items-center justify-center text-emerald-800 shadow-sm shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-neutral-500 block">
                  Assigned Village Council
                </span>
                <h4 className="text-base font-bold text-neutral-900">
                  {currentVillage.villageName || currentUser.villageName || 'Village Council'}
                </h4>
                <p className="text-xs text-neutral-500">
                  ID: {currentVillage.id} • {currentVillage.districtName || 'Mizoram'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToVillage}
              className="px-4 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Manage Village Council Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
