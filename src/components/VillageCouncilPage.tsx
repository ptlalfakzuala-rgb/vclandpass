import React, { useState, useRef, useEffect } from 'react';
import { VillageConfig, UserProfile } from '../types';
import {
  Building2,
  MapPin,
  FileText,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  User,
  Sliders,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { saveVillageConfig } from '../services/villageService';
import { logActivity } from '../services/auditLogger';

interface VillageCouncilPageProps {
  currentVillage: VillageConfig;
  currentUser: UserProfile;
  onVillageSaved: (updatedVillage: VillageConfig) => void;
  onNavigateToSecretaryProfile: () => void;
  onNavigateToPasses: () => void;
}

export const VillageCouncilPage: React.FC<VillageCouncilPageProps> = ({
  currentVillage,
  currentUser,
  onVillageSaved,
  onNavigateToSecretaryProfile,
  onNavigateToPasses,
}) => {
  // Empty initial state - NO PREFILLED FAKE DATA
  const [villageName, setVillageName] = useState<string>('');
  const [blockName, setBlockName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('Mizoram');
  const [pinCode, setPinCode] = useState<string>('');
  const [presidentName, setPresidentName] = useState<string>('');
  const [secretaryName, setSecretaryName] = useState<string>('');
  const [huanRamPrefix, setHuanRamPrefix] = useState<string>('');
  const [inHmunPrefix, setInHmunPrefix] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const DEFAULT_LAD_EMBLEM = '/assets/aistudio/images__3__109dbb99.jpg';
  const [emblemLogoUrl, setEmblemLogoUrl] = useState<string>(DEFAULT_LAD_EMBLEM);
  const [conditionsAndTerms, setConditionsAndTerms] = useState<string>('');
  const [startingPassNumber, setStartingPassNumber] = useState<number | string>(1001);
  const [startingHuanRamNumber, setStartingHuanRamNumber] = useState<number | string>(1001);
  const [startingInHmunNumber, setStartingInHmunNumber] = useState<number | string>(1001);

  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const emblemInputRef = useRef<HTMLInputElement>(null);

  // Load existing data for this user's village (if not fake preset)
  useEffect(() => {
    if (currentVillage) {
      setVillageName(currentVillage.villageName || '');
      setBlockName(currentVillage.blockName || '');
      setDistrictName(currentVillage.districtName || '');
      setStateName(currentVillage.stateName || 'Mizoram');
      setPinCode(currentVillage.pinCode || '');
      setPresidentName(currentVillage.presidentName || '');
      setSecretaryName(currentVillage.secretaryName || currentUser.displayName || currentUser.username || '');
      setHuanRamPrefix(currentVillage.huanRamPrefix || '');
      setInHmunPrefix(currentVillage.inHmunPrefix || '');
      setStartingPassNumber(currentVillage.startingPassNumber || 1001);
      setStartingHuanRamNumber(currentVillage.startingHuanRamNumber || currentVillage.startingPassNumber || 1001);
      setStartingInHmunNumber(currentVillage.startingInHmunNumber || currentVillage.startingPassNumber || 1001);
      setLogoUrl(currentVillage.logoUrl || '');
      setEmblemLogoUrl(currentVillage.emblemLogoUrl || DEFAULT_LAD_EMBLEM);
      setConditionsAndTerms(currentVillage.conditionsAndTerms || '');
    }
  }, [currentVillage, currentUser]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select an image file (JPEG or PNG)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 350;
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
            setLogoUrl(canvas.toDataURL('image/png', 0.85));
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle State Emblem Upload
  const handleEmblemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please select an image file for the Emblem (JPEG or PNG)' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 350;
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
            setEmblemLogoUrl(canvas.toDataURL('image/png', 0.88));
          } else {
            setEmblemLogoUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!villageName.trim()) {
      setStatusMsg({ type: 'error', text: 'Village Name is required' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    const cleanInit = (villageName.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'VC').toUpperCase();
    const parsedStartHR = parseInt(String(startingHuanRamNumber), 10) || 1001;
    const parsedStartIH = parseInt(String(startingInHmunNumber), 10) || 1001;
    const parsedStartGeneral = parseInt(String(startingPassNumber), 10) || 1001;

    const updatedVillage: VillageConfig = {
      ...currentVillage,
      id: currentVillage.id || `village_${currentUser.uid}`,
      villageName: villageName.trim(),
      blockName: blockName.trim(),
      districtName: districtName.trim(),
      stateName: stateName.trim() || 'Mizoram',
      pinCode: pinCode.trim(),
      presidentName: presidentName.trim(),
      secretaryName: secretaryName.trim() || currentUser.displayName || currentUser.username || '',
      huanRamPrefix: huanRamPrefix.trim() || `VC/${cleanInit}/HR/`,
      inHmunPrefix: inHmunPrefix.trim() || `VC/${cleanInit}/IH/`,
      startingPassNumber: parsedStartGeneral,
      startingHuanRamNumber: parsedStartHR,
      startingInHmunNumber: parsedStartIH,
      logoUrl: logoUrl || undefined,
      emblemLogoUrl: emblemLogoUrl || DEFAULT_LAD_EMBLEM,
      conditionsAndTerms: conditionsAndTerms.trim() || currentVillage.conditionsAndTerms,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveVillageConfig(updatedVillage);
      await logActivity(
        'VILLAGE_PROFILE_UPDATE',
        updatedVillage.id,
        updatedVillage.villageName,
        currentUser.displayName || currentUser.username || 'Secretary',
        `Updated Village Council Profile for ${updatedVillage.villageName}`
      );

      onVillageSaved(updatedVillage);
      setStatusMsg({ type: 'success', text: `Village Council profile for ${updatedVillage.villageName} saved successfully to Firestore!` });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to save Village Council profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-800">
            Dedicated Village Council Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900">
            My Village Council Page
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Every Secretary manages an independent Village Council profile with dedicated letterhead, boundaries, and official stamps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToSecretaryProfile}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span>Secretary Profile</span>
          </button>
          <button
            onClick={onNavigateToPasses}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Land Records Registry</span>
          </button>
        </div>
      </div>

      {/* Official Letterhead Live Preview */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 p-2 flex items-center justify-center shrink-0 shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-12 h-12 text-emerald-300" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-300 font-bold bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700/50 inline-block">
              Official Council Letterhead Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white uppercase">
              {villageName ? `${villageName} VILLAGE COUNCIL` : 'VILLAGE COUNCIL, MIZORAM'}
            </h2>
            <p className="text-xs text-emerald-100 font-medium tracking-wider uppercase">
              OFFICE OF THE VILLAGE COUNCIL{blockName ? ` • ${blockName}` : ''}{districtName ? ` • ${districtName}` : ''}{stateName ? ` • ${stateName}` : ''}{pinCode ? ` • PIN: ${pinCode}` : ''}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-emerald-200 pt-1 font-mono">
              <span>Secretary: <strong>{secretaryName || currentUser.displayName || currentUser.username}</strong></span>
              <span>•</span>
              <span>President: <strong>{presidentName || 'Council President'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Form */}
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
          {/* Section 1: Official Logos & Emblems */}
          <div className="pb-6 border-b border-neutral-100 space-y-6">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>Village Council Logo &amp; Official Emblem (Print/Save View)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Village Council Logo (Left Frame) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  1. Village Council Logo (Left Frame)
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Council Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[11px] text-neutral-600">
                      Appears on the left side of official certificates and council letterhead.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* 2. Official Emblem Logo (Right Frame for Print/Save) */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                  2. Official Emblem Logo (Right Frame - Print/Save)
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white border border-neutral-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {emblemLogoUrl ? (
                      <img src={emblemLogoUrl} alt="State Emblem Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center p-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase block font-mono">
                          DEFAULT
                        </span>
                        <span className="text-[9px] text-neutral-400 block font-mono">
                          Govt Seal
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-[11px] text-neutral-600">
                      Official state/national emblem displayed on the right header in Print &amp; PDF certificate view.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => emblemInputRef.current?.click()}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{emblemLogoUrl ? 'Change Emblem' : 'Upload Emblem'}</span>
                      </button>
                      {emblemLogoUrl && emblemLogoUrl !== DEFAULT_LAD_EMBLEM && (
                        <button
                          type="button"
                          onClick={() => setEmblemLogoUrl(DEFAULT_LAD_EMBLEM)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset to Default</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={emblemInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEmblemUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Village Council Geographic & Address Particulars */}
          <div className="space-y-4 pb-6 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Council Office &amp; Address Particulars</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Village Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Village Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="e.g. Saiphai, Bilkhawthlir, Darlawn"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  required
                />
              </div>

              {/* RD Block */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  RD Block Name
                </label>
                <input
                  type="text"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  placeholder="e.g. Bilkhawthlir RD Block"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  District Name
                </label>
                <input
                  type="text"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  placeholder="e.g. Kolasib District"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
              </div>

              {/* State & Pincode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Mizoram"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="e.g. 796091"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Council Signatories */}
          <div className="space-y-4 pb-6 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Council Signatories &amp; Officials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Council President Name
                </label>
                <input
                  type="text"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  placeholder="e.g. Lalthansanga"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Printed on the certificate signature line, with the official rubber seal stamp box placed directly under the President name.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Secretary Name
                </label>
                <input
                  type="text"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  placeholder="e.g. C. Lalramnghaka"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Secretary signatory printed on passes.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Pass Numbering Prefixes & Starting Numbers */}
          <div className="space-y-4 pb-6 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <span>Pass Numbering Prefixes &amp; Starting Numbers</span>
              </h3>
              <span className="text-[11px] text-neutral-500 font-medium">
                Set starting sequence number for new passes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Huan Ram */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Huan Ram Pass (Agricultural)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md font-mono">
                    Output: {huanRamPrefix ? `${huanRamPrefix}${startingHuanRamNumber || 1001}` : `VC/HR/${startingHuanRamNumber || 1001}`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Serial Prefix
                  </label>
                  <input
                    type="text"
                    value={huanRamPrefix}
                    onChange={(e) => setHuanRamPrefix(e.target.value)}
                    placeholder="e.g. SPH/VC/HR/ or MZ-05-SPH-HR-"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Starting Land Pass Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startingHuanRamNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartingHuanRamNumber(val);
                      setStartingPassNumber(val);
                    }}
                    placeholder="e.g. 1001 or 1"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-emerald-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    First issued Huan Ram pass begins at this number if no prior passes exist.
                  </span>
                </div>
              </div>

              {/* In Hmun */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    In Hmun Pass (Residential)
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-md font-mono">
                    Output: {inHmunPrefix ? `${inHmunPrefix}${startingInHmunNumber || 1001}` : `VC/IH/${startingInHmunNumber || 1001}`}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Serial Prefix
                  </label>
                  <input
                    type="text"
                    value={inHmunPrefix}
                    onChange={(e) => setInHmunPrefix(e.target.value)}
                    placeholder="e.g. SPH/VC/IH/ or MZ-05-SPH-IH-"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Starting Land Pass Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startingInHmunNumber}
                    onChange={(e) => setStartingInHmunNumber(e.target.value)}
                    placeholder="e.g. 1001 or 1"
                    className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-blue-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    First issued In Hmun pass begins at this number if no prior passes exist.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Conditions & Restrictions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Conditions &amp; Restrictions (Printed on Back Page / Page 2)
            </label>
            <textarea
              rows={6}
              value={conditionsAndTerms}
              onChange={(e) => setConditionsAndTerms(e.target.value)}
              placeholder="Enter standard conditions and restrictions in Mizo or English..."
              className="w-full p-4 bg-neutral-50 border border-neutral-300 rounded-2xl text-xs font-mono leading-relaxed text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Council Profile...' : 'Save Village Council Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
