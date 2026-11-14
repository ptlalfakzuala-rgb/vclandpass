import React from 'react';
import { Landmark, RefreshCw, ShieldCheck } from 'lucide-react';

interface LoadingOverlayProps {
  message: string | null;
  subMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  subMessage = 'Synchronizing with Village Council Realtime Database & Cloud Storage...'
}) => {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-backdrop-fade">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 text-center flex flex-col items-center animate-modal-pop">
        {/* Animated Badge & Spinner */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-3 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-full text-amber-300 shadow-md">
              <Landmark className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Title */}
        <h4 className="text-base sm:text-lg font-bold text-neutral-900 mb-1.5 flex items-center justify-center gap-2">
          <span>{message}</span>
        </h4>

        {/* Explanatory subtitle */}
        <p className="text-xs text-neutral-500 max-w-xs mb-4">
          {subMessage}
        </p>

        {/* Status Pills */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-medium font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Realtime Encrypted Database Active</span>
        </div>
      </div>
    </div>
  );
};
