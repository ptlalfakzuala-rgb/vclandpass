import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  Building2,
  Calendar,
  CreditCard,
  Check,
  AlertCircle,
  Hash,
  Users2,
  Landmark,
  Calculator
} from 'lucide-react';
import { PropertyTaxRecord, HouseholdFamily, VillageConfig, LandPass, PropertyCategory, AssessmentStatus, TaxPaymentStatus } from '../types';
import { generateNextTaxInvoiceNumber } from '../services/ptmsService';

interface AddEditTaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tax: PropertyTaxRecord) => void;
  editingTax: PropertyTaxRecord | null;
  village: VillageConfig;
  existingTaxes: PropertyTaxRecord[];
  households: HouseholdFamily[];
  landPasses: LandPass[];
}

export const AddEditTaxModal: React.FC<AddEditTaxModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTax,
  village,
  existingTaxes,
  households,
  landPasses
}) => {
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState<string>('');
  const [taxYear, setTaxYear] = useState<string>('2026-2027');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [householdHeadName, setHouseholdHeadName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [vengSection, setVengSection] = useState<string>('');
  const [houseOrPlotNo, setHouseOrPlotNo] = useState<string>('');
  const [linkedLandPassId, setLinkedLandPassId] = useState<string>('');
  const [propertyCategory, setPropertyCategory] = useState<PropertyCategory>('residential');
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus>('assessed');

  // Rates & Calculation
  const [landAreaSqFt, setLandAreaSqFt] = useState<string>('1200');
  const [baseRatePerSqFt, setBaseRatePerSqFt] = useState<string>(
    String(village.defaultPropertyTaxRate ?? 150)
  );
  const [annualAssessedValue, setAnnualAssessedValue] = useState<string>('150');
  const [totalTaxDue, setTotalTaxDue] = useState<string>('150');
  const [garbageOrSanitationFee, setGarbageOrSanitationFee] = useState<string>(
    String(village.defaultSanitationFee ?? 50)
  );
  const [waterOrCivicFee, setWaterOrCivicFee] = useState<string>('0');
  const [totalPayableAmount, setTotalPayableAmount] = useState<number>(200);

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<TaxPaymentStatus>('unpaid');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('cash');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('2026-12-31');
  const [remarks, setRemarks] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTax) {
      setTaxInvoiceNumber(editingTax.taxInvoiceNumber || '');
      setTaxYear(editingTax.taxYear || '2026-2027');
      setSelectedFamilyId(editingTax.familyId || '');
      setHouseholdHeadName(editingTax.householdHeadName || '');
      setContactNumber(editingTax.contactNumber || '');
      setVengSection(editingTax.vengSection || '');
      setHouseOrPlotNo(editingTax.houseOrPlotNo || '');
      setLinkedLandPassId(editingTax.linkedLandPassId || '');
      setPropertyCategory(editingTax.propertyCategory || 'residential');
      setAssessmentStatus(editingTax.assessmentStatus || 'assessed');
      setLandAreaSqFt(String(editingTax.landAreaSqFt || 1200));
      setBaseRatePerSqFt(String(editingTax.baseRatePerSqFt || village.defaultPropertyTaxRate || 150));
      setAnnualAssessedValue(String(editingTax.annualAssessedValue || 150));
      setTotalTaxDue(String(editingTax.totalTaxDue || 150));
      setGarbageOrSanitationFee(String(editingTax.garbageOrSanitationFee ?? 50));
      setWaterOrCivicFee(String(editingTax.waterOrCivicFee ?? 0));
      setTotalPayableAmount(editingTax.totalPayableAmount || 200);
      setPaymentStatus(editingTax.paymentStatus || 'unpaid');
      setAmountPaid(String(editingTax.amountPaid || 0));
      setPaymentMode(editingTax.paymentMode || 'cash');
      setPaymentReference(editingTax.paymentReference || '');
      setDueDate(editingTax.dueDate || '2026-12-31');
      setRemarks(editingTax.remarks || '');
    } else {
      const nextInv = generateNextTaxInvoiceNumber(
        existingTaxes,
        village.taxInvoicePrefix || 'PTMS-VC-',
        '2026-2027',
        village.startingTaxInvoiceNumber || 1
      );
      setTaxInvoiceNumber(nextInv);
      setTaxYear('2026-2027');
      setSelectedFamilyId('');
      setHouseholdHeadName('');
      setContactNumber('');
      setVengSection('');
      setHouseOrPlotNo('');
      setLinkedLandPassId('');
      setPropertyCategory('residential');
      setAssessmentStatus('assessed');
      setLandAreaSqFt('1200');
      const bRate = village.defaultPropertyTaxRate ?? 150;
      const sFee = village.defaultSanitationFee ?? 50;
      setBaseRatePerSqFt(String(bRate));
      setAnnualAssessedValue(String(bRate));
      setTotalTaxDue(String(bRate));
      setGarbageOrSanitationFee(String(sFee));
      setWaterOrCivicFee('0');
      setTotalPayableAmount(bRate + sFee);
      setPaymentStatus('unpaid');
      setAmountPaid('0');
      setPaymentMode('cash');
      setPaymentReference('');
      setDueDate('2025-12-31');
      setRemarks('');
    }
    setErrors({});
  }, [editingTax, village, existingTaxes, isOpen]);

  // Handle selecting a registered Family ID to auto-fill details
  const handleSelectFamily = (famId: string) => {
    setSelectedFamilyId(famId);
    const found = households.find((h) => h.familyId === famId || h.id === famId);
    if (found) {
      setHouseholdHeadName(found.headOfFamily);
      setContactNumber(found.contactNumber);
      setVengSection(found.vengSection);
      if (found.houseNumber) setHouseOrPlotNo(found.houseNumber);
      if (found.linkedLandPassIds && found.linkedLandPassIds.length > 0) {
        setLinkedLandPassId(found.linkedLandPassIds[0]);
      }
    }
  };

  // Recalculate total payable when components change
  useEffect(() => {
    const tax = parseFloat(totalTaxDue) || 0;
    const san = parseFloat(garbageOrSanitationFee) || 0;
    const civic = parseFloat(waterOrCivicFee) || 0;
    const total = Math.max(0, tax + san + civic);
    setTotalPayableAmount(total);

    // Auto-adjust status if amountPaid matches total
    const paid = parseFloat(amountPaid) || 0;
    if (paid >= total && total > 0) {
      setPaymentStatus('paid');
    } else if (paid > 0 && paid < total) {
      setPaymentStatus('partial');
    } else {
      if (paymentStatus === 'paid') setPaymentStatus('unpaid');
    }
  }, [totalTaxDue, garbageOrSanitationFee, waterOrCivicFee, amountPaid]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!taxInvoiceNumber.trim()) errs.taxInvoiceNumber = 'Invoice Number is required';
    if (!selectedFamilyId.trim()) errs.selectedFamilyId = 'Family ID selection is required';
    if (!householdHeadName.trim()) errs.householdHeadName = 'Household head name is required';
    if (!dueDate.trim()) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const paidVal = parseFloat(amountPaid) || 0;
    const balance = Math.max(0, totalPayableAmount - paidVal);

    // Find linked pass number if any
    const linkedPass = landPasses.find((p) => p.id === linkedLandPassId);

    const record: PropertyTaxRecord = {
      id: editingTax ? editingTax.id : `TAX_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      taxInvoiceNumber: taxInvoiceNumber.trim(),
      taxYear: taxYear.trim(),
      villageId: village.id,
      villageName: village.villageName,
      familyId: selectedFamilyId.trim(),
      householdHeadName: householdHeadName.trim(),
      contactNumber: contactNumber.trim(),
      vengSection: vengSection.trim(),
      houseOrPlotNo: houseOrPlotNo.trim() || undefined,
      linkedLandPassId: linkedLandPassId || undefined,
      linkedPassNumber: linkedPass?.passNumber || undefined,
      propertyCategory,
      assessmentStatus,
      landAreaSqFt: landAreaSqFt ? parseFloat(landAreaSqFt) : undefined,
      baseRatePerSqFt: baseRatePerSqFt ? parseFloat(baseRatePerSqFt) : undefined,
      annualAssessedValue: parseFloat(annualAssessedValue) || 0,
      totalTaxDue: parseFloat(totalTaxDue) || 0,
      garbageOrSanitationFee: parseFloat(garbageOrSanitationFee) || 0,
      waterOrCivicFee: parseFloat(waterOrCivicFee) || 0,
      totalPayableAmount,
      paymentStatus: balance <= 0 && totalPayableAmount > 0 ? 'paid' : paymentStatus,
      amountPaid: paidVal,
      balanceDue: balance,
      paidDate: paidVal > 0 ? new Date().toISOString().split('T')[0] : undefined,
      paymentMode: paidVal > 0 ? paymentMode : undefined,
      paymentReference: paymentReference.trim() || undefined,
      receiptNumber: paidVal > 0 ? `RCP-${taxInvoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}` : undefined,
      dueDate,
      remarks: remarks.trim() || undefined,
      createdAt: editingTax?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false
    };

    onSave(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/80 rounded-xl shadow-inner border border-emerald-600/40">
              <Landmark className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>{editingTax ? 'Edit Property Tax Assessment' : 'New Property Tax Assessment & Invoice'}</span>
                <span className="text-[10px] bg-emerald-700/80 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  PTMS
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Official Village Council Property Tax &amp; Civic Cess Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Invoice Header Details */}
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Tax Invoice Number *
              </span>
              <input
                type="text"
                required
                value={taxInvoiceNumber}
                onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                className="w-full mt-1 px-3 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-xs text-emerald-950"
              />
              {errors.taxInvoiceNumber && <p className="text-xs text-rose-600 mt-1">{errors.taxInvoiceNumber}</p>}
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Assessment Financial Year
              </span>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(e.target.value)}
                className="w-full mt-1 px-3 py-1 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-xs text-emerald-950"
              >
                <option value="2026-2027">2026-2027</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2028-2029">2028-2029</option>
                <option value="2029-2030">2029-2030</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider block">
                Payment Deadline Due Date *
              </span>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full mt-1 px-3 py-1 bg-white border border-emerald-300 rounded-lg font-mono text-xs text-emerald-950"
              />
            </div>
          </div>

          {/* Section 1: Household Family Selection & Auto-fill */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block border-b border-neutral-200 pb-1">
              1. Household Family Identification (Select Family ID)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Family ID * (from Village Census)
                </label>
                <div className="relative">
                  <select
                    value={selectedFamilyId}
                    onChange={(e) => handleSelectFamily(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono text-emerald-950"
                  >
                    <option value="">-- Select Household Family ID --</option>
                    {households.map((h) => (
                      <option key={h.id} value={h.familyId}>
                        {h.familyId} &bull; {h.headOfFamily} ({h.vengSection})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.selectedFamilyId && <p className="text-xs text-rose-600 mt-1">{errors.selectedFamilyId}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Household Head Name *
                </label>
                <input
                  type="text"
                  required
                  value={householdHeadName}
                  onChange={(e) => setHouseholdHeadName(e.target.value)}
                  placeholder="Auto-filled from Family ID"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                />
                {errors.householdHeadName && <p className="text-xs text-rose-600 mt-1">{errors.householdHeadName}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 94361 XXXXX"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Veng / Section / House No.
                </label>
                <input
                  type="text"
                  value={vengSection}
                  onChange={(e) => setVengSection(e.target.value)}
                  placeholder="e.g. Vengthar, House No. 24"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Property Category
                </label>
                <select
                  value={propertyCategory}
                  onChange={(e: any) => setPropertyCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="residential">Residential (In Hmun)</option>
                  <option value="commercial">Commercial (Dawr / Bazar Hmun)</option>
                  <option value="agricultural_huan">Agricultural (Huan Ram)</option>
                  <option value="vacant_plot">Vacant Plot (Hmun Awl)</option>
                  <option value="mixed_use">Mixed Use</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Linked Land Pass (Optional)
                </label>
                <select
                  value={linkedLandPassId}
                  onChange={(e) => setLinkedLandPassId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="">-- No Land Pass Linked --</option>
                  {landPasses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.passNumber} - {p.ownerName} ({p.passType === 'huan_ram' ? 'HR' : 'IH'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Assessment Fees & Calculation */}
          <div className="space-y-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-700" />
                <span>2. Property Tax Assessment &amp; Village Cess</span>
              </label>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Total: ₹{totalPayableAmount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Base Property Tax (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={totalTaxDue}
                  onChange={(e) => setTotalTaxDue(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Garbage / Sanitation Cess (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={garbageOrSanitationFee}
                  onChange={(e) => setGarbageOrSanitationFee(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Civic / Water Cess (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={waterOrCivicFee}
                  onChange={(e) => setWaterOrCivicFee(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Record */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block border-b border-neutral-200 pb-1">
              3. Payment Collection Status
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e: any) => setPaymentStatus(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : paymentStatus === 'partial'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="unpaid">Unpaid (A la pe lo)</option>
                  <option value="paid">Paid (Pek tawh)</option>
                  <option value="partial">Partial (A zatve pe)</option>
                  <option value="overdue">Overdue (Hun pelh)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Amount Collected (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalPayableAmount}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e: any) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                >
                  <option value="cash">Cash (Kuta pek)</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  UPI Ref / Receipt Remarks
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. Cash received by Secretary or UPI Transaction ID 48219..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Check className="w-4 h-4" />
              <span>{editingTax ? 'Update Tax Invoice' : 'Issue Tax Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
