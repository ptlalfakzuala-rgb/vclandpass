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
  Phone,
  Mail,
  AlertTriangle,
  Award,
  Check
} from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900 rounded-2xl text-amber-300 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl flex items-center gap-2">
                <span>Mizoram Village Council Land Pass App Chungchang</span>
                <span className="text-[10px] bg-amber-500 text-neutral-950 px-2.5 py-0.5 rounded-full font-sans uppercase font-bold tracking-wider">
                  Mizo Tawngin Chipchiar
                </span>
              </h2>
              <p className="text-xs text-emerald-300/90 font-medium">
                Village Council Huan Ram leh In Hmun Pass Digital Enkawlna &bull; Chipchiar Taka Hrilhfiahna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
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
                  Mizoram Village Council Land Pass Management System Bulpui
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-sans">
                  He application hi <strong>Mizoram Village Council (V/C)</strong> te tana bika buatsaih, <strong>Huan Ram leh In Hmun Land Pass</strong> felfai, rintlak leh changkang taka enkawl, chhuah, leh chhinchhiahna (Digital Land Registry System) a ni. Hmanlai lehkha bu hlui, chhia leh boral thei laka fihlimin, khawtlang rorelna leh ram pek chungchang rintlak leh zahawm taka digital hmanga kumhlun vawn thatna hmanrua a ni.
                </p>
              </div>
            </div>
          </div>

          {/* Sorkar Thuchhuah a ni lo tih Fiahna (Mandatory Disclaimer) */}
          <div className="p-4 sm:p-5 bg-amber-50 rounded-2xl border-2 border-amber-400/80 space-y-2">
            <div className="flex items-center gap-2.5 text-amber-950 font-black text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>HRIATTIRNA PAWIMAWH : Sorkar Thuchhuah / Sorkar App A Ni Lo</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              He application hi <strong>Mizoram Sorkar</strong> siam emaw tihchhuah a ni lo va (not government-issued). Mizoram chhunga Village Council hrang hrang ten mahni khua leh bial chhunga Huan Ram leh In Hmun pass buaipui awlsam zawk nan, ramri fel zawk nan, leh record kumhluna him taka an vawn theih nana <strong>independent digital software</strong> a siam a ni.
            </p>
          </div>

          {/* Section 1: Eng vanga he app hi siam nge a nih? */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>1. Eng Vanga He App Hi Siam Nge A Nih? (Purpose &amp; Vision)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  1. Record Bo Ngai Lo Turin
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Village Council term a inthlak apiangin lehkha bu a bo ṭhin a, ram neitute tan buaina a thlen ṭhin. He app hmang hian kumhlunin data cloud-ah a him reng dawn a ni.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  2. Pass Lem &amp; Inbumna Venna
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Pass tinah QR Code leh Serial Number danglam bik dah zel a ni a, tu pawhin phone camera hmangin second reilotê chhungin a dik leh dik loh an finfiah thei.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  3. Ramri Innek &amp; Inhnialna Tihreh
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Ramri palite (Hmar, Chhak, Thlang, Chhim) leh Google Maps GPS Coordinates (Latitude, Longitude) thlap thlapa chhinchhiah a nih avangin ram innek buaina a veng.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 text-xs sm:text-sm block">
                  4. Mipuite Tana Rintlak &amp; Zahawm
                </span>
                <p className="text-xs text-neutral-600 leading-normal">
                  Standard A4 Certificate felfai tak, Council Logo leh President Seal chhutna hmun remchan thlapa siam a ni a, bank loan emaw thil dang atan pawh rintlak a ni.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Hmanraw Pawimawh Te */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>2. Hmanraw Pawimawh leh Thiltihtheihte (Core Features)</span>
            </h4>

            {/* Feature 1: Pass Chhuahna */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span>A. Huan Ram &amp; In Hmun Pass Siam Zung Zung Theihna</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Huan Ram Pass (Agri/Garden):</strong> Thlai chinna, thingpui/thei huan leh leipui pekna lehkha.</li>
                <li><strong>In Hmun Pass (Residential Site):</strong> Chenna in hmun leh building sakna tura ram pekna lehkha.</li>
                <li><strong>Auto-Sequential Pass Number:</strong> Pass number (e.g. <code>MZ-VC-SPH-HR-1001</code>) hi computer-in indawt thlapin amahin a chhiar zel a, pass number in-ang a awm thei lo.</li>
                <li><strong>Neitu Chanchin &amp; Zauhzawng:</strong> Neitu hming, Nu/Pa hming, Phone number, Ram Zauhzawng (Sq.ft, Bigha, Tin zawn), leh Vaphên/Hmun hming ziah luhna.</li>
                <li><strong>Live Direct:</strong> Secretary account approve tawh te chuan pass an siam apiangin live-in a chhuak nghal a, authority approval nghah kher a ngai tawh lo.</li>
              </ul>
            </div>

            {/* Feature 2: Google Maps GPS & Move Tool */}
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                <MapPin className="w-4 h-4 text-blue-800" />
                <span>B. Google Maps GPS Coordinates &amp; Move Tool Changtlung</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Satellite, Terrain &amp; Roadmap:</strong> Huan ram leh in hmun awmna tak van aṭanga thlalak (Satellite) leh tlang/ruam en theihna.</li>
                <li><strong>Move Tool (Drag &amp; Pan):</strong> Map chunga kut emaw mouse pawt kualin hmun awlsam takin a pan theih.</li>
                <li><strong>Directional D-Pad (Move Pad):</strong> Hmar ⬆, Chhim ⬇, Thlang ⬅, Chhak ➡ tein meter 1 (Fine), meter 10 (Normal), meter 50 (Fast) tein pin a tawlh theih.</li>
                <li><strong>Phone Device GPS Sensor:</strong> Hmun takah phone kengin "My Current GPS" hmeh rualin Secretary-in a dinna latitude &amp; longitude dik tak a la nghal thei.</li>
              </ul>
            </div>

            {/* Feature 3: Official A4 Print & PDF */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <Printer className="w-4 h-4 text-amber-800" />
                <span>C. Official A4 Size Print &amp; Save PDF View Mode</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Pure A4 Print Layout:</strong> Website-a thil dang zawng thup boin Land Pass Certificate chauh standard A4 paper-ah a print/save theih.</li>
                <li><strong>Single Line Header:</strong> Council Logo, "OFFICE OF THE VILLAGE COUNCIL", Khaw hming, District, PIN leh Official Emblem mawi taka rem a ni.</li>
                <li><strong>Pass Number &amp; QR Code:</strong> Certificate chunglama QR Code chhut tel hian mobile camera-in a scan theih nghal.</li>
                <li><strong>2x2 Boundary Grid:</strong> Hmar, Chhak, Thlang, leh Chhim ramrite bawm fel takah a lang thlap.</li>
                <li><strong>President Seal &amp; Signature:</strong> President hming a lang a, President Official Seal chhutna hmun ruak zau tawk dah a ni bawk.</li>
                <li><strong>Dan leh Hrai (Phek 2):</strong> Phek hnunglamah Village Council Dan hnuaia pass neitu zawm turte a in-print tel bawk.</li>
                <li><strong>Theme 4 Thlan Theih:</strong> Classic Heritage (Emerald), Royal Official (Navy), Modern Executive (Charcoal), Parchment Ivory (Warm).</li>
              </ul>
            </div>

            {/* Feature 4: QR Code Verification */}
            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-sm">
                <QrCode className="w-4 h-4 text-purple-800" />
                <span>D. QR Code Finfiahna &amp; Camera Scanner Dialogue Box</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Pass tina QR Code hi phone camera hmangin second reilotê chhungin a scan theih a. Camera dialogue box-ah viewfinder mawi tak a lang a. Pass a dik chiah chuan engmah administrative function buaithlak lang lovin, standard A4 Certificate print/save view mode a rawn lang nghal a ni.
              </p>
            </div>

            {/* Feature 5: Registration & Lifetime Approval */}
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>E. Secretary Registration &amp; Lifetime Approval (₹299 One-time Fee)</span>
              </div>
              <ul className="text-xs text-neutral-700 space-y-1.5 list-disc list-inside leading-relaxed pl-1">
                <li><strong>Kumhlun Hman Man (Lifetime):</strong> Vawi khat chauh ₹299 pein Authority hnen aṭangin Lifetime Approval pek a ni. Thla tin fee emaw kum tin fee a awm lo.</li>
                <li><strong>UPI Payment:</strong> <code>ptlalfakzuala@okhdfcbank</code> (Google Pay, PhonePe, Paytm, BHIM) hmangin awlsam takin a pek theih.</li>
                <li><strong>Secret Key Himna:</strong> Secretary tinte'n mahni Secret Key an nei a, Full Authority mode-ah a ṭul hun atan a en theih a, account delete theih a ni bawk.</li>
              </ul>
            </div>

            {/* Feature 6: Offline-First & Realtime Cloud */}
            <div className="p-4 bg-neutral-100 rounded-xl border border-neutral-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Wifi className="w-4 h-4 text-neutral-700" />
                <span>F. Offline Hmunah Pawh Hman Theih (Encrypted Local Storage)</span>
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">
                Internet awm lohna ram kilkhawr berah pawh pass siam zel theih a ni a, phone-ah him takin a inkhawl ṭha a. Internet awm veleh Firebase Realtime Cloud-ah a in-sync nghal zel a ni.
              </p>
            </div>
          </div>

          {/* Section 3: Village Council Secretary-te Hman Dan (Step-by-step) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2 border-b border-neutral-200 pb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>3. Secretary Tana Hman Tan Dan (Step-by-Step Guide)</span>
            </h4>
            <div className="space-y-2 text-xs text-neutral-700">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-neutral-900 block font-sans">Account Siam &amp; Fee Pek:</strong>
                  "Create VC Secretary Account" ah lut la, Username, Contact number, leh Secret Key siam la, ₹299 payment screenshot upload rawh.
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-neutral-900 block font-sans">Authority Hnenah Hriattir:</strong>
                  WhatsApp (+91 7005504074) emaw Email hmangin hriattir la, rang takin Lifetime Approval an pe ang che.
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-neutral-900 block font-sans">Khaw Chanchin (Profile) Dah:</strong>
                  Login hnuah "My Village Council" ah lut la, khaw hming, District, PIN code, President hming leh Council Logo thun rawh.
                </div>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-neutral-900 block font-sans">Land Pass Siam &amp; Print:</strong>
                  "Issue Land Pass" hmetin Huan Ram emaw In Hmun pass siam la, A4-ah print-in President seal &amp; signature nen mipuite hnenah pe chhuak rawh.
                </div>
              </div>
            </div>
          </div>

          {/* Direct Support & Authority Contact */}
          <div className="bg-gradient-to-r from-emerald-950 to-neutral-900 text-white p-5 rounded-2xl border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-amber-300 text-sm block">
                Direct Authority &amp; Technical Support:
              </span>
              <p className="text-emerald-100/90">
                Ptlalfakzuala &bull; WhatsApp/Phone: <strong>+91 7005504074</strong> &bull; Email: <strong>ptlalfakzuala@gmail.com</strong>
              </p>
              <p className="text-[11px] text-neutral-400">
                Village Council Secretary registration approval, thurawn, leh technical puihna atan biakpawh theih reng a ni.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shrink-0 cursor-pointer"
            >
              Hrethiam E (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
