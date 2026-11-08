import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  Calendar,
  Receipt,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { PropertyTaxRecord, VillageConfig } from '../types';

interface PrintableTaxReceiptModalProps {
  tax: PropertyTaxRecord;
  village: VillageConfig;
  onClose: () => void;
}

export const PrintableTaxReceiptModal: React.FC<PrintableTaxReceiptModalProps> = ({
  tax,
  village,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const isPaid = tax.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0 animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none animate-modal-pop">
        {/* Modal Top Bar - hidden during print */}
        <div className="px-6 py-3.5 bg-neutral-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">
                Official Property Tax &amp; Cess Receipt
              </h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                {tax.taxInvoiceNumber} &bull; {tax.villageName} Council
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4 Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div ref={printRef} className="p-8 overflow-y-auto space-y-6 text-neutral-900 print:p-6 print:space-y-4">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-emerald-900 pb-4 relative">
            <div className="flex items-center justify-center gap-4 mb-2">
              {village.logoUrl ? (
                <img
                  src={village.logoUrl}
                  alt="Council Logo"
                  className="w-16 h-16 object-contain rounded-xl border border-neutral-300 p-1"
                />
              ) : (
                <div className="w-14 h-14 bg-emerald-950 text-amber-400 rounded-xl flex items-center justify-center font-serif font-black text-lg">
                  VC
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-800 font-bold block">
                  GOVERNMENT OF MIZORAM JURISDICTION
                </span>
                <h1 className="text-xl sm:text-2xl font-serif font-black text-neutral-900 uppercase tracking-wide">
                  {village.villageName ? `${village.villageName} VILLAGE COUNCIL` : 'VILLAGE COUNCIL, MIZORAM'}
                </h1>
                <p className="text-xs text-neutral-600 font-medium">
                  {village.districtName ? `${village.districtName} District` : 'Mizoram'} &bull; {village.blockName ? `${village.blockName}` : 'RD Block'} &bull; PIN: {village.pinCode || '796001'}
                </p>
              </div>
            </div>

            <div className="inline-block px-4 py-1 bg-emerald-900 text-amber-300 font-bold font-serif text-xs rounded-full uppercase tracking-wider mt-1">
              PROPERTY TAX &amp; CIVIC CESS RECEIPT ({tax.taxYear})
            </div>
          </div>

          {/* Receipt Header Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-neutral-200 rounded-xl p-4 bg-neutral-50/80">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Invoice / Receipt No:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">{tax.taxInvoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Financial Assessment Year:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">{tax.taxYear}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Family ID (Household):</span>
              <span className="font-mono font-bold text-purple-900 text-sm">{tax.familyId}</span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold">Issue / Payment Date:</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">{tax.paidDate || tax.createdAt.split('T')[0]}</span>
            </div>
          </div>

          {/* Tax Payer / Household Info */}
          <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider border-b border-neutral-200 pb-1">
              Taxpayer &amp; Property Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500">Household Head:</span>
                <span className="font-bold text-neutral-900 ml-1">{tax.householdHeadName}</span>
              </div>
              <div>
                <span className="text-neutral-500">Contact Phone:</span>
                <span className="font-bold text-neutral-900 ml-1">{tax.contactNumber}</span>
              </div>
              <div>
                <span className="text-neutral-500">Veng / Locality:</span>
                <span className="font-bold text-neutral-900 ml-1">{tax.vengSection}</span>
              </div>
              <div>
                <span className="text-neutral-500">Property Type:</span>
                <span className="font-bold text-neutral-900 ml-1 capitalize">{tax.propertyCategory.replace('_', ' ')}</span>
              </div>
              {tax.linkedPassNumber && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Linked Land Pass:</span>
                  <span className="font-mono font-bold text-emerald-800 ml-1">{tax.linkedPassNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assessment Breakdown Table */}
          <div className="border border-neutral-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-3">Fee / Assessment Head</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                <tr>
                  <td className="p-3 font-semibold">Base Property Tax</td>
                  <td className="p-3 text-neutral-600">Annual village council property holding tax</td>
                  <td className="p-3 text-right font-mono font-bold">₹{tax.totalTaxDue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Garbage &amp; Sanitation Cess</td>
                  <td className="p-3 text-neutral-600">Village environmental &amp; waste management fee</td>
                  <td className="p-3 text-right font-mono font-bold">₹{(tax.garbageOrSanitationFee || 0).toFixed(2)}</td>
                </tr>
                {!!tax.waterOrCivicFee && (
                  <tr>
                    <td className="p-3 font-semibold">Civic &amp; Water Amenities Cess</td>
                    <td className="p-3 text-neutral-600">Local streetlights, pathways, and civic maintenance</td>
                    <td className="p-3 text-right font-mono font-bold">₹{tax.waterOrCivicFee.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-neutral-50 font-bold">
                  <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-neutral-800">
                    Total Assessed Payable Amount:
                  </td>
                  <td className="p-3 text-right font-mono text-sm text-neutral-950">
                    ₹{tax.totalPayableAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Status Stamp Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50">
            <div className="flex items-center gap-3">
              {isPaid ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-amber-600 flex items-center justify-center text-amber-800 shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
              )}

              <div>
                <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                  Official Status
                </span>
                <h3 className={`text-base font-black uppercase tracking-wider ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isPaid ? 'PAID &bull; RECEIPT ISSUED' : `UNPAID / DUE: ₹${tax.balanceDue.toFixed(2)}`}
                </h3>
                {isPaid && (
                  <p className="text-[11px] text-neutral-600 font-mono">
                    Mode: {tax.paymentMode?.toUpperCase() || 'CASH'} &bull; Ref: {tax.paymentReference || 'Council Cash Counter'}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-neutral-500 block text-[10px]">Total Paid:</span>
              <span className="text-base font-black font-mono text-emerald-800">
                ₹{tax.amountPaid.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Signatures & Seal Space */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-serif font-bold text-neutral-900 border-b border-neutral-400 px-8">
                  {village.secretaryName || 'Council Secretary'}
                </span>
              </div>
              <span className="text-neutral-600 block text-[11px]">Secretary, Village Council</span>
              <span className="text-neutral-400 text-[10px]">{village.villageName} Council</span>
            </div>

            <div>
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-serif font-bold text-neutral-900 border-b border-neutral-400 px-8">
                  {village.presidentName || 'Council President'}
                </span>
              </div>
              <span className="text-neutral-600 block text-[11px]">President, Village Council</span>
              <span className="text-neutral-400 text-[10px]">{village.villageName} Council</span>
            </div>
          </div>

          {/* Official Verification Notice */}
          <div className="text-center pt-4 border-t border-neutral-200 text-[10px] text-neutral-500">
            This is an official computer-generated receipt from the Village Council Land &amp; Property Tax Management System (PTMS).
          </div>
        </div>
      </div>
    </div>
  );
};
