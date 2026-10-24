import React from 'react';
import { PrintSettings, PrintTheme, FontStyle } from '../types';
import {
  X,
  Sliders,
  Palette,
  Type,
  Frame,
  Check,
  Printer,
  Sparkles,
  Server
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrintSettings;
  onSaveSettings: (settings: PrintSettings) => void;
  onTransferToRTDB?: () => Promise<void>;
  onOpenPhpStorage?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTransferToRTDB,
  onOpenPhpStorage,
}) => {
  const [localSettings, setLocalSettings] = React.useState<PrintSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const THEMES: { id: PrintTheme; title: string; subtitle: string; previewBg: string; borderCol: string }[] = [
    {
      id: 'classic_heritage',
      title: 'Classic Heritage',
      subtitle: 'Traditional emerald accents, double border & gold seals',
      previewBg: 'bg-emerald-950 text-white',
      borderCol: 'border-emerald-700',
    },
    {
      id: 'royal_official',
      title: 'Royal Official',
      subtitle: 'Executive navy blue palette, crisp court crest styling',
      previewBg: 'bg-blue-950 text-white',
      borderCol: 'border-blue-700',
    },
    {
      id: 'modern_government',
      title: 'Modern Government',
      subtitle: 'Charcoal & slate high-contrast minimalism',
      previewBg: 'bg-neutral-900 text-white',
      borderCol: 'border-neutral-700',
    },
    {
      id: 'parchment_ivory',
      title: 'Parchment Ivory',
      subtitle: 'Warm archival ivory background with bronze accents',
      previewBg: 'bg-amber-100 text-amber-950',
      borderCol: 'border-amber-700',
    },
  ];

  const FONTS: { id: FontStyle; title: string; subtitle: string; fontClass: string }[] = [
    {
      id: 'serif',
      title: 'Traditional Serif',
      subtitle: 'Prestigious classical serif for legal court records',
      fontClass: 'font-serif',
    },
    {
      id: 'sans',
      title: 'Clean Modern Sans',
      subtitle: 'Sharp modern government clarity',
      fontClass: 'font-sans',
    },
    {
      id: 'slab',
      title: 'Formal Slab',
      subtitle: 'Distinguished slab serif for executive certificates',
      fontClass: 'font-serif tracking-wide',
    },
  ];

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <Sliders className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Certificate &amp; Print Customization</h3>
              <p className="text-xs text-emerald-300">
                Customize Themes, Font Styles, and Layout for A4 Print &amp; PDF Archival
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

        {/* Settings Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* 1. Theme Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-emerald-700" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                1. Select Certificate Theme for Print/Save View
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, theme: th.id })}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                    localSettings.theme === th.id
                      ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${th.previewBg} ${th.borderCol} border flex items-center justify-center shrink-0`}>
                    <Printer className="w-4 h-4 opacity-80" />
                  </div>
                  <div>
                    <span className="font-bold text-neutral-900 block flex items-center gap-1.5">
                      {th.title}
                      {localSettings.theme === th.id && (
                        <Check className="w-3.5 h-3.5 text-emerald-700 inline" />
                      )}
                    </span>
                    <span className="text-xs text-neutral-600 mt-0.5 block leading-tight">
                      {th.subtitle}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Font Style */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-emerald-700" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                2. Certificate Font Style
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FONTS.map((fn) => (
                <button
                  key={fn.id}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, fontStyle: fn.id })}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    localSettings.fontStyle === fn.id
                      ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/20 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <span className={`text-base font-bold text-neutral-900 block ${fn.fontClass}`}>
                    {fn.title}
                  </span>
                  <span className="text-[11px] text-neutral-600 mt-1 block leading-tight">
                    {fn.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Certificate Borders & Watermark */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
            <div className="flex items-center gap-2">
              <Frame className="w-4 h-4 text-emerald-700" />
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                3. Certificate Framing &amp; Watermark
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Outer Border Style
                </label>
                <select
                  value={localSettings.borderStyle}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, borderStyle: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="double">Double Rule Classic Border (8px)</option>
                  <option value="ornate">Ornate Flourish Double Border</option>
                  <option value="solid">Single Heavy Border (4px)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Document Watermark
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, showWatermark: !localSettings.showWatermark })
                  }
                  className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition ${
                    localSettings.showWatermark
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-white text-neutral-600 border-neutral-300'
                  }`}
                >
                  <span>Village Council Watermark</span>
                  <span>{localSettings.showWatermark ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Firebase Realtime Database Sync & Storage */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>4. Firebase Realtime Database</span>
              </label>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full font-mono">
                RTDB Synced
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              All Land Pass records, Village configurations, Users, and Audit logs are securely mirrored to Firebase Realtime Database for instant multi-device live sync.
            </p>
            {onTransferToRTDB && (
              <button
                type="button"
                onClick={onTransferToRTDB}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Transfer / Store All Data to Firebase Realtime Database Now</span>
              </button>
            )}
          </div>

          {/* 5. PHP & MySQL Storage Backend */}
          <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-700" />
                <span>5. PHP &amp; MySQL Storage Backend</span>
              </label>
              <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full font-mono">
                cPanel / XAMPP
              </span>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed">
              Store Land Passes, Village bylaws, Users, and Audit logs on your own PHP &amp; MySQL web server or export full SQL database dumps.
            </p>
            {onOpenPhpStorage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhpStorage();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-indigo-900 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <Server className="w-3.5 h-3.5" />
                <span>Manage PHP &amp; MySQL Storage / Download PHP Package</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            Themes immediately apply to all A4 printed land passes and PDF exports.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg text-sm transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
