import React, { useState } from 'react';
import { LandPass } from '../types';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Printer,
  Calendar,
  MapPin,
  User,
  QrCode
} from 'lucide-react';
import { logActivity } from '../services/auditLogger';

interface VerifyPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPass?: LandPass | null;
  allPasses: LandPass[];
  onOpenPrint: (pass: LandPass) => void;
}

export const VerifyPassModal: React.FC<VerifyPassModalProps> = ({
  isOpen,
  onClose,
  initialPass,
  allPasses,
  onOpenPrint,
}) => {
  const [queryInput, setQueryInput] = useState<string>(
    initialPass?.passNumber || ''
  );
  const [searched, setSearched] = useState<boolean>(!!initialPass);

  if (!isOpen) return null;

  const currentPass =
    allPasses.find(
      (p) =>
        p.passNumber.toLowerCase() === queryInput.trim().toLowerCase() ||
        p.id.toLowerCase() === queryInput.trim().toLowerCase()
    ) || (initialPass && initialPass.passNumber.toLowerCase() === queryInput.trim().toLowerCase() ? initialPass : null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (currentPass) {
      logActivity(
        'QR_VERIFIED',
        currentPass.id,
        currentPass.passNumber,
        'Public/Officer',
        `Pass ${currentPass.passNumber} verified via Land Registry verification portal`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-800 rounded-lg">
              <QrCode className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Council QR Verification</h3>
              <p className="text-xs text-emerald-200">
                Saiphai Village Council / Court Land Authenticity Check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Form */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Enter Pass Number (e.g. SPH/VC/HR/1001)"
                value={queryInput}
                onChange={(e) => {
                  setQueryInput(e.target.value);
                  setSearched(false);
                }}
                className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl transition shadow-xs"
            >
              Verify
            </button>
          </form>

          {/* Quick Demo Pickers */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-neutral-500">
            <span>Try sample pass:</span>
            {allPasses.slice(0, 3).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setQueryInput(p.passNumber);
                  setSearched(true);
                }}
                className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-mono font-medium"
              >
                {p.passNumber}
              </button>
            ))}
          </div>

          {/* Verification Result */}
          {searched && (
            <div>
              {currentPass ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 block">
                          Verified Authentic Record
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Office of the Village Council / Court, Saiphai
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-800 text-white font-mono text-xs font-bold rounded-lg">
                      {currentPass.passNumber}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-800">
                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">Pass Type:</span>
                      <span className="col-span-2 font-bold capitalize">
                        {currentPass.passType === 'huan_ram'
                          ? 'Huan Ram Pass (Agricultural)'
                          : 'In Hmun Pass (Residential)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">Owner Name:</span>
                      <span className="col-span-2 font-bold text-neutral-900 text-sm font-serif">
                        {currentPass.ownerName}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">Father/Mother:</span>
                      <span className="col-span-2 font-medium">{currentPass.parentName}</span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">GPS Coordinates:</span>
                      <span className="col-span-2 font-mono text-emerald-800 font-bold">
                        {currentPass.locationCoordinates}
                      </span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">Issue Date:</span>
                      <span className="col-span-2 font-mono">{currentPass.issueDate}</span>
                    </div>

                    <div className="grid grid-cols-3">
                      <span className="text-neutral-500">Signatory:</span>
                      <span className="col-span-2 font-semibold">
                        President LALTHANSANGA
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPrint(currentPass);
                      }}
                      className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View Official A4 Certificate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                  <h4 className="font-bold text-rose-900 text-sm">Pass Record Not Found</h4>
                  <p className="text-xs text-rose-700">
                    No matching land pass with number "{queryInput}" was found in the Saiphai Village Council registry. Please check the serial format.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
