import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Settings,
  Users2,
  Receipt,
  Calendar,
  Hash,
  Calculator,
  Check,
  ArrowRight,
  Landmark,
  FileText,
  AlertCircle
} from 'lucide-react';
import { VillageConfig, PropertyCategory, HouseholdFamily, PropertyTaxRecord } from '../types';
import { generateNextFamilyId, generateNextTaxInvoiceNumber } from '../services/ptmsService';
import { logActivity } from '../services/auditLogger';

interface ManagePtmsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  village: VillageConfig;
  households: HouseholdFamily[];
  taxRecords: PropertyTaxRecord[];
  onSave: (updatedVillage: VillageConfig) => Promise<void> | void;
  currentUserDisplayName?: string | null;
}

const STANDARD_FINANCIAL_YEARS = [
  '2024-2025',
  '2025-2026',
  '2026-2027',
  '2027-2028',
  '2028-2029',
  '2029-2030',
  '2030-2031'
];

export const ManagePtmsSettingsModal: React.FC<ManagePtmsSettingsModalProps> = ({
  isOpen,
  onClose,
  village,
  households,
  taxRecords,
  onSave,
  currentUserDisplayName
}) => {
  // Family ID Numbering
  const [familyIdPrefix, setFamilyIdPrefix] = useState<string>('VC-FAM-');
  const [startingFamilyNumber, setStartingFamilyNumber] = useState<string>('1');
  const [familyIdDigits, setFamilyIdDigits] = useState<number>(4);

  // Tax Invoice Numbering & Financial Year
  const [taxInvoicePrefix, setTaxInvoicePrefix] = useState<string>('PTMS-VC-');
  const [startingTaxInvoiceNumber, setStartingTaxInvoiceNumber] = useState<string>('1');
  const [currentTaxYear, setCurrentTaxYear] = useState<string>('2026-2027');
  const [customTaxYear, setCustomTaxYear] = useState<string>('');
  const [useCustomYear, setUseCustomYear] = useState<boolean>(false);
  const [defaultTaxDueDate, setDefaultTaxDueDate] = useState<string>('2026-12-31');

  // Default Assessment Rates & Category
  const [defaultPropertyTaxRate, setDefaultPropertyTaxRate] = useState<string>('150');
  const [defaultSanitationFee, setDefaultSanitationFee] = useState<string>('50');
  const [defaultCivicFee, setDefaultCivicFee] = useState<string>('0');
  const [defaultPropertyCategory, setDefaultPropertyCategory] = useState<PropertyCategory>('residential');
  const [ptmsReceiptNote, setPtmsReceiptNote] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaultFamPrefix =
      village.familyIdPrefix ||
      `${(village.villageName?.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'VC').toUpperCase()}-FAM-`;
    const defaultTaxPrefix =
      village.taxInvoicePrefix ||
      `PTMS-${(village.villageName?.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'VC').toUpperCase()}-`;

    const yr = village.currentTaxYear || '2026-2027';
    const isStd = STANDARD_FINANCIAL_YEARS.includes(yr);

    setFamilyIdPrefix(defaultFamPrefix);
    setStartingFamilyNumber(String(village.startingFamilyNumber ?? 1));
    setFamilyIdDigits(village.familyIdDigits ?? 4);

    setTaxInvoicePrefix(defaultTaxPrefix);
    setStartingTaxInvoiceNumber(String(village.startingTaxInvoiceNumber ?? 1));
    setCurrentTaxYear(yr);
    setUseCustomYear(!isStd);
    setCustomTaxYear(isStd ? '' : yr);
    setDefaultTaxDueDate(village.defaultTaxDueDate || `${yr.split('-')[0] || '2026'}-12-31`);

    setDefaultPropertyTaxRate(String(village.defaultPropertyTaxRate ?? 150));
    setDefaultSanitationFee(String(village.defaultSanitationFee ?? 50));
    setDefaultCivicFee(String(village.defaultCivicFee ?? 0));
    setDefaultPropertyCategory(village.defaultPropertyCategory || 'residential');
    setPtmsReceiptNote(village.ptmsReceiptNote || '');
    setError(null);
  }, [village, isOpen]);

  const effectiveTaxYear = useMemo(() => {
    return (useCustomYear ? customTaxYear : currentTaxYear).trim() || '2026-2027';
  }, [useCustomYear, customTaxYear, currentTaxYear]);

  const normalizedFamPrefix = useMemo(() => {
    const t = familyIdPrefix.trim();
    if (!t) return 'VC-FAM-';
    return t.endsWith('-') || t.endsWith('/') ? t : `${t}-`;
  }, [familyIdPrefix]);

  const normalizedTaxPrefix = useMemo(() => {
    const t = taxInvoicePrefix.trim();
    if (!t) return 'PTMS-VC-';
    return t.endsWith('-') || t.endsWith('/') ? t : `${t}-`;
  }, [taxInvoicePrefix]);

  const previewStartFamilyId = useMemo(() => {
    const num = Math.max(1, parseInt(startingFamilyNumber, 10) || 1);
    return `${normalizedFamPrefix}${String(num).padStart(familyIdDigits, '0')}`;
  }, [normalizedFamPrefix, startingFamilyNumber, familyIdDigits]);

  const previewNextFamilyId = useMemo(() => {
    const num = Math.max(1, parseInt(startingFamilyNumber, 10) || 1);
    return generateNextFamilyId(households, normalizedFamPrefix, num, familyIdDigits);
  }, [households, normalizedFamPrefix, startingFamilyNumber, familyIdDigits]);

  const previewStartTaxInvoice = useMemo(() => {
    const num = Math.max(1, parseInt(startingTaxInvoiceNumber, 10) || 1);
    const yrPart = effectiveTaxYear.split('-')[0] || '2026';
    return `${normalizedTaxPrefix}${yrPart}-${String(num).padStart(familyIdDigits, '0')}`;
  }, [normalizedTaxPrefix, effectiveTaxYear, startingTaxInvoiceNumber, familyIdDigits]);

  const previewNextTaxInvoice = useMemo(() => {
    const num = Math.max(1, parseInt(startingTaxInvoiceNumber, 10) || 1);
    return generateNextTaxInvoiceNumber(taxRecords, normalizedTaxPrefix, effectiveTaxYear, num, familyIdDigits);
  }, [taxRecords, normalizedTaxPrefix, effectiveTaxYear, startingTaxInvoiceNumber, familyIdDigits]);

  const defaultTotalAssessment = useMemo(() => {
    const base = Math.max(0, parseFloat(defaultPropertyTaxRate) || 0);
    const san = Math.max(0, parseFloat(defaultSanitationFee) || 0);
    const civic = Math.max(0, parseFloat(defaultCivicFee) || 0);
    return base + san + civic;
  }, [defaultPropertyTaxRate, defaultSanitationFee, defaultCivicFee]);

  if (!isOpen) return null;

  // Quick helper to advance Financial Year (e.g. 2026-2027 -> 2027-2028)
  const handleAdvanceFinancialYear = () => {
    const match = effectiveTaxYear.match(/^(\d{4})-(\d{4})$/);
    let nextYear = '2027-2028';
    let nextDueStart = '2027';
    if (match) {
      const startY = parseInt(match[1], 10) + 1;
      const endY = parseInt(match[2], 10) + 1;
      nextYear = `${startY}-${endY}`;
      nextDueStart = String(startY);
    } else {
      const singleMatch = effectiveTaxYear.match(/^(\d{4})$/);
      if (singleMatch) {
        const y = parseInt(singleMatch[1], 10) + 1;
        nextYear = `${y}-${y + 1}`;
        nextDueStart = String(y);
      }
    }

    if (STANDARD_FINANCIAL_YEARS.includes(nextYear)) {
      setUseCustomYear(false);
      setCurrentTaxYear(nextYear);
    } else {
      setUseCustomYear(true);
      setCustomTaxYear(nextYear);
    }

    // Update due date year cleanly
    if (defaultTaxDueDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultTaxDueDate)) {
      setDefaultTaxDueDate(`${nextDueStart}${defaultTaxDueDate.slice(4)}`);
    } else {
      setDefaultTaxDueDate(`${nextDueStart}-12-31`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyIdPrefix.trim()) {
      setError('Family ID Prefix cannot be empty.');
      return;
    }
    if (!taxInvoicePrefix.trim()) {
      setError('Tax Invoice Prefix cannot be empty.');
      return;
    }
    if (!effectiveTaxYear) {
      setError('Financial Year is required.');
      return;
    }

    const updatedVillage: VillageConfig = {
      ...village,
      familyIdPrefix: normalizedFamPrefix,
      startingFamilyNumber: Math.max(1, parseInt(startingFamilyNumber, 10) || 1),
      familyIdDigits,
      taxInvoicePrefix: normalizedTaxPrefix,
      startingTaxInvoiceNumber: Math.max(1, parseInt(startingTaxInvoiceNumber, 10) || 1),
      currentTaxYear: effectiveTaxYear,
      defaultTaxDueDate: defaultTaxDueDate.trim() || `${effectiveTaxYear.split('-')[0] || '2026'}-12-31`,
      defaultPropertyTaxRate: Math.max(0, parseFloat(defaultPropertyTaxRate) || 0),
      defaultSanitationFee: Math.max(0, parseFloat(defaultSanitationFee) || 0),
      defaultCivicFee: Math.max(0, parseFloat(defaultCivicFee) || 0),
      defaultPropertyCategory,
      ptmsReceiptNote: ptmsReceiptNote.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    logActivity(
      'VILLAGE_PROFILE_UPDATE',
      village.id,
      village.villageName,
      currentUserDisplayName || 'Council Secretary',
      `Updated PTMS & Family ID settings: FY ${effectiveTaxYear}, Family Prefix ${normalizedFamPrefix} (Start #${updatedVillage.startingFamilyNumber}), Invoice Prefix ${normalizedTaxPrefix} (Start #${updatedVillage.startingTaxInvoiceNumber})`
    );

    await onSave(updatedVillage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[94vh] animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-purple-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 shadow-inner">
              <Settings className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Manage Property Tax &amp; Family ID System</span>
                <span className="text-[10px] bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-full font-mono uppercase font-black">
                  PTMS CONFIG
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Configure number prefixes, starting serial numbers, financial year, and default cess rates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Family ID Numbering System */}
          <div className="bg-purple-50/60 p-4 sm:p-5 rounded-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-xs uppercase tracking-wider">
                <Users2 className="w-4 h-4 text-purple-700" />
                <span>1. Household Family ID Numbering</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
                Next ID: {previewNextFamilyId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Family ID Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={familyIdPrefix}
                  onChange={(e) => setFamilyIdPrefix(e.target.value)}
                  placeholder="e.g. SPH-FAM-"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-mono font-bold text-purple-950"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Prefix before serial number (auto-appends <code>-</code> if omitted).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Starting Serial Number *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    required
                    value={startingFamilyNumber}
                    onChange={(e) => setStartingFamilyNumber(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-mono font-bold text-purple-950"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Minimum starting sequence (e.g. 1 or 1001).
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Serial Digit Format
                </label>
                <select
                  value={familyIdDigits}
                  onChange={(e) => setFamilyIdDigits(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-mono font-bold text-purple-950"
                >
                  <option value={3}>3 Digits (001)</option>
                  <option value={4}>4 Digits (0001)</option>
                  <option value={5}>5 Digits (00001)</option>
                  <option value={6}>6 Digits (000001)</option>
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Applies to Family ID &amp; Invoice serial padding.
                </p>
              </div>
            </div>

            <div className="bg-white/90 px-3.5 py-2.5 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-neutral-600">
                Base Start Format: <strong className="text-purple-800">{previewStartFamilyId}</strong>
              </span>
              <span className="text-neutral-600">
                Next Auto-Generated Family ID: <strong className="text-purple-950 bg-purple-100 px-2 py-0.5 rounded">{previewNextFamilyId}</strong>
              </span>
            </div>
          </div>

          {/* Section 2: Financial Year & Tax Invoice Numbering */}
          <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-2xl border border-emerald-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <span>2. Financial Year &amp; Tax Invoice Numbering</span>
              </div>
              <button
                type="button"
                onClick={handleAdvanceFinancialYear}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                title="Advance Active Financial Year by 1 year"
              >
                <Calendar className="w-3 h-3" />
                <span>Advance Next FY</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-700">
                    Active Financial Year *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomYear((prev) => !prev);
                      if (!useCustomYear && !customTaxYear) {
                        setCustomTaxYear(currentTaxYear);
                      }
                    }}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                  >
                    {useCustomYear ? 'Use Standard List' : 'Enter Custom Year'}
                  </button>
                </div>

                {useCustomYear ? (
                  <input
                    type="text"
                    required
                    value={customTaxYear}
                    onChange={(e) => setCustomTaxYear(e.target.value)}
                    placeholder="e.g. 2026-2027"
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-950"
                  />
                ) : (
                  <select
                    value={currentTaxYear}
                    onChange={(e) => {
                      const nextY = e.target.value;
                      setCurrentTaxYear(nextY);
                      const startPart = nextY.split('-')[0];
                      if (startPart && /^\d{4}$/.test(startPart) && /^\d{4}-\d{2}-\d{2}$/.test(defaultTaxDueDate)) {
                        setDefaultTaxDueDate(`${startPart}${defaultTaxDueDate.slice(4)}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-950"
                  >
                    {STANDARD_FINANCIAL_YEARS.map((fy) => (
                      <option key={fy} value={fy}>
                        FY {fy}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Default Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={defaultTaxDueDate}
                  onChange={(e) => setDefaultTaxDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Tax Invoice Prefix *
                </label>
                <input
                  type="text"
                  required
                  value={taxInvoicePrefix}
                  onChange={(e) => setTaxInvoicePrefix(e.target.value)}
                  placeholder="e.g. PTMS-SPH-"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Starting Tax Invoice Number *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    required
                    value={startingTaxInvoiceNumber}
                    onChange={(e) => setStartingTaxInvoiceNumber(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold text-emerald-950"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/90 px-3.5 py-2.5 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-neutral-600">
                Base Invoice Format: <strong className="text-emerald-800">{previewStartTaxInvoice}</strong>
              </span>
              <span className="text-neutral-600">
                Next Auto Invoice: <strong className="text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">{previewNextTaxInvoice}</strong>
              </span>
            </div>
          </div>

          {/* Section 3: Default Property Tax & Cess Assessment Rates */}
          <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-amber-700" />
                <span>3. Default Annual Tax &amp; Cess Assessment Rates</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                Default Total: ₹{defaultTotalAssessment}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Base Property Tax (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultPropertyTaxRate}
                  onChange={(e) => setDefaultPropertyTaxRate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-mono font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Garbage / Sanitation Cess (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultSanitationFee}
                  onChange={(e) => setDefaultSanitationFee(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-mono font-bold text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Civic / Water Cess (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={defaultCivicFee}
                  onChange={(e) => setDefaultCivicFee(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-mono font-bold text-neutral-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Default Property Category
                </label>
                <select
                  value={defaultPropertyCategory}
                  onChange={(e: any) => setDefaultPropertyCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-medium text-neutral-900"
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
                  Receipt Footer Note (Optional)
                </label>
                <input
                  type="text"
                  value={ptmsReceiptNote}
                  onChange={(e) => setPtmsReceiptNote(e.target.value)}
                  placeholder="e.g. Khaw tana chhiah pek hi kan mawhphurhna a ni."
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3">
            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              Syncs immediately to Firebase Cloud for {village.villageName}.
            </span>
            <div className="flex items-center gap-2 ml-auto">
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
                <span>Save PTMS &amp; Family ID Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
