import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { LandPass, VillageConfig, PrintSettings } from '../types';
import {
  Printer,
  X,
  Share2,
  ShieldCheck,
  FileText,
  MapPin,
  Sliders,
  Check,
  Upload,
  Camera,
  Trash2,
  Edit3,
} from 'lucide-react';
import { logActivity } from '../services/auditLogger';
import { saveVillageConfig } from '../services/villageService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { cleanForFirestore } from '../services/userService';

interface PrintableLandPassProps {
  pass: LandPass;
  village: VillageConfig;
  onClose: () => void;
  currentUserEmail?: string | null;
  settings?: PrintSettings;
  onOpenSettings?: () => void;
  onVillageUpdated?: (village: VillageConfig) => void;
  onPassUpdated?: (pass: LandPass) => void;
  onDelete?: (pass: LandPass) => void;
}

const DEFAULT_SETTINGS: PrintSettings = {
  theme: 'classic_heritage',
  fontStyle: 'sans', // Clean modern sans is default as requested
  showWatermark: true,
  borderStyle: 'double',
  fontSize: 'standard',
};

export const PrintableLandPass: React.FC<PrintableLandPassProps> = ({
  pass,
  village,
  onClose,
  currentUserEmail,
  settings = DEFAULT_SETTINGS,
  onOpenSettings,
  onVillageUpdated,
  onPassUpdated,
  onDelete,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Editable President Name for signature
  const [presidentName, setPresidentName] = useState<string>(
    pass.presidentSignatory || village.presidentName || ''
  );
  const [isEditingPresident, setIsEditingPresident] = useState<boolean>(false);

const DEFAULT_LAD_EMBLEM_URL = '/assets/aistudio/images__3__109dbb99.jpg';

  // Emblem Logo state (Default: Official LAD Government of Mizoram Emblem)
  const [emblemLogoUrl, setEmblemLogoUrl] = useState<string>(
    village.emblemLogoUrl || DEFAULT_LAD_EMBLEM_URL
  );
  const emblemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmblemLogoUrl(village.emblemLogoUrl || DEFAULT_LAD_EMBLEM_URL);
  }, [village.emblemLogoUrl]);

  // Direct verification URL
  const verificationUrl = `${window.location.origin}/?verify=${encodeURIComponent(pass.passNumber)}`;

  // Theme colors
  const getThemeColors = () => {
    switch (settings.theme) {
      case 'royal_official':
        return {
          primary: '#1e3a8a',
          secondary: '#172554',
          accent: 'text-blue-900',
          pageBg: 'bg-white',
        };
      case 'modern_government':
        return {
          primary: '#0f172a',
          secondary: '#334155',
          accent: 'text-slate-900',
          pageBg: 'bg-white',
        };
      case 'parchment_ivory':
        return {
          primary: '#3f2e18',
          secondary: '#78350f',
          accent: 'text-amber-950',
          pageBg: 'bg-[#faf7ee]',
        };
      case 'classic_heritage':
      default:
        return {
          primary: '#064e3b',
          secondary: '#022c22',
          accent: 'text-emerald-950',
          pageBg: 'bg-white',
        };
    }
  };

  const themeCols = getThemeColors();

  // Font family: clean modern sans is default
  const getFontFamilyClass = () => {
    switch (settings.fontStyle) {
      case 'serif':
        return 'font-serif';
      case 'slab':
        return 'font-serif tracking-wide';
      case 'sans':
      default:
        return 'font-sans';
    }
  };

  const fontClass = getFontFamilyClass();

  useEffect(() => {
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 240,
        margin: 1,
        color: {
          dark: themeCols.primary,
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [verificationUrl, settings.theme]);

  // Handle uploading/changing emblem logo
  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = async () => {
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
            const base64Emblem = canvas.toDataURL('image/png', 0.88);
            setEmblemLogoUrl(base64Emblem);

            const updatedVillage: VillageConfig = {
              ...village,
              emblemLogoUrl: base64Emblem,
            };
            await saveVillageConfig(updatedVillage);
            onVillageUpdated?.(updatedVillage);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEmblem = async () => {
    setEmblemLogoUrl(DEFAULT_LAD_EMBLEM_URL);
    const updatedVillage: VillageConfig = {
      ...village,
      emblemLogoUrl: DEFAULT_LAD_EMBLEM_URL,
    };
    await saveVillageConfig(updatedVillage);
    onVillageUpdated?.(updatedVillage);
  };

  // Handle saving President name
  const handlePresidentNameChange = async (newName: string) => {
    setPresidentName(newName);
    // Update local pass
    const updatedPass: LandPass = {
      ...pass,
      presidentSignatory: newName,
    };
    onPassUpdated?.(updatedPass);

    // Save to Firestore pass doc
    if (navigator.onLine && pass.id) {
      try {
        const passRef = doc(db, 'land_passes', pass.id);
        await setDoc(passRef, cleanForFirestore({ ...updatedPass, syncedToCloud: true }), { merge: true });
      } catch (err) {
        console.warn('Could not update pass president signatory:', err);
      }
    }

    // Save to Village config
    const updatedVillage: VillageConfig = {
      ...village,
      presidentName: newName,
    };
    await saveVillageConfig(updatedVillage);
    onVillageUpdated?.(updatedVillage);
  };

  const handlePrint = () => {
    logActivity(
      'PRINT_PASS',
      pass.id,
      pass.passNumber,
      currentUserEmail || 'User',
      `Printed / saved A4 Land Pass ${pass.passNumber} for ${pass.ownerName} (${village.villageName})`
    );
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Hidden file input for emblem logo */}
      <input
        ref={emblemInputRef}
        type="file"
        accept="image/*"
        onChange={handleEmblemUpload}
        className="hidden"
      />

      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* ============================================================== */}
        {/* TOP CONTROL BAR (HIDDEN IN PRINT)                             */}
        {/* ============================================================== */}
        <div className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl print:hidden text-white">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-emerald-900/80 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>{pass.passNumber}</span>
                <span className="text-[11px] font-normal text-neutral-400">
                  ({pass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'})
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Official 2-Page Print &amp; PDF Archival View &bull; Default Clean Modern Sans
              </p>
            </div>
          </div>

          {/* Quick Input for President Name & Emblem Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
            {/* Input President name for signature */}
            <div className="flex items-center gap-1.5 bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700">
              <span className="text-xs text-neutral-400 font-semibold whitespace-nowrap">
                President Name:
              </span>
              <input
                type="text"
                placeholder="Enter President Name"
                value={presidentName}
                onChange={(e) => handlePresidentNameChange(e.target.value)}
                className="bg-neutral-900 border border-neutral-600 rounded-lg px-2 py-0.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-44 font-semibold"
                title="Input President Name for signature line"
              />
            </div>

            {/* Change Emblem Logo button */}
            <button
              onClick={() => emblemInputRef.current?.click()}
              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-700"
              title="Upload / Change official Emblem Logo for print/save view"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{emblemLogoUrl ? 'Change Emblem' : 'Upload Emblem'}</span>
            </button>

            {emblemLogoUrl && (
              <button
                onClick={handleRemoveEmblem}
                className="p-1.5 bg-neutral-800 hover:bg-rose-900 text-neutral-400 hover:text-rose-200 rounded-xl transition border border-neutral-700"
                title="Reset to default official state emblem"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center gap-1 transition border border-neutral-700"
                title="Customize Themes & Fonts"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theme</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center gap-1 transition border border-neutral-700"
              title="Copy verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Print Certificate (Page 1 & Back Page 2)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(pass)}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-800 shadow-xs"
                title="Delete this Land Pass (Opens warning dialogue box)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete Pass</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAGE 1: FRONT PAGE (OFFICIAL A4 CERTIFICATE WITH BLANK SEAL)   */}
        {/* ============================================================== */}
        <div
          id="land-pass-certificate-page-1"
          className={`print-a4-page w-full ${themeCols.pageBg} text-neutral-900 rounded-xl shadow-2xl p-6 sm:p-9 ${fontClass} relative overflow-hidden print:m-0 print:w-full print:rounded-none print:shadow-none print:p-8 min-h-[1050px] flex flex-col justify-between`}
          style={{
            border:
              settings.borderStyle === 'double'
                ? '6px double #171717'
                : settings.borderStyle === 'ornate'
                ? '8px double #064e3b'
                : '3px solid #171717',
          }}
        >
          {/* Subtle Background Watermark */}
          {settings.showWatermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-3 select-none rotate-[-25deg]">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl font-black tracking-widest text-neutral-900 uppercase">
                  {village.villageName || 'VILLAGE COUNCIL'}
                </div>
                <div className="text-2xl sm:text-3xl font-bold tracking-widest mt-1 text-neutral-800 uppercase">
                  COURT &bull; MIZORAM
                </div>
              </div>
            </div>
          )}

          {/* Ornate Corner Accents */}
          <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-neutral-900 pointer-events-none"></div>
          <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-neutral-900 pointer-events-none"></div>
          <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-neutral-900 pointer-events-none"></div>
          <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-neutral-900 pointer-events-none"></div>

          <div>
            {/* TIGHT & REFINED LETTERHEAD HEADER */}
            <div className="border-b-2 border-neutral-900 pb-3 mb-4">
              <div className="flex items-center justify-between gap-4">
                {/* Council Logo (Left Frame) */}
                <div className="shrink-0 flex items-center justify-center">
                  {village.logoUrl ? (
                    <div className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-xl border border-neutral-300 p-1 bg-white shadow-2xs flex items-center justify-center overflow-hidden">
                      <img
                        src={village.logoUrl}
                        alt={`${village.villageName || 'Council'} Logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] rounded-xl border-2 border-double border-neutral-800 p-2 bg-amber-50/70 flex flex-col items-center justify-center text-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-1 bg-white font-bold text-xs">
                        VC
                      </div>
                      <span className="text-[11px] font-black tracking-widest uppercase text-neutral-900">
                        COURT
                      </span>
                      <span className="text-[10px] text-neutral-600">
                        MIZORAM
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Heading Text */}
                <div className="text-center flex-1 space-y-1">
                  <div className="inline-block bg-neutral-900 text-white text-xs font-mono tracking-widest px-3.5 py-0.5 rounded-full uppercase font-bold mb-0.5">
                    Government of Mizoram
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-wider text-neutral-950 uppercase leading-tight">
                    OFFICE OF THE VILLAGE COUNCIL
                  </h1>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 uppercase">
                    {village.villageName ? `${village.villageName.toUpperCase()} : MIZORAM` : 'VILLAGE COUNCIL, MIZORAM'}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 font-medium">
                    {village.districtName ? `${village.districtName}` : 'Mizoram'} {village.blockName ? `• ${village.blockName}` : ''} {village.pinCode ? `• PIN: ${village.pinCode}` : ''}
                  </p>
                </div>

                {/* State / Official Emblem Logo Frame (Right Frame - Customizable) */}
                <div
                  className="shrink-0 flex flex-col items-center justify-center w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] border border-neutral-300 rounded-xl p-1 bg-white text-center shadow-2xs relative group cursor-pointer"
                  onClick={() => emblemInputRef.current?.click()}
                  title="Click to Change Emblem Logo"
                >
                  <img
                    src={emblemLogoUrl || DEFAULT_LAD_EMBLEM_URL}
                    alt="Local Administration Department, Government of Mizoram Official Emblem"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition print:hidden">
                    Change Emblem
                  </div>

                  {/* Hover prompt in preview mode (hidden in print) */}
                  <div className="absolute inset-0 bg-neutral-900/60 text-white rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition print:hidden">
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-bold">Change Emblem</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Header: Certificate Title & Sequential Pass Number Badge */}
            <div className="bg-neutral-100/90 border border-neutral-300 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-center sm:text-left">
                <span className="text-xs font-mono uppercase text-neutral-600 tracking-wider block font-semibold">
                  Document Title &bull; Land Pass Record
                </span>
                <span className="text-base sm:text-lg font-black text-neutral-950 uppercase tracking-wide">
                  {pass.passType === 'huan_ram'
                    ? 'HUAN RAM NEIHNA LEHKHA (GARDEN/AGRI LAND PASS)'
                    : 'IN HMUN NEIHNA LEHKHA (RESIDENTIAL/HOUSE SITE PASS)'}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-xs font-mono text-neutral-600 block font-semibold">
                  Sequential Pass No.
                </span>
                <span className="text-sm sm:text-base font-mono font-black text-emerald-950 bg-white border border-neutral-300 px-3 py-1 rounded-lg inline-block shadow-2xs">
                  {pass.passNumber}
                </span>
              </div>
            </div>

            {/* Document Details Grid - Consistent & Legible Typography */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs sm:text-sm mb-4">
              {/* Left Column: Owner & Property Details */}
              <div className="md:col-span-7 space-y-2">
                <div className="bg-neutral-50/90 p-4 rounded-xl border border-neutral-200 space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1.5">
                    Pass Holder &amp; Land Specifics
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Neitu Hming (Owner):
                    </span>
                    <span className="col-span-2 font-black text-neutral-950 text-sm sm:text-base">
                      {pass.ownerName}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Nu/Pa Hming (Parent):
                    </span>
                    <span className="col-span-2 font-bold text-neutral-900 text-xs sm:text-sm">
                      {pass.parentName || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Contact Number:
                    </span>
                    <span className="col-span-2 font-mono font-bold text-neutral-900 text-xs sm:text-sm">
                      {pass.contactNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Pass Type:
                    </span>
                    <span className="col-span-2 font-bold text-emerald-950 uppercase text-xs sm:text-sm">
                      {pass.passType === 'huan_ram' ? 'Huan Ram (Garden/Agriculture)' : 'In Hmun (Residential Site)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Location / Locality:
                    </span>
                    <span className="col-span-2 font-semibold text-neutral-900 text-xs sm:text-sm">
                      {pass.locationAddress || `${village.villageName || 'Mizoram'} Area`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Area Extent:
                    </span>
                    <span className="col-span-2 font-black text-neutral-950 text-xs sm:text-sm">
                      {pass.areaSize || 'As specified in boundaries'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      GPS Coordinates:
                    </span>
                    <span className="col-span-2 font-mono text-xs sm:text-sm text-emerald-900 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 inline shrink-0" />
                      <span>{pass.locationCoordinates}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-t border-neutral-200/80">
                    <span className="text-neutral-600 font-semibold text-xs sm:text-sm">
                      Issue Date:
                    </span>
                    <span className="col-span-2 font-mono font-bold text-neutral-900 text-xs sm:text-sm">
                      {pass.issueDate}
                    </span>
                  </div>
                </div>

                {/* NOC Document verification badge */}
                {pass.nocDocumentUrl && (
                  <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-800" />
                      <div>
                        <span className="font-bold text-amber-950">
                          NOC Certificate Attached:
                        </span>{' '}
                        <span className="text-amber-900 font-medium">
                          {pass.nocDocumentName || 'Council NOC verified'}
                        </span>
                      </div>
                    </div>
                    <span className="bg-amber-200 text-amber-950 font-bold px-2.5 py-0.5 rounded-full text-xs">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column: Boundaries & QR Verification */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-3">
                {/* Boundaries Box */}
                <div className="bg-neutral-50/90 p-4 rounded-xl border border-neutral-200 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                    <span>Ramri / Boundaries</span>
                    <span className="text-xs text-neutral-500 font-medium">Four Cardinal Sides</span>
                  </div>

                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-900">Hmar (North): </span>
                      <span className="text-neutral-800 font-medium">{pass.boundaryNorth}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-900">Chhak (East): </span>
                      <span className="text-neutral-800 font-medium">{pass.boundaryEast}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-900">Thlang (West): </span>
                      <span className="text-neutral-800 font-medium">{pass.boundaryWest}</span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-neutral-200">
                      <span className="font-bold text-neutral-900">Chhim (South): </span>
                      <span className="text-neutral-800 font-medium">{pass.boundarySouth}</span>
                    </div>
                  </div>
                </div>

                {/* QR Verification Seal Box */}
                <div className="bg-white p-3 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs sm:text-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>QR Verification</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-tight">
                      Scan with smartphone camera to verify council authenticity.
                    </p>
                    <span className="text-xs font-mono text-neutral-500 block break-all font-semibold">
                      Ref: {pass.passNumber}
                    </span>
                  </div>
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="Land Pass Verification QR Code"
                      className="w-20 h-20 border border-neutral-300 p-1 rounded-md bg-white shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SIGNATORIES: SECRETARY & PRESIDENT SIGNATURES                  */}
          {/* ============================================================== */}
          <div className="pt-6 border-t-2 border-neutral-900 mt-auto">
            <div className="flex items-end justify-between gap-8">
              {/* Secretary Signatory & Reverse Notice */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-neutral-900">
                    ({pass.secretarySignatory || village.secretaryName || 'Secretary'})
                  </div>
                  <div className="text-xs text-neutral-600 font-medium">
                    Secretary, {village.villageName || 'Village Council'}
                  </div>
                </div>

                <div className="text-xs text-neutral-500 font-sans max-w-xs leading-tight">
                  * Note: Conditions &amp; Restrictions governing this Land Pass are printed on the back page of this document.
                </div>
              </div>

              {/* PRESIDENT SIGNATURE AREA (SPACE RESERVED FOR PHYSICAL SIGNATURE, DESIGNATION REMOVED) */}
              <div className="flex flex-col items-end text-right">
                {/* Reserved space for President physical signature */}
                <div className="h-16 sm:h-20 min-h-[64px] w-52 sm:w-64" aria-hidden="true" />

                <div className="text-sm sm:text-base font-black text-neutral-950">
                  ({presidentName || pass.presidentSignatory || village.presidentName || '________________________'})
                </div>
                <div className="text-xs font-mono text-neutral-500 font-medium mt-1">
                  Date: ________________________
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-4 pt-2 border-t border-neutral-200 text-center text-xs text-neutral-500 font-mono">
              Government of Mizoram &bull; Village Council Land Registry System &bull; Pass Serial: {pass.passNumber} &bull; Page 1 of 2
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAGE 2: BACK PAGE (CONDITIONS & RESTRICTION IN SYSTEM FONT)    */}
        {/* ============================================================== */}
        <div
          id="land-pass-certificate-page-2"
          className="print:break-before-page w-full bg-white text-neutral-900 rounded-xl shadow-2xl p-6 sm:p-10 font-sans relative overflow-hidden print:m-0 print:w-full print:rounded-none print:shadow-none print:p-10 mt-6 min-h-[1050px] flex flex-col justify-between"
          style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            border:
              settings.borderStyle === 'double'
                ? '6px double #171717'
                : settings.borderStyle === 'ornate'
                ? '8px double #064e3b'
                : '3px solid #171717',
          }}
        >
          {/* Subtle Background Watermark */}
          {settings.showWatermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-3 select-none rotate-[-25deg]">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black tracking-widest text-neutral-900 uppercase">
                  CONDITIONS &amp; RULES
                </div>
                <div className="text-xl sm:text-2xl font-bold tracking-widest mt-1 text-neutral-800 uppercase">
                  VILLAGE COUNCIL COURT
                </div>
              </div>
            </div>
          )}

          <div>
            {/* Back Page Header */}
            <div className="text-center pb-4 border-b-2 border-neutral-900 mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-600 block mb-1 font-semibold">
                Land Pass No: {pass.passNumber} &bull; Reverse Side
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-950">
                CONDITIONS &amp; RESTRICTION
              </h2>
              <p className="text-xs sm:text-sm text-neutral-700 font-bold mt-1">
                {village.villageName ? `${village.villageName.toUpperCase()} VILLAGE COUNCIL / COURT` : 'VILLAGE COUNCIL, MIZORAM'}
              </p>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                (Dan leh Hrai - Land Allocation Regulations &amp; Legal Terms)
              </p>
            </div>

            {/* Conditions & Terms Content (Rendered in clean System Font) */}
            <div className="space-y-5 text-xs sm:text-sm text-neutral-800 leading-relaxed px-2 sm:px-4">
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200 shadow-2xs whitespace-pre-line leading-relaxed text-sm">
                {village.conditionsAndTerms || `CONDITIONS & RESTRICTION
1. Huan ram / In hmun hi ramri ziah anga pek a ni a.
2. An ri-te inkar chin a huam ang.
3. Pekni atanga kum thum (3) chhungin a enkawlin kut a thlak ngei tur a ni.
4. Thlai phun lova, pass ringawt a nih chuan cancel theih a ni ang.
5. VC ten tul bik thil ah an cancel thei ang.
6. Vantlang leh sawrkar pawimawh ah a tul angin zangnadawmna pe lo in hman theih a ni ang.`}
              </div>

              {/* Legal Note Box */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-950 space-y-1.5">
                <span className="font-bold block uppercase text-xs tracking-wider text-amber-900">
                  Hriattur Pawimawh (Important Legal Notice):
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-900 font-medium">
                  He Pass hi Mizoram Village Council Act leh dan dinglai zawm a pek a ni a. Ramri buaina emaw thu buai a awm chuan Village Council Court thu tlukna a dingchang ang. Dan bawhchhiatna a awm chuan Council in a cancel thei ang.
                </p>
              </div>
            </div>
          </div>

          {/* Back Page Bottom Seal Box */}
          <div className="pt-6 border-t-2 border-neutral-900 mt-auto">
            <div className="flex items-center justify-between text-xs text-neutral-600 font-medium">
              <span className="font-mono text-xs">
                Pass Reference: {pass.passNumber}
              </span>
              <span className="font-mono text-xs">
                Page 2 of 2 (Back Page)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action floating buttons (Hidden in print) */}
        <div className="mt-4 pb-6 print:hidden flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF (Front &amp; Back Pages)</span>
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(pass)}
              className="px-5 py-2.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white rounded-xl text-sm font-semibold flex items-center gap-2 border border-rose-700 transition"
              title="Delete this Land Pass"
            >
              <Trash2 className="w-4 h-4 text-rose-300" />
              <span>Delete Pass</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
