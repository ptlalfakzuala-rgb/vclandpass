import React, { useState, useEffect, useRef } from 'react';
import { VillageConfig } from '../types';
import {
  X,
  Building2,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Trash2,
  FileText,
  Shield,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { logActivity } from '../services/auditLogger';

interface VillageProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  village: VillageConfig;
  onSave: (updatedVillage: VillageConfig) => void;
  currentUserDisplayName?: string | null;
  isMandatory?: boolean;
}

const STANDARD_TEMPLATE = `CONDITIONS & RESTRICTION
1. Huan ram / In hmun hi ramri ziah anga pek a ni a.
2. An ri-te inkar chin a huam ang.
3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.
4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.
5. VC ten tul bik thil ah an cancel thei ang.
6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.`;

export const VillageProfileModal: React.FC<VillageProfileModalProps> = ({
  isOpen,
  onClose,
  village,
  onSave,
  currentUserDisplayName,
  isMandatory = false,
}) => {
  // Empty states - NO PRE-FILLED FAKE DATA
  const [villageName, setVillageName] = useState<string>('');
  const [blockName, setBlockName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [huanRamPrefix, setHuanRamPrefix] = useState<string>('');
  const [inHmunPrefix, setInHmunPrefix] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [conditionsAndTerms, setConditionsAndTerms] = useState<string>('');
  const [presidentName, setPresidentName] = useState<string>('');
  const [startingPassNumber, setStartingPassNumber] = useState<number | string>(1001);
  const [startingHuanRamNumber, setStartingHuanRamNumber] = useState<number | string>(1001);
  const [startingInHmunNumber, setStartingInHmunNumber] = useState<number | string>(1001);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Strictly NO prefilled dummy text input and NO prefilled photo
    if (village && village.id !== 'saiphai_default' && village.id !== 'preset') {
      setVillageName(village.villageName || '');
      setBlockName(village.blockName || '');
      setDistrictName(village.districtName || '');
      setStateName(village.stateName || '');
      setPinCode(village.pinCode || '');
      setHuanRamPrefix(village.huanRamPrefix || '');
      setInHmunPrefix(village.inHmunPrefix || '');
      setLogoUrl(village.logoUrl || '');
      setConditionsAndTerms(village.conditionsAndTerms || '');
      setPresidentName(village.presidentName || '');
      setStartingPassNumber(village.startingPassNumber || 1001);
      setStartingHuanRamNumber(village.startingHuanRamNumber || village.startingPassNumber || 1001);
      setStartingInHmunNumber(village.startingInHmunNumber || village.startingPassNumber || 1001);
    } else {
      setVillageName('');
      setBlockName('');
      setDistrictName('');
      setStateName('');
      setPinCode('');
      setHuanRamPrefix('');
      setInHmunPrefix('');
      setLogoUrl('');
      setConditionsAndTerms('');
      setPresidentName('');
      setStartingPassNumber(1001);
      setStartingHuanRamNumber(1001);
      setStartingInHmunNumber(1001);
    }
    setErrors({});
  }, [village, isOpen]);

  if (!isOpen) return null;

  // Process and scale uploaded logo to exactly 170x170 px
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          // Render into 170x170 canvas
          const canvas = document.createElement('canvas');
          canvas.width = 170;
          canvas.height = 170;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 170, 170);

            // Calculate aspect fit within 170x170
            const scale = Math.min(170 / img.width, 170 / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (170 - w) / 2;
            const y = (170 - h) / 2;

            ctx.drawImage(img, x, y, w, h);
            const scaledDataUrl = canvas.toDataURL('image/png');
            setLogoUrl(scaledDataUrl);
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!villageName.trim()) errs.villageName = 'Village Name is mandatory';
    if (!blockName.trim()) errs.blockName = 'Block Name is mandatory';
    if (!districtName.trim()) errs.districtName = 'District Name is mandatory';
    if (!stateName.trim()) errs.stateName = 'State Name is mandatory';
    if (!pinCode.trim()) errs.pinCode = 'PIN Code is mandatory';
    if (!huanRamPrefix.trim()) errs.huanRamPrefix = 'Huan Ram Pass prefix is mandatory (e.g. MZ-05-SPH-HR-)';
    if (!inHmunPrefix.trim()) errs.inHmunPrefix = 'In Hmun Pass prefix is mandatory (e.g. MZ-05-SPH-IH-)';
    if (!conditionsAndTerms.trim()) errs.conditionsAndTerms = 'Village Land Pass Conditions & Terms are mandatory';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedStartHR = parseInt(String(startingHuanRamNumber), 10) || 1001;
    const parsedStartIH = parseInt(String(startingInHmunNumber), 10) || 1001;
    const parsedStartGeneral = parseInt(String(startingPassNumber), 10) || 1001;

    const updatedConfig: VillageConfig = {
      ...village,
      villageName: villageName.trim(),
      blockName: blockName.trim(),
      districtName: districtName.trim(),
      stateName: stateName.trim(),
      pinCode: pinCode.trim(),
      huanRamPrefix: huanRamPrefix.trim().endsWith('-') || huanRamPrefix.trim().endsWith('/') ? huanRamPrefix.trim() : `${huanRamPrefix.trim()}-`,
      inHmunPrefix: inHmunPrefix.trim().endsWith('-') || inHmunPrefix.trim().endsWith('/') ? inHmunPrefix.trim() : `${inHmunPrefix.trim()}-`,
      startingPassNumber: parsedStartGeneral,
      startingHuanRamNumber: parsedStartHR,
      startingInHmunNumber: parsedStartIH,
      logoUrl: logoUrl.trim(),
      conditionsAndTerms: conditionsAndTerms.trim(),
      presidentName: presidentName.trim() || 'President',
      emblemLogoUrl: village.emblemLogoUrl || '/assets/aistudio/images__3__109dbb99.jpg',
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    };

    logActivity(
      'VILLAGE_PROFILE_UPDATE',
      village.id,
      villageName,
      currentUserDisplayName || 'Council Secretary',
      `Configured official Village Council profile for ${updatedConfig.villageName} with starting numbers (HR: ${parsedStartHR}, IH: ${parsedStartIH}), prefixes (${updatedConfig.huanRamPrefix}, ${updatedConfig.inHmunPrefix}), and custom bylaws.`
    );

    onSave(updatedConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span>Village Council Profile &amp; Land Pass Bylaws</span>
                {isMandatory && (
                  <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-2 py-0.5 rounded-full uppercase">
                    Mandatory Setup
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-300">
                Setup your Village Name, RD Block, District, 170x170 px Logo, and Custom Terms
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isMandatory && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Profile configuration is mandatory. Please fill in your official Village Council details and custom terms below before issuing passes.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Official Jurisdiction Details */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-2">
              1. Official Village Jurisdiction (Mandatory)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Village Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Village Name"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
                {errors.villageName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.villageName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  RD Block Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter RD Block Name"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                {errors.blockName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.blockName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  District Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter District Name"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                {errors.districtName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.districtName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  State Name *
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                {errors.stateName && (
                  <p className="text-xs text-rose-600 mt-1">{errors.stateName}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Postal PIN Code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                />
                {errors.pinCode && (
                  <p className="text-xs text-rose-600 mt-1">{errors.pinCode}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Council President Name
                </label>
                <input
                  type="text"
                  placeholder="Enter President Name"
                  value={presidentName}
                  onChange={(e) => setPresidentName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Land Pass Prefixes & Starting Numbers */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                2. Land Pass Serial Prefixes &amp; Starting Numbers (Mandatory)
              </label>
              <span className="text-[11px] text-neutral-500">
                Custom sequence starting numbers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Huan Ram Prefix & Starting Number */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950">Huan Ram Pass (Agricultural)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">Prefix + Number</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MZ-05-SPH-HR- or VC/SPH/HR/"
                    value={huanRamPrefix}
                    onChange={(e) => setHuanRamPrefix(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-900"
                  />
                  {errors.huanRamPrefix && (
                    <p className="text-xs text-rose-600 mt-1">{errors.huanRamPrefix}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Starting Land Pass Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 1001 or 1"
                    value={startingHuanRamNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStartingHuanRamNumber(val);
                      setStartingPassNumber(val);
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-900"
                  />
                </div>

                <div className="bg-emerald-50/80 p-2 rounded-lg text-[11px] text-emerald-900 font-mono flex items-center justify-between">
                  <span>First Pass Output:</span>
                  <strong className="text-emerald-700 font-bold">
                    {huanRamPrefix ? `${huanRamPrefix}${startingHuanRamNumber || 1001}` : `VC/HR/${startingHuanRamNumber || 1001}`}
                  </strong>
                </div>
              </div>

              {/* In Hmun Prefix & Starting Number */}
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950">In Hmun Pass (Residential)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">Prefix + Number</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Prefix *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MZ-05-SPH-IH- or VC/SPH/IH/"
                    value={inHmunPrefix}
                    onChange={(e) => setInHmunPrefix(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold text-blue-900"
                  />
                  {errors.inHmunPrefix && (
                    <p className="text-xs text-rose-600 mt-1">{errors.inHmunPrefix}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Starting Land Pass Number *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 1001 or 1"
                    value={startingInHmunNumber}
                    onChange={(e) => setStartingInHmunNumber(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs font-mono font-bold text-blue-900"
                  />
                </div>

                <div className="bg-blue-50/80 p-2 rounded-lg text-[11px] text-blue-900 font-mono flex items-center justify-between">
                  <span>First Pass Output:</span>
                  <strong className="text-blue-700 font-bold">
                    {inHmunPrefix ? `${inHmunPrefix}${startingInHmunNumber || 1001}` : `VC/IH/${startingInHmunNumber || 1001}`}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photo Picker for Village Council Logo (170x170 px) */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
                3. Village Council Official Logo (170 x 170 px)
              </label>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
                Size: 170 x 170 pixels
              </span>
            </div>
            <p className="text-xs text-amber-800">
              Upload your Village Council logo or seal. It is automatically scaled to <strong>170 x 170 px</strong> and prominently rendered in the official Land Pass letterhead.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {logoUrl ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-amber-300">
                <div
                  className="w-[170px] h-[170px] bg-neutral-50 rounded-xl border-2 border-emerald-800 p-2 flex items-center justify-center shrink-0 shadow-sm"
                  style={{ width: '170px', height: '170px' }}
                >
                  <img
                    src={logoUrl}
                    alt="Council Logo 170x170"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <span className="text-xs font-bold text-neutral-900 block">
                    Official Council Seal (170 × 170 px)
                  </span>
                  <p className="text-xs text-emerald-700">
                    ✓ Scaled &amp; ready. Appears in the Land Pass letterhead.
                  </p>
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition"
                    >
                      Remove Logo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white/80 hover:bg-white p-5 rounded-xl flex flex-col items-center justify-center gap-2 transition text-neutral-600"
              >
                <div className="w-[170px] h-[170px] border border-dashed border-amber-400 rounded-lg flex flex-col items-center justify-center bg-amber-50/50 text-amber-800">
                  <Upload className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">170 × 170 px</span>
                  <span className="text-[10px] text-amber-600">Council Logo Frame</span>
                </div>
                <span className="text-xs font-semibold text-neutral-800 mt-1">
                  Click to choose Village Council Logo image
                </span>
                <span className="text-[11px] text-neutral-500">
                  Accepts PNG, JPG, WebP. Automatically formatted to 170x170 px.
                </span>
              </button>
            )}
          </div>

          {/* Section 4: Land Pass Conditions & Terms (Customizable per village) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 block">
                4. Land Pass Conditions &amp; Terms (Custom Village Bylaws) *
              </label>
              <button
                type="button"
                onClick={() => setConditionsAndTerms(STANDARD_TEMPLATE)}
                className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Insert Standard Mizo Template
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-2">
              Every village has different customary conditions and terms. Write your Village Council Court's specific restrictions and clauses below.
            </p>
            <textarea
              rows={8}
              required
              value={conditionsAndTerms}
              onChange={(e) => setConditionsAndTerms(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-serif leading-relaxed"
              placeholder="Write your Village Council land pass conditions & terms here..."
            />
            {errors.conditionsAndTerms && (
              <p className="text-xs text-rose-600 mt-1">{errors.conditionsAndTerms}</p>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Settings are saved immediately and update your letterhead and pass numbers.
            </span>
            <div className="flex items-center gap-2">
              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-xl transition shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Save Village Profile &amp; Continue
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
