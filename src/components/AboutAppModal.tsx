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
  Database,
  Lock,
  Cloud
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
                <span>App Chungchang (LPRMS &amp; PTMS)</span>
                <span className="text-[10px] bg-emerald-700 text-white px-2.5 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                  Cloud-Based Secure Data
                </span>
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Land Passes Registry Management System (LPRMS) &bull; Property Tax Management System (PTMS)
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
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-neutral-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-700 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-700/80 rounded-2xl text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-black text-base sm:text-lg text-white">
                  Khawtlang Digital Record &amp; Cloud-Based Secure Data Platform
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                  He application hi khawtlang leh Village Council (V/C) te tan <strong>lehkha bu hlui chhia, bo, leh chhinchhiahna darh sarh</strong> laka fihlima digital hmanga kumhlun record vawnna atana duan a ni. System pui ber pahnih — <strong>1. Land Passes Registry Management System (LPRMS)</strong> leh <strong>2. Property Tax Management System (PTMS)</strong> — te hian <strong>Cloud-Based Secure Data</strong> hmangin mahni Council database hrang vekah record a vawng him tlat a ni.
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
              He application hi Mizoram Sorkar siam emaw tihchhuah a ni lo va (non-government independent application). Village Council leh khawtlang enkawltute tan mahni khaw chhung ram pass leh chhiah record him tak, felfai tak, leh cloud-a kumhlun vawn theih nana siam a ni.
            </p>
          </div>

          {/* ============================================================== */}
          {/* TOPIC 1: LAND PASSES REGISTRY MANAGEMENT SYSTEM (LPRMS)        */}
          {/* ============================================================== */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  1
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-emerald-950">
                    Topic 1: Land Passes Registry Management System (LPRMS)
                  </h3>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Huan Ram &amp; In Hmun Land Pass Siam, GPS Mapping, Document Scan &amp; QR Authentication
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                LPRMS
              </span>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              <strong>LPRMS</strong> hi khaw chhunga <em>Huan Ram (Agricultural/Garden)</em> leh <em>In Hmun (Residential)</em> Land Pass zawng zawng digital registry-a chhinchhiahna, issue-na, update-na, leh finfiahna system kimchang a ni. Village Council term a inthlak pawhin ram neitu dik tak leh ramri chhinchhiahte chu cloud-ah him takin a awm reng a ni.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>Pass Issuance &amp; Auto-Sequential Numbering</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Huan Ram leh In Hmun Pass te Council duh dan angin <strong>Custom Prefix</strong> (e.g. <code>MZ-05-SPH-HR-</code>) leh <strong>Starting Serial Number</strong> set-in computer-in indawt thlapin a pe zel a, pass number in-ang (duplicate) a awm thei lo. Ram neitu hming, Nu/Pa hming, Phone, Area Size (Bigha, Tin hmun, Sq.ft), leh Ramri palite (Hmar, Chhak, Thlang, Chhim) fel takin a record vek.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <span>Google Maps Satellite GPS &amp; NOC Scanner</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Satellite, Terrain, leh Roadmap view hmangin ram awmna tak zawn chhuah a, Drag &amp; Pan bakah <strong>Directional D-Pad Move Tool</strong> (Fine 1m, Normal 10m, Fast 50m) leh phone device GPS sensor hmanga Latitude/Longitude dik tak lak theihna a ni. <strong>Camera Scanner</strong> leh <strong>Upload Scanned File</strong> hmangin NOC lehkha pawh pass-ah a thil tel nghal theih.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-purple-700" />
                  <span>Official A4 Certificate &amp; QR Verification</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Council Logo (170x170 px), Village Name, 2x2 Ramri Grid, President Seal &amp; Signature hmun, leh Council Dan &amp; Hrai (Custom Bylaws - Phek 2) nen standard A4 Certificate mawi takin (Theme 4 thlan theihin) a chhut chhuah theih. Pass tinah <strong>QR Code</strong> awm telin camera-a scan-in pass lem leh tak a thliar hrang nghal zung zung.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 space-y-1.5">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-teal-700" />
                  <span>Cloud-Synced Pass Registry &amp; Safe Controls</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Pass siam thar, edit, emaw delete apiangin <strong>Realtime Loading Feedback</strong> nen Firebase Cloud Database-ah a in-sync nghal zel a. Pass paih dawnah <strong>Warning Confirmation Dialogue Box</strong> leh <strong>Audit Log</strong> chhinchhiahna a awm tlat avangin hriat loh palha data tihchhiat a veng.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TOPIC 2: PROPERTY TAX MANAGEMENT SYSTEM (PTMS)                 */}
          {/* ============================================================== */}
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  2
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-purple-950">
                    Topic 2: Property Tax Management System (PTMS)
                  </h3>
                  <p className="text-[11px] text-purple-800 font-medium">
                    Chhungkaw Family ID Census, Kum Tin Chhiah Assessment, Numeric Lookup &amp; Tax Receipts
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                PTMS
              </span>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed">
              <strong>PTMS</strong> hi khawtlang chhiah (Property Holding Tax, Garbage/Sanitation Cess, leh Civic/Water Cess) felfai taka khawn, chhinchhiah, leh chhungkaw census <strong>Household Family ID</strong> nena thlunzawmna system a ni. Financial Year tinah khaw chhiah lut leh la ba zat chiang takin a chhut chhuak nghal zel a ni.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-purple-700" />
                  <span>Household Family ID &amp; Land Pass Linkage</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Chhungkaw tin tan Council <strong>Family ID</strong> (e.g. <code>SPH-FAM-0001</code>) indawt thlapin a pe a. Chhungkaw Lu, Nu/Pa hming, Phone, Veng/Section, In Number, Ration Card, Economic Status (APL/BPL/AAY), leh member list a vawng ṭha. He chhungkua hian LPRMS-a Land Pass an neih te pawh pass number emaw hminga zawngin a thlunzawm (link) nghal theih.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                  <span>Numeric Family ID Fetch &amp; Auto-Sum Invoice</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Tax Invoice siamnaah Family ID number chauh (prefix tel lo, entirnan <code>0001</code>) chhu luhin <strong>Fetch</strong> hmangin mahni Council chhungkaw detail a rawn la chhuak nghal. <strong>Base Property Tax</strong>, <strong>Garbage/Sanitation Cess</strong>, leh <strong>Civic/Water Cess</strong> belhkhawm zat chiah <em>Amount Collected</em> ah amahin a auto-fill nghal bawk.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-700" />
                  <span>Manage PTMS &amp; Family ID Configuration</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  <strong>Manage Settings</strong> aṭangin Family ID Prefix, Tax Invoice Prefix, Starting Serial Number, Digit Padding (3–6 digits), <strong>Financial Year (FY) Update / Advance Next FY</strong>, Default Due Date, leh Default Tax/Cess Rates te awlsam takin a thlak leh update reng theih a, cloud-ah a in-save nghal zel.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>Official Receipts, Analytics &amp; Sorting</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Registered Families, Total Assessed Tax, Collected Revenue, leh Outstanding Due te live KPI card-ah a lang chiang a. Financial Year filter, Paid/Unpaid filter, leh <strong>Sort By</strong> options hmangin record a thliar hran theih a, tax petute tan <strong>Official Property Tax &amp; Cess Receipt</strong> mawi tak chhut chhuah nghal theih a ni.
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CLOUD BASE SECURE DATA ARCHITECTURE                            */}
          {/* ============================================================== */}
          <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/40 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-teal-200 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-800 text-amber-300 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base sm:text-lg text-teal-950">
                    Cloud-Based Secure Data Architecture (LPRMS &amp; PTMS Himna)
                  </h3>
                  <p className="text-[11px] text-teal-800 font-medium">
                    Multi-Council Database Isolation, Encrypted Offline Cache &amp; Dual Firebase Cloud Sync
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                AES + Firebase Cloud
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-teal-200/80 space-y-1">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-teal-700" />
                  <span>1. Council Tin Tan Database Hrang (Strict Isolation)</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  User leh Village Council tinin mahni <strong>Cloud Database hrang vek</strong> (<code>createdBy</code> &amp; <code>villageId</code> isolation) an nei. Account pakhat Land Pass, Family ID, leh Tax Invoice record te chu Council dang emaw User dang hnenah a lang ve ngai lo va, data a inchawhpawlh thei lo.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-teal-200/80 space-y-1">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-700" />
                  <span>2. Dual Firebase Cloud Sync (Firestore + RTDB)</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Data thar ziah luh, edit, leh setting update zawng zawngte chu <strong>Firebase Cloud Firestore</strong> leh <strong>Firebase Realtime Database</strong>-ah background-in live-in a in-sync nghal zel a. Phone emaw computer tharah login pawhin data bo awm lovin a rawn lang leh vek.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-teal-200/80 space-y-1">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>3. Encrypted Offline-First Local Backup</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Internet signal awm lohna hmunah pawh hna a chawl lo; record tin chu device-ah <strong>AES Encrypted Cache</strong> hmanga vawn ṭhat a ni a, offline mutation queue-in a lo khawl khawm a, internet a awm veleh Cloud-ah amahin a thawn lut nghal thin.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-teal-200/80 space-y-1">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>4. Audit Trail, Warning Guard &amp; Term Continuity</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Secret Key protection, delete dawn apianga Warning Confirmation Box, leh <strong>Audit Trail</strong> chhinchhiahna hmangin himna thuahhnih a siam a. Village Council term inthlak pawhin khawtlang record zawng zawng kumhlunin Cloud-ah a him reng a ni.
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
              <p className="text-[11px] text-neutral-400">
                LPRMS &amp; PTMS &bull; Live Background Firebase Cloud Sync &bull; Encrypted Offline Support
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
