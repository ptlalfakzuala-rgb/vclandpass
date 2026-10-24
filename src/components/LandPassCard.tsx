import React from 'react';
import { LandPass } from '../types';
import {
  Printer,
  Edit2,
  Trash2,
  MapPin,
  QrCode,
  FileCheck,
  Calendar,
  Phone,
  User,
  ShieldCheck,
  CloudCheck,
  CloudOff
} from 'lucide-react';

interface LandPassCardProps {
  pass: LandPass;
  isAdmin: boolean;
  onPrint: (pass: LandPass) => void;
  onEdit: (pass: LandPass) => void;
  onDelete: (pass: LandPass) => void;
  onVerify: (pass: LandPass) => void;
}

export const LandPassCard: React.FC<LandPassCardProps> = ({
  pass,
  isAdmin,
  onPrint,
  onEdit,
  onDelete,
  onVerify,
}) => {
  const isHuanRam = pass.passType === 'huan_ram';

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs hover:shadow-md transition duration-200 overflow-hidden flex flex-col justify-between group">
      {/* Top Banner */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between border-b ${
          isHuanRam
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950'
            : 'bg-blue-50/70 border-blue-100 text-blue-950'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-md font-bold tracking-wider font-mono ${
              isHuanRam
                ? 'bg-emerald-800 text-white'
                : 'bg-blue-800 text-white'
            }`}
          >
            {pass.passNumber}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide">
            {isHuanRam ? 'Huan Ram Pass' : 'In Hmun Pass'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {pass.syncedToCloud === false ? (
            <span
              className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full"
              title="Saved in encrypted local cache, pending cloud sync"
            >
              <CloudOff className="w-3 h-3" />
              Local Encrypted
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full"
              title="Synced with Village Council Database"
            >
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-5 space-y-3.5 flex-1">
        {/* Owner Details */}
        <div>
          <h3 className="font-serif font-bold text-lg text-neutral-900 group-hover:text-emerald-900 transition flex items-center gap-1.5">
            <User className="w-4 h-4 text-neutral-400" />
            {pass.ownerName}
          </h3>
          <p className="text-xs text-neutral-600 mt-0.5">
            S/o, D/o: <span className="font-medium text-neutral-800">{pass.parentName}</span>
          </p>
        </div>

        {/* Contact & Location Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 border-t border-b border-neutral-100 py-2.5">
          <div className="flex items-center gap-1.5 truncate">
            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="font-mono text-neutral-700 truncate">{pass.contactNumber}</span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>Issued: {pass.issueDate}</span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {pass.locationAddress || 'Saiphai Area'} •{' '}
              <span className="font-mono text-[11px] text-neutral-500">
                {pass.locationCoordinates}
              </span>
            </span>
          </div>
        </div>

        {/* Boundaries Quick View */}
        <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs space-y-1">
          <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
            Boundaries (Ramri):
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div className="truncate">
              <span className="font-semibold text-neutral-800">H:</span> {pass.boundaryNorth}
            </div>
            <div className="truncate">
              <span className="font-semibold text-neutral-800">Chh:</span> {pass.boundaryEast}
            </div>
            <div className="truncate">
              <span className="font-semibold text-neutral-800">Th:</span> {pass.boundaryWest}
            </div>
            <div className="truncate">
              <span className="font-semibold text-neutral-800">Chh:</span> {pass.boundarySouth}
            </div>
          </div>
        </div>

        {/* NOC and Area badge */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="font-semibold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded-md text-[11px]">
            {pass.areaSize || 'Full Boundary Area'}
          </span>

          {pass.nocDocumentUrl ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <FileCheck className="w-3.5 h-3.5" />
              NOC Attached
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400 italic">No NOC Attached</span>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-5 py-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onPrint(pass)}
          className="flex-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
          title="Open printable A4 format and save as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / PDF (A4)</span>
        </button>

        <button
          onClick={() => onVerify(pass)}
          className="p-2 text-neutral-600 hover:text-emerald-800 hover:bg-neutral-200/60 rounded-xl transition"
          title="Verify QR & Authenticity"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          onClick={() => onEdit(pass)}
          className="p-2 text-neutral-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
          title="Edit Land Pass Details"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDelete(pass)}
          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
          title="Delete Land Pass (Opens confirmation warning)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
