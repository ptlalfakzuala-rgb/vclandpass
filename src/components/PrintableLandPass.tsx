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
  const [printScope, setPrintScope] = useState<'both' | 'page1'>('both');

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
    <div className="printable-land-pass-modal fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Hidden file input for emblem logo */}
      <input
        ref={emblemInputRef}
        type="file"
        accept="image/*"
        onChange={handleEmblemUpload}
        className="hidden"
      />

      <div className="printable-land-pass-wrapper w-full max-w-4xl flex flex-col items-center">
        {/* ============================================================== */}
        {/* TOP CONTROL BAR (HIDDEN IN PRINT)                             */}
        {/* ============================================================== */}
        <div className="w-full bg-neutral-900 border border-neutral-700 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-xl print:hidden text-white">
          <div className="flex items-center gap-3 w-full lg:w-auto">
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
                Official A4 Print &amp; PDF Archival View &bull; Default Clean Modern Sans
              </p>
            </div>
          </div>

          {/* Quick Input for President Name, Scope & Print Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end w-full lg:w-auto">
            {/* Print Scope Selector: Both Pages vs Page 1 Only */}
            <div className="flex items-center bg-neutral-800 p-0.5 rounded-xl border border-neutral-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrintScope('both')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  printScope === 'both'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title="Print both Front Certificate and Back Conditions pages on A4"
              >
                Both Pages
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('page1')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  printScope === 'page1'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-neutral-300 hover:text-white'
                }`}
                title="Print Page 1 Certificate Only on standard A4"
              >
                Page 1 Only
              </button>
            </div>

            {/* Input President name for signature */}
            <div className="flex items-center gap-1.5 bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-neutral-700">
              <span className="text-xs text-neutral-400 font-semibold whitespace-nowrap">
                President:
              </span>
              <input
                type="text"
                placeholder="Enter President Name"
                value={presidentName}
                onChange={(e) => handlePresidentNameChange(e.target.value)}
                className="bg-neutral-900 border border-neutral-600 rounded-lg px-2 py-0.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-32 sm:w-40 font-semibold"
                title="Input President Name for signature line"
              />
            </div>

            {/* Change Emblem Logo button */}
            <button
              onClick={() => emblemInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-700"
              title="Upload / Change official Emblem Logo for print/save view"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>{emblemLogoUrl ? 'Emblem' : 'Emblem'}</span>
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
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Print / Save PDF (A4 Portrait - Prints only this certificate)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF (A4)</span>
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(pass)}
                className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-rose-800 shadow-xs"
                title="Delete this Land Pass (Opens warning dialogue box)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Delete</span>
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
          className={`a4-print-sheet print-a4-page w-full ${themeCols.pageBg} text-neutral-900 rounded-xl shadow-2xl p-6 sm:p-9 ${fontClass} relative overflow-hidden print:m-0 print:w-full print:rounded-none print:shadow-none min-h-[1050px] flex flex-col justify-between ${
            printScope === 'page1' ? 'last-sheet' : ''
          }`}
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
            <div className="border-b-2 border-neutral-900 pb-3 mb-4 print:pb-2 print:mb-3">
              <div className="flex items-center justify-between gap-3 sm:gap-4 print:gap-3">
                {/* Council Logo (Left Frame) - Reduced size for clean A4 letterhead proportion */}
                <div className="shrink-0 flex items-center justify-center">
                  {village.logoUrl ? (
                    <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] print:w-[72px] print:h-[72px] rounded-xl border border-neutral-300 p-1 bg-white shadow-2xs flex items-center justify-center overflow-hidden">
                      <img
                        src={village.logoUrl}
                        alt={`${village.villageName || 'Council'} Logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] print:w-[72px] print:h-[72px] rounded-xl border-2 border-double border-neutral-800 p-1.5 bg-amber-50/70 flex flex-col items-center justify-center text-center shadow-2xs">
                      <div className="w-7 h-7 rounded-full border border-neutral-800 flex items-center justify-center mb-0.5 bg-white font-bold text-[10px]">
                        VC
                      </div>
                      <span className="text-[9px] font-black tracking-widest uppercase text-neutral-900 leading-none">
                        COURT
                      </span>
                      <span className="text-[8px] text-neutral-600 leading-none mt-0.5">
                        MIZORAM
                      </span>
                    </div>
                  )}
                </div>

                {/* Main Heading Text - Fits in a single line on standard A4 print/save */}
                <div className="text-center flex-1 min-w-0 px-2 space-y-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-wide sm:tracking-wider text-neutral-950 uppercase leading-tight whitespace-nowrap overflow-hidden text-ellipsis print:text-[20px] print:tracking-normal print:leading-snug print:whitespace-nowrap">
                    OFFICE OF THE VILLAGE COUNCIL
                  </h1>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 uppercase whitespace-nowrap overflow-hidden text-ellipsis print:text-base print:leading-tight">
                    {village.villageName ? `${village.villageName.toUpperCase()} : MIZORAM` : 'VILLAGE COUNCIL, MIZORAM'}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis print:text-xs">
                    {village.districtName ? `${village.districtName}` : 'Mizoram'} {village.blockName ? `• ${village.blockName}` : ''} {village.pinCode ? `• PIN: ${village.pinCode}` : ''}
                  </p>
                </div>

                {/* State / Official Emblem Logo Frame (Right Frame - Reduced size for clean A4 proportion) */}
                <div
                  className="shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-[88px] sm:h-[88px] print:w-[72px] print:h-[72px] border border-neutral-300 rounded-xl p-1 bg-white text-center shadow-2xs relative group cursor-pointer"
                  onClick={() => emblemInputRef.current?.click()}
                  title="Click to Change Emblem Logo"
                >
                  <img
                    src={emblemLogoUrl || DEFAULT_LAD_EMBLEM_URL}
                    alt="Local Administration Department Official Emblem"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition print:hidden">
                    Change
                  </div>

                  {/* Hover prompt in preview mode (hidden in print) */}
                  <div className="absolute inset-0 bg-neutral-900/60 text-white rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition print:hidden">
                    <Camera className="w-3.5 h-3.5 mb-0.5" />
                    <span className="text-[9px] font-bold">Change</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Header: Certificate Title, Issue Date & Sequential Pass Number Badge with QR Code underneath */}
            <div className="bg-neutral-100/90 border border-neutral-300 rounded-xl p-3 sm:p-3.5 mb-3.5 print:p-2.5 print:mb-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left space-y-1.5 flex-1">
                <div>
                  <span className="text-[11px] font-mono uppercase text-neutral-600 tracking-wider block font-semibold">
                    Document Title &bull; Land Pass Record
                  </span>
                  <span className="text-base sm:text-lg print:text-base font-black text-neutral-950 uppercase tracking-wide block">
                    {pass.passType === 'huan_ram'
                      ? 'HUAN RAM NEIHNA LEHKHA (GARDEN/AGRI LAND PASS)'
                      : 'IN HMUN NEIHNA LEHKHA (RESIDENTIAL/HOUSE SITE PASS)'}
                  </span>
                </div>

                {/* Prominent Issue Date Display */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <span className="bg-emerald-900 text-white font-mono text-[11px] print:text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                    Issue Date: {pass.issueDate}
                  </span>
                  <span className="text-xs print:text-[11px] text-neutral-600 font-semibold">
                    (Pek Chhuah Ni)
                  </span>
                </div>
              </div>

              {/* Pass Number Block with QR Code Placed Directly Underneath */}
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right shrink-0">
                <span className="text-[10px] sm:text-[11px] font-mono text-neutral-600 font-bold uppercase tracking-wider block">
                  Sequential Pass No.
                </span>
                <span className="text-sm sm:text-base font-mono font-black text-emerald-950 bg-white border-2 border-neutral-800 px-3 py-0.5 rounded-lg inline-block shadow-2xs">
                  {pass.passNumber}
                </span>

                {/* QR Code placed directly UNDER land pass number */}
                {qrDataUrl && (
                  <div className="mt-1 flex flex-col items-center sm:items-end">
                    <div className="bg-white p-1 rounded-lg border border-neutral-300 shadow-2xs">
                      <img
                        src={qrDataUrl}
                        alt="Land Pass Verification QR Code"
                        className="w-[72px] h-[72px] print:w-[64px] print:h-[64px] object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-mono text-neutral-500 font-semibold mt-0.5">
                      Scan to verify authenticity
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pass Holder & Land Specifics Details */}
            <div className="bg-neutral-50/90 p-3.5 sm:p-4 print:p-2.5 rounded-xl border border-neutral-200 mb-3 print:mb-2 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1 flex items-center justify-between">
                <span>Pass Holder &amp; Land Specifics</span>
                <span className="text-[11px] font-mono text-neutral-600 font-bold">
                  Issue Date: {pass.issueDate}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-sm print:text-xs">
                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Neitu Hming (Owner):</span>
                  <span className="font-black text-neutral-950 text-sm sm:text-base print:text-sm">
                    {pass.ownerName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Nu/Pa Hming (Parent):</span>
                  <span className="font-bold text-neutral-900">{pass.parentName || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Contact Number:</span>
                  <span className="font-mono font-bold text-neutral-900">{pass.contactNumber || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Pass Type:</span>
                  <span className="font-bold text-emerald-950 uppercase">
                    {pass.passType === 'huan_ram' ? 'Huan Ram (Garden/Agriculture)' : 'In Hmun (Residential Site)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Location / Locality:</span>
                  <span className="font-semibold text-neutral-900">{pass.locationAddress || `${village.villageName || 'Mizoram'} Area`}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Area Extent:</span>
                  <span className="font-black text-neutral-950">{pass.areaSize || 'As specified in boundaries'}</span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">GPS Coordinates:</span>
                  <span className="font-mono text-emerald-900 font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 inline shrink-0" />
                    <span>{pass.locationCoordinates}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-0.5 border-b border-neutral-200/60">
                  <span className="text-neutral-600 font-semibold">Pek Chhuah Ni (Issue Date):</span>
                  <span className="font-mono font-bold text-neutral-950 bg-neutral-200/70 px-2 py-0.5 rounded text-xs">
                    {pass.issueDate}
                  </span>
                </div>
              </div>

              {/* NOC Document verification badge if present */}
              {pass.nocDocumentUrl && (
                <div className="bg-amber-50/80 p-2 rounded-lg border border-amber-200 flex items-center justify-between text-xs mt-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-800" />
                    <div>
                      <span className="font-bold text-amber-950">NOC Certificate Attached:</span>{' '}
                      <span className="text-amber-900 font-medium">{pass.nocDocumentName || 'Council NOC verified'}</span>
                    </div>
                  </div>
                  <span className="bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Verified
                  </span>
                </div>
              )}
            </div>

            {/* Ramri / Boundaries in Grid List (Four Cardinal Sides) */}
            <div className="bg-neutral-50/90 rounded-xl border border-neutral-200 p-3 sm:p-3.5 print:p-2.5 mb-3 print:mb-2 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-800 border-b border-neutral-200 pb-1 flex items-center justify-between">
                <span>Ramri / Boundaries</span>
                <span className="text-[11px] font-mono text-neutral-500 font-semibold">Grid List</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm print:text-xs">
                {/* Hmar (North) */}
                <div className="p-2 print:p-1.5 bg-white rounded-lg border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    Hmar (North)
                  </span>
                  <span className="font-bold text-neutral-950 mt-0.5 text-xs sm:text-sm print:text-xs break-words">
                    {pass.boundaryNorth || 'N/A'}
                  </span>
                </div>

                {/* Chhak (East) */}
                <div className="p-2 print:p-1.5 bg-white rounded-lg border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    Chhak (East)
                  </span>
                  <span className="font-bold text-neutral-950 mt-0.5 text-xs sm:text-sm print:text-xs break-words">
                    {pass.boundaryEast || 'N/A'}
                  </span>
                </div>

                {/* Thlang (West) */}
                <div className="p-2 print:p-1.5 bg-white rounded-lg border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    Thlang (West)
                  </span>
                  <span className="font-bold text-neutral-950 mt-0.5 text-xs sm:text-sm print:text-xs break-words">
                    {pass.boundaryWest || 'N/A'}
                  </span>
                </div>

                {/* Chhim (South) */}
                <div className="p-2 print:p-1.5 bg-white rounded-lg border border-neutral-200 flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    Chhim (South)
                  </span>
                  <span className="font-bold text-neutral-950 mt-0.5 text-xs sm:text-sm print:text-xs break-words">
                    {pass.boundarySouth || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SIGNATURE & SEAL SECTION: PRESIDENT SIGNATURE & OFFICIAL SEAL   */}
          {/* (Secretary name and designation text President removed per request) */}
          {/* ============================================================== */}
          <div className="pt-4 print:pt-3 border-t-2 border-neutral-900 mt-auto">
            <div className="flex items-end justify-between gap-6">
              {/* Left Side: Dedicated Official Seal Circle & Legal Reverse Notice */}
              <div className="flex items-center gap-4">
                {/* Official Seal Circle (text SEAL/CHHAP removed per request) */}
                <div className="w-24 h-24 sm:w-26 sm:h-26 print:w-20 print:h-20 rounded-full border-2 border-dashed border-neutral-400 bg-neutral-50/70 flex flex-col items-center justify-center text-center p-2 shrink-0">
                  <span className="text-[9px] print:text-[7.5px] text-neutral-600 font-bold leading-tight uppercase">
                    {village.villageName || 'Village Council'}
                  </span>
                  <span className="text-[7.5px] print:text-[6.5px] text-neutral-500 font-mono mt-0.5 uppercase">
                    Court &bull; Mizoram
                  </span>
                </div>

                <div className="space-y-1 max-w-[220px] sm:max-w-xs">
                  <div className="text-[11px] font-bold text-neutral-800">
                    Village Council Official Seal/Stamp
                  </div>
                  <div className="text-[10px] print:text-[9px] text-neutral-500 leading-tight font-sans">
                    * Note: Conditions &amp; Restrictions governing this Land Pass are printed on the back page of this document.
                  </div>
                </div>
              </div>

              {/* Right Side: Physical Signature above Name, and Reserved Space for Seal under Name */}
              <div className="flex flex-col items-end text-right">
                {/* Signature space above President name */}
                <div className="h-9 sm:h-11 print:h-9 min-h-[36px] w-52 sm:w-64" aria-hidden="true" />

                {/* President Name */}
                <div className="text-sm sm:text-base print:text-sm font-black text-neutral-950">
                  ({presidentName || pass.presidentSignatory || village.presidentName || '________________________'})
                </div>

                {/* Reserved Space UNDER President Name for Seal */}
                <div className="h-14 sm:h-16 print:h-14 min-h-[56px] w-52 sm:w-64 flex items-center justify-end" aria-hidden="true">
                  {/* Clean open space reserved for physical President seal */}
                </div>

                <div className="text-xs font-mono text-neutral-600 font-semibold mt-0.5">
                  Issue Date: {pass.issueDate}
                </div>
              </div>
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-3 pt-1.5 border-t border-neutral-200 text-center text-[10px] sm:text-xs text-neutral-500 font-mono">
              Village Council Land Registry System &bull; Pass Serial: {pass.passNumber} &bull; Page 1 of 2
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PAGE 2: BACK PAGE (CONDITIONS & RESTRICTION IN SYSTEM FONT)    */}
        {/* ============================================================== */}
        <div
          id="land-pass-certificate-page-2"
          className={`a4-print-sheet last-sheet print:break-before-page w-full bg-white text-neutral-900 rounded-xl shadow-2xl p-6 sm:p-10 font-sans relative overflow-hidden print:m-0 print:w-full print:rounded-none print:shadow-none mt-6 min-h-[1050px] flex flex-col justify-between ${
            printScope === 'page1' ? 'print:hidden' : ''
          }`}
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
            <span>
              Print / Save PDF (A4) - {printScope === 'both' ? 'Both Pages' : 'Page 1 Only'}
            </span>
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
