import React from 'react';
import {
  X,
  FileText,
  MapPin,
  QrCode,
  ShieldCheck,
  Building2,
  Users2,
  Wifi,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Receipt,
  Settings,
  Database
} from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-modal-pop">
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200 text-neutral-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-800 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl flex items-center gap-2 text-neutral-900 flex-wrap">
                <span>Mizoram Village Council App Chungchang</span>
                <span className="text-[10px] bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                  2 Core Systems
                </span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Land Passes Registry Management &bull; Property Tax Management &amp; Family ID System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-all duration-200 hover:rotate-90 cursor-pointer"
            title="Kharna (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-neutral-800 text-sm leading-relaxed">
          {/* Overview Banner */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-700 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-700/80 rounded-2xl text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-base sm:text-lg text-white">
                  Khawtlang Digital Inrelbawlna Pui Ber (2 Topics)
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                  He application hi Mizoram Village Council (V/C) leh khawtlang roreltute tana felfai, rintlak leh him taka digital hmanga record vawnna tura duan a ni a. Thupui lian pahnih — <strong>1. Land Passes Registry Management</strong> leh <strong>2. Property Tax Management &amp; Family ID System</strong> — te chhungah a innghat a ni. User leh Village Council tin tan mahni database hrang zel (isolated) a awm a, background-ah Firebase Cloud-in a in-sync reng bawk.
                </p>
              </div>
            </div>
          </div>

          {/* Non-Government Disclaimer */}
          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-400/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>HRIATTIRNA PAWIMAWH : Sorkar Thuchhuah / Sorkar App A Ni Lo</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              He application hi Mizoram Sorkar siam emaw tihchhuah a ni lo va (non-government independent application). Khawtlang leh Village Council ten mahni khaw chhung ram pass leh chhiah record him tak leh felfai taka an enkawl nan siam a ni.
            </p>
          </div>

          {/* ============================================================== */}
          {/* TOPIC 1: LAND PASSES REGISTRY MANAGEMENT                       */}
          {/* ============================================================== */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  1
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-emerald-950">
                    Topic 1: Land Passes Registry Management
                  </h3>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Huan Ram &amp; In Hmun Land Pass Digital Enkawlna, GPS Mapping &amp; Certificate Printing
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Land Registry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Huan Ram &amp; In Hmun Pass Issuance</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Huan Ram (Agricultural) leh In Hmun (Residential) Land Pass te mahni Council prefix leh starting number duhthusam hmanga auto-sequential-a siam zung zung theih a ni. Ram neitu hming, Nu/Pa hming, Phone, Zauhzawng, leh Ramri palite (Hmar, Chhak, Thlang, Chhim) fel takin a chhinchhiah.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <span>Google Maps GPS &amp; NOC Scanner</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Satellite/Terrain Map leh D-Pad Move Tool hmangin ram awmna GPS coordinates (Latitude, Longitude) dik tak a lak theih a. NOC lehkha pawh Camera Scanner leh Upload Scanned File hmangin pass rualin a thil tel nghal theih bawk.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-700" />
                  <span>A4 Certificate Print &amp; QR Verification</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Council Logo, President Seal space, Custom Bylaws/Conditions, leh QR Code nen A4 size Certificate mawi takin (Theme 4 thlan theihin) a print/save theih. Phone camera hmangin QR Code scan-in pass dik leh dik loh a finfiah nghal theih bawk.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-700" />
                  <span>Isolated Council DB &amp; Live Sync</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  User leh Village Council tinin mahni database hrang vek an nei a, khaw dang emaw account dang data nen a inchawhpawlh lo. Internet awm lohnaah pawh offline cache-in a vawng a, online veleh Firebase Realtime Database &amp; Firestore-ah a in-sync nghal zel.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TOPIC 2: PROPERTY TAX MANAGEMENT & FAMILY ID SYSTEM            */}
          {/* ============================================================== */}
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  2
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-purple-950">
                    Topic 2: Property Tax Management &amp; Family ID System
                  </h3>
                  <p className="text-[11px] text-purple-800 font-medium">
                    Chhungkaw Family ID Registry, Kum Tin Chhiah Khawnna (PTMS), Prefix &amp; Financial Year Enkawlna
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                PTMS &amp; Family ID
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-purple-700" />
                  <span>Household Family ID &amp; Census</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Khaw chhungkaw tin tan Council Family ID (e.g. <code>SPH-FAM-0001</code>) indawt thlapin a siam theih a. Chhungkaw Lu, member zat, Veng/Section, In number, Economic Status (APL/BPL/AAY) te chhinchhiahin he chhungkua hian Land Pass an neih te a thlunzawm (search &amp; link) nghal theih bawk.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span>Numeric Family ID Lookup &amp; Auto-Fill Tax</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Tax Invoice siamnaah Family ID number chauh (prefix tel lo, e.g. <code>0001</code>) chhu luhin mahni Council chhungkaw chanchin a rawn fetch nghal a. Base Property Tax, Garbage/Sanitation Cess, leh Civic/Water Cess te belhkhawmin Amount Collected amahin a auto-fill nghal zel.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-700" />
                  <span>Manage Settings (Prefix, Starting No. &amp; FY)</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  <strong>Manage Settings</strong> hmangin Family ID Prefix, Tax Invoice Prefix, Starting Serial Number, Digit Padding, Financial Year (FY) update, Payment Due Date, leh Default Tax/Cess Rates te mahni Council milin awlsam takin a thlak leh update reng theih.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Tax Receipts, Sorting &amp; Safe Deletion</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Tax Invoice tin tan Official Property Tax &amp; Cess Receipt chhut chhuah theih a ni a. Financial Year, Paid/Unpaid filter, leh Sort By options chi hrang hrang bakah record delete dawnah Warning Dialogue Box leh Firebase Cloud auto-sync a awm thlap.
                </p>
              </div>
            </div>
          </div>

          {/* Account & Technical Support Footer Card */}
          <div className="bg-gradient-to-r from-emerald-900 to-neutral-900 text-white p-5 rounded-2xl border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Account Registration (₹299 Lifetime) &amp; Technical Support</span>
              </div>
              <p className="text-emerald-100/90">
                Ptlalfakzuala &bull; WhatsApp/Phone: <strong>+91 7005504074</strong> &bull; Email: <strong>ptlalfakzuala@gmail.com</strong>
              </p>
              <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Background Firebase Sync &bull; Encrypted Offline-First Support</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md cursor-pointer shrink-0"
            >
              Hrethiam E (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
