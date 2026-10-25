import React from 'react';
import {
  X,
  FileText,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  Building2,
  Users,
  Wifi,
  History,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 rounded-2xl text-emerald-300 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl flex items-center gap-2">
                <span>App Chungchang (About System)</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2.5 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                  Mizo Tawngin
                </span>
              </h2>
              <p className="text-xs text-emerald-300/90 font-medium">
                Mizoram Village Council Land Pass Registry &bull; Chipchiar Taka Hrilhfiahna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title="Kharna"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-neutral-800 text-sm leading-relaxed">
          {/* Banner Hero */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 sm:p-6 rounded-2xl border border-emerald-800 shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-800/80 rounded-2xl text-amber-300 shrink-0 mt-0.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-serif font-black text-base sm:text-lg text-white">
                  Mizoram Village Council Land Pass System Bulpui
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                  He application hi <strong>Mizoram Village Council (V/C)</strong> te tana bika siam, <strong>Huan Ram leh In Hmun Land Pass</strong> felfai, rintlak leh changkang taka enkawl, chhuah, leh chhinchhiahna (Electronic Land Registry System) a ni. Hmanlai lehkha bu thil hlui, chhia leh boral thei laka fihlimin, khawtlang rorelna leh ram pek chungchang rintlak leh zahawm taka digital hmanga vawn thatna hmanrua a ni.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: A Tum Bulpuite */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>1. A Tum Bulpui (Main Objectives)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  1. Khawtlang Rorelna Tihchangkan
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Village Council-ten ramri leh pass an pekte felfai tak leh rualkhai taka chhinchhiah a, V/C term a inthlak pawha record bo ngai lo tura vawn.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  2. Inbumna &amp; Pass Lem Venna
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Pass tinah QR Code leh Serial Number danglam bik dah a ni a, tu pawhin phone camera hmangin pass dik a nih leh nih loh an finfiah zung zung thei.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  3. Ramri Felfai (GPS &amp; Boundary)
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Ramri palite (Hmar, Chhak, Thlang, Chhim) leh Google Maps GPS Coordinate thlap thlapa chhinchhiahin ram innek buaina a veng.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  4. Kumhlun Atana Vawn That (Cloud Sync)
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Data-te Realtime Cloud Database-ah him takin a in-sync reng a, lehkha bo emaw phone chhiat pawhin a him reng a ni.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Hmanraw Pawimawh Te */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>2. Hmanraw Pawimawh leh Thiltihtheihte (Key Features)</span>
            </h4>

            {/* Feature 1: Pass Chhuahna */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>A. Land Pass Chhuahna (Huan Ram &amp; In Hmun)</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Huan Ram Pass (Agri/Garden):</strong> Thlai chinna leh huan ram pekna lehkha.</li>
                <li><strong>In Hmun Pass (Residential Site):</strong> In hmun leh chenna hmun pekna lehkha.</li>
                <li><strong>Auto-Sequential Pass Number:</strong> Pass number (e.g. <code>VC/HR/1001</code>) hi computer-in indawt thlapin amahin a chhiar zel a, tihsual palh a awm thei lo.</li>
                <li><strong>Neitu Chanchin &amp; NOC Thiltel:</strong> Neitu hming, Nu/Pa hming, Phone number, Ram zauhzawng, leh Council NOC/Document upload thiltel theih a ni.</li>
              </ul>
            </div>

            {/* Feature 2: Google Maps GPS & Move Tool */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                <MapPin className="w-4 h-4 text-blue-800" />
                <span>B. Google Maps GPS Coordinate &amp; Move Tool</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Google Maps Satellite / Terrain / Roadmap:</strong> Huan ram leh in hmun awmna tak van atanga thlalak (satellite) leh tlang/ruam en theih.</li>
                <li><strong>Move Tool (Drag &amp; Pan):</strong> Map chunga kut emaw mouse pawt kualin hmun awlsam takin a pan theih.</li>
                <li><strong>Directional D-Pad (Move Pad):</strong> Hmar ⬆, Chhim ⬇, Thlang ⬅, Chhak ➡ tein meter 1 (Fine), meter 10 (Normal), meter 50 (Fast) tein a tawlh theih.</li>
                <li><strong>Device GPS Sensor:</strong> V/C hruaituten hmun takah phone kengin "My Current GPS" hmeh rualin an dinna latitude &amp; longitude an la nghal thei.</li>
              </ul>
            </div>

            {/* Feature 3: Official A4 Print & PDF */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <Printer className="w-4 h-4 text-amber-800" />
                <span>C. Official A4 Size Print &amp; Save PDF (Certificate)</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1 list-disc list-inside leading-relaxed pl-1">
                <li><strong>A4 Portrait Felfai:</strong> Website-a thil dang zawng thup boin Land Pass Certificate chauh standard A4-ah a print/save theih.</li>
                <li><strong>Letterhead &amp; Single Line Header:</strong> Council Logo, "OFFICE OF THE VILLAGE COUNCIL", Khaw hming, District, PIN leh State Emblem mawi taka rem a ni.</li>
                <li><strong>Pass Number &amp; QR Code:</strong> Pass Number hnuai chiahah QR Code a inhung a, mobile camera-in a scan theih nghal.</li>
                <li><strong>Ramri Grid List (2x2):</strong> Hmar, Chhak, Thlang, leh Chhim ramrite bawm fel takah a lang.</li>
                <li><strong>President Seal &amp; Signature:</strong> Secretary hming tel lovin President hming a lang a, President Seal chhutna hmun ruak zau tawk dah a ni bawk.</li>
                <li><strong>Dan leh Hrai (Phek 2):</strong> Phek hnunglamah Mizoram Village Council Dan hnuaia pass neitu zawm turte a in-print tel bawk.</li>
              </ul>
            </div>

            {/* Feature 4: QR Code Verification */}
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-sm">
                <QrCode className="w-4 h-4 text-purple-800" />
                <span>D. QR Code Hmanga Finfiahna (Public Verification Portal)</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Pass tina QR Code hi smartphone camera hmangin a scan theih a. Internet-ah lutin Village Council hming, Pass number, Neitu hming, Ramri, Issue Date, leh GPS Coordinates a rawn tarlang nghal vek a, pass lem a fihlim em em a ni.
              </p>
            </div>
          </div>

          {/* Section 3: Village Council Tana Hlawkpuinate */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>3. Mizoram Khawtlang Tana A Hlawkpuina Tlangpui</span>
            </h4>
            <div className="space-y-2 text-xs text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-neutral-900 block">Rorelna Thianghlim leh Felfai:</strong>
                  Village Council hna a tihtlangzarh a, V/C term a inthlak pawhin record a bo ve ngai lo.
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-neutral-900 block">Ramri Buaina Tlem Tur:</strong>
                  GPS Coordinates leh Boundary Grid felfai tak avangin ramri innek leh inhnialna a tlem phah em em ang.
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-neutral-900 block">Mipuite Thlamuanna:</strong>
                  Khawtual mipuite tan pass rintlak, bank loan lakna atana hman theih, leh sawrkar pawmpui theih certificate changtlung tak an nei thei a ni.
                </div>
              </div>
            </div>
          </div>

          {/* Support and Authority info */}
          <div className="bg-neutral-100 p-4 rounded-2xl border border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-neutral-800 block">Taimak leh Rualkhai Taka Thawhpui:</span>
              <span className="text-neutral-600">Email: ptlalfakzuala@gmail.com &bull; WhatsApp: 7005504074</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs"
            >
              Hrethiam E (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
