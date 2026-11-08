import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Users2,
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Edit,
  CreditCard,
  Hash,
  Phone,
  MapPin,
  TrendingUp,
  DollarSign,
  FileText,
  UserCheck,
  X
} from 'lucide-react';
import { HouseholdFamily, PropertyTaxRecord, VillageConfig, LandPass, UserProfile } from '../types';

interface PropertyTaxManagementPageProps {
  currentVillage: VillageConfig;
  currentUser: UserProfile | null;
  isAdmin: boolean;
  households: HouseholdFamily[];
  taxRecords: PropertyTaxRecord[];
  landPasses: LandPass[];
  onOpenAddHousehold: () => void;
  onEditHousehold: (household: HouseholdFamily) => void;
  onDeleteHousehold: (household: HouseholdFamily) => void;
  onOpenAddTax: () => void;
  onEditTax: (tax: PropertyTaxRecord) => void;
  onDeleteTax: (tax: PropertyTaxRecord) => void;
  onPrintReceipt: (tax: PropertyTaxRecord) => void;
}

export const PropertyTaxManagementPage: React.FC<PropertyTaxManagementPageProps> = ({
  currentVillage,
  currentUser,
  isAdmin,
  households,
  taxRecords,
  landPasses,
  onOpenAddHousehold,
  onEditHousehold,
  onDeleteHousehold,
  onOpenAddTax,
  onEditTax,
  onDeleteTax,
  onPrintReceipt
}) => {
  const [activeTab, setActiveTab] = useState<'taxes' | 'households' | 'analytics'>('taxes');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedHouseholdDetail, setSelectedHouseholdDetail] = useState<HouseholdFamily | null>(null);

  // Filtered households for current village
  const villageHouseholds = useMemo(() => {
    return households.filter(
      (h) => h.villageId === currentVillage.id || h.villageName?.toLowerCase() === currentVillage.villageName.toLowerCase()
    );
  }, [households, currentVillage]);

  // Filtered tax records for current village
  const villageTaxes = useMemo(() => {
    return taxRecords.filter(
      (t) => t.villageId === currentVillage.id || t.villageName?.toLowerCase() === currentVillage.villageName.toLowerCase()
    );
  }, [taxRecords, currentVillage]);

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalAssessed = villageTaxes.reduce((sum, t) => sum + (t.totalPayableAmount || 0), 0);
    const totalCollected = villageTaxes.reduce((sum, t) => sum + (t.amountPaid || 0), 0);
    const totalDue = villageTaxes.reduce((sum, t) => sum + (t.balanceDue || 0), 0);
    const totalPaidCount = villageTaxes.filter((t) => t.paymentStatus === 'paid').length;
    const totalUnpaidCount = villageTaxes.filter((t) => t.paymentStatus !== 'paid').length;
    const totalPopulation = villageHouseholds.reduce((sum, h) => sum + (h.totalMembers || 1), 0);

    return {
      totalAssessed,
      totalCollected,
      totalDue,
      totalPaidCount,
      totalUnpaidCount,
      totalHouseholds: villageHouseholds.length,
      totalPopulation
    };
  }, [villageTaxes, villageHouseholds]);

  // Search filtered taxes
  const displayedTaxes = useMemo(() => {
    return villageTaxes.filter((t) => {
      const matchSearch =
        !searchTerm.trim() ||
        t.taxInvoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.householdHeadName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.familyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vengSection?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && t.paymentStatus === 'paid') ||
        (statusFilter === 'unpaid' && t.paymentStatus !== 'paid');

      const matchYear = selectedYear === 'all' || t.taxYear === selectedYear;

      return matchSearch && matchStatus && matchYear;
    });
  }, [villageTaxes, searchTerm, statusFilter, selectedYear]);

  // Search filtered households
  const displayedHouseholds = useMemo(() => {
    return villageHouseholds.filter((h) => {
      return (
        !searchTerm.trim() ||
        h.familyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.headOfFamily?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.contactNumber?.includes(searchTerm) ||
        h.vengSection?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [villageHouseholds, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-neutral-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/30 px-3 py-0.5 rounded-full uppercase flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" />
              Village Council PTMS
            </span>
            <span className="text-xs text-emerald-200 bg-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
              {currentVillage.villageName} Council Jurisdiction
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide text-white">
            Property Tax Management &amp; Family ID System
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl leading-relaxed">
            Digital household census, unique Family IDs, annual property assessments, sanitation cess collection, and official receipt issuance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap relative z-10 shrink-0">
          <button
            onClick={onOpenAddHousehold}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            title="Create new household census & generate Family ID"
          >
            <Users2 className="w-4 h-4 text-amber-300" />
            <span>Create Family ID</span>
          </button>

          <button
            onClick={onOpenAddTax}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            title="Issue new property tax assessment or invoice"
          >
            <Receipt className="w-4 h-4 text-neutral-950" />
            <span>Issue Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Families */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Registered Families</span>
            <Users2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">
            {metrics.totalHouseholds}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">
            Est. Population: {metrics.totalPopulation}
          </div>
        </div>

        {/* Total Tax Assessed */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Total Assessed Tax</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-neutral-900">
            ₹{metrics.totalAssessed.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">
            {villageTaxes.length} Invoices Issued
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Collected Revenue</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950">
            ₹{metrics.totalCollected.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {metrics.totalPaidCount} Invoices Paid
          </div>
        </div>

        {/* Outstanding Balance Due */}
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Outstanding Due</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-950">
            ₹{metrics.totalDue.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {metrics.totalUnpaidCount} Invoices Pending
          </div>
        </div>
      </div>

      {/* Main Switcher Tabs & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('taxes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              activeTab === 'taxes'
                ? 'bg-white text-emerald-900 shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-700" />
            <span>Tax Invoices &amp; Receipts ({villageTaxes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('households')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 ${
              activeTab === 'households'
                ? 'bg-white text-purple-900 shadow-xs -translate-y-0.5'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Users2 className="w-3.5 h-3.5 text-purple-700" />
            <span>Family ID Register ({villageHouseholds.length})</span>
          </button>
        </div>

        {/* Search & Quick Filter Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'taxes' ? 'Search invoice, head, family ID...' : 'Search family ID, head, phone...'}
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {activeTab === 'taxes' && (
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  statusFilter === 'paid' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-neutral-600'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                  statusFilter === 'unpaid' ? 'bg-amber-600 text-white shadow-2xs' : 'text-neutral-600'
                }`}
              >
                Unpaid
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: TAX INVOICES & PAYMENTS LIST */}
      {activeTab === 'taxes' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          {displayedTaxes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="p-3.5">Invoice / Receipt No</th>
                    <th className="p-3.5">Family ID</th>
                    <th className="p-3.5">Household Head</th>
                    <th className="p-3.5">Veng / Section</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Total Assessed</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {displayedTaxes.map((tax) => {
                    const isPaid = tax.paymentStatus === 'paid';
                    const isPartial = tax.paymentStatus === 'partial';

                    return (
                      <tr key={tax.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Invoice No */}
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-neutral-900 block">
                            {tax.taxInvoiceNumber}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Year: {tax.taxYear}
                          </span>
                        </td>

                        {/* Family ID */}
                        <td className="p-3.5 font-mono font-bold text-purple-900">
                          {tax.familyId}
                        </td>

                        {/* Household Head */}
                        <td className="p-3.5">
                          <span className="font-bold text-neutral-900 block">{tax.householdHeadName}</span>
                          <span className="text-[10px] text-neutral-500">{tax.contactNumber}</span>
                        </td>

                        {/* Veng */}
                        <td className="p-3.5 text-neutral-700">
                          {tax.vengSection}
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="capitalize text-neutral-700 font-medium">
                            {tax.propertyCategory.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Total Assessed */}
                        <td className="p-3.5 text-right font-mono font-bold text-neutral-900">
                          ₹{tax.totalPayableAmount.toFixed(2)}
                        </td>

                        {/* Amount Paid */}
                        <td className="p-3.5 text-right font-mono text-emerald-800 font-bold">
                          ₹{tax.amountPaid.toFixed(2)}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3.5 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid</span>
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Partial (Due: ₹{tax.balanceDue})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Unpaid</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Print Official Receipt */}
                            <button
                              onClick={() => onPrintReceipt(tax)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer transition-colors"
                              title="Print A4 Official Tax Receipt"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-800" />
                            </button>

                            {/* Edit Tax Invoice */}
                            <button
                              onClick={() => onEditTax(tax)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer transition-colors"
                              title="Edit Tax Invoice & Payment Record"
                            >
                              <Edit className="w-3.5 h-3.5 text-neutral-700" />
                            </button>

                            {/* Delete Tax Invoice */}
                            <button
                              onClick={() => onDeleteTax(tax)}
                              className="p-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                              title="Delete Tax Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <Receipt className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-neutral-800">
                No Property Tax Invoices Found
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                Begin issuing property holding tax assessments or village sanitation cess for households in {currentVillage.villageName}.
              </p>
              <button
                onClick={onOpenAddTax}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Issue First Tax Invoice</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOUSEHOLDS & FAMILY ID REGISTRY */}
      {activeTab === 'households' && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          {displayedHouseholds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="p-3.5">Family ID</th>
                    <th className="p-3.5">Head of Family</th>
                    <th className="p-3.5">Contact Number</th>
                    <th className="p-3.5">Veng / Section</th>
                    <th className="p-3.5 text-center">Total Members</th>
                    <th className="p-3.5 text-center">Economic Status</th>
                    <th className="p-3.5 text-center">Linked Land Passes</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {displayedHouseholds.map((house) => {
                    const linkedCount = house.linkedLandPassIds?.length || 0;

                    return (
                      <tr key={house.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Family ID */}
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-purple-950 text-sm block">
                            {house.familyId}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {house.houseNumber ? `House: ${house.houseNumber}` : 'House: N/A'}
                          </span>
                        </td>

                        {/* Head of Family */}
                        <td className="p-3.5">
                          <span className="font-bold text-neutral-900 block text-xs">
                            {house.headOfFamily}
                          </span>
                          {house.headParentName && (
                            <span className="text-[10px] text-neutral-500">
                              Parent: {house.headParentName}
                            </span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="p-3.5 text-neutral-700 font-medium">
                          {house.contactNumber}
                        </td>

                        {/* Veng */}
                        <td className="p-3.5 text-neutral-700">
                          {house.vengSection}
                        </td>

                        {/* Total Members */}
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {house.totalMembers || 1} members
                          </span>
                        </td>

                        {/* Economic Status */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              house.economicStatus === 'BPL'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : house.economicStatus === 'AAY'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                          >
                            {house.economicStatus || 'APL'}
                          </span>
                        </td>

                        {/* Linked Passes */}
                        <td className="p-3.5 text-center">
                          {linkedCount > 0 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {linkedCount} Land Pass(es)
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Household details */}
                            <button
                              onClick={() => setSelectedHouseholdDetail(house)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer transition-colors"
                              title="View Family Members & Linkages"
                            >
                              <Eye className="w-3.5 h-3.5 text-purple-700" />
                            </button>

                            {/* Edit Household */}
                            <button
                              onClick={() => onEditHousehold(house)}
                              className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer transition-colors"
                              title="Edit Household Census & Family Members"
                            >
                              <Edit className="w-3.5 h-3.5 text-neutral-700" />
                            </button>

                            {/* Delete Household */}
                            <button
                              onClick={() => onDeleteHousehold(house)}
                              className="p-1.5 bg-neutral-100 hover:bg-rose-50 text-neutral-600 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                              title="Delete Family ID Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <Users2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-neutral-800">
                No Household Family IDs Registered
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-4">
                Register households in {currentVillage.villageName} to assign unique sequential Family IDs and link land passes.
              </p>
              <button
                onClick={onOpenAddHousehold}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Family ID</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Household Detail View Modal */}
      {selectedHouseholdDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto animate-modal-pop">
            <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users2 className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">
                    Household Census: {selectedHouseholdDetail.familyId}
                  </h3>
                  <p className="text-xs text-purple-200">
                    {selectedHouseholdDetail.headOfFamily} &bull; {selectedHouseholdDetail.vengSection}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHouseholdDetail(null)}
                className="p-1.5 text-purple-200 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Head Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Head of Family:</span>
                  <span className="font-bold text-neutral-900 text-sm">{selectedHouseholdDetail.headOfFamily}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Phone Number:</span>
                  <span className="font-bold text-neutral-900 text-sm">{selectedHouseholdDetail.contactNumber}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Category &bull; Income:</span>
                  <span className="font-semibold text-neutral-800">{selectedHouseholdDetail.economicStatus} &bull; {selectedHouseholdDetail.annualIncomeRange}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">House No &bull; Ration Card:</span>
                  <span className="font-semibold text-neutral-800">{selectedHouseholdDetail.houseNumber || 'N/A'} &bull; {selectedHouseholdDetail.rationCardNumber || 'N/A'}</span>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-2">
                  Chhungkaw Member-te (Family Members) &bull; {selectedHouseholdDetail.totalMembers} Total
                </h4>

                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Relation</th>
                        <th className="p-2">Gender</th>
                        <th className="p-2">Age</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 bg-white">
                      <tr className="bg-purple-50/50 font-bold">
                        <td className="p-2 text-neutral-900">{selectedHouseholdDetail.headOfFamily} (Lu)</td>
                        <td className="p-2 text-purple-900">Head of Family</td>
                        <td className="p-2 text-neutral-600">-</td>
                        <td className="p-2 text-neutral-600">-</td>
                      </tr>
                      {selectedHouseholdDetail.members.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2 font-semibold text-neutral-800">{m.fullName}</td>
                          <td className="p-2 text-neutral-600">{m.relationToHead}</td>
                          <td className="p-2 text-neutral-600">{m.gender}</td>
                          <td className="p-2 text-neutral-600">{m.age ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Linked Land Passes */}
              {selectedHouseholdDetail.linkedLandPassIds && selectedHouseholdDetail.linkedLandPassIds.length > 0 && (
                <div>
                  <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wider mb-1.5">
                    Linked Land Passes
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHouseholdDetail.linkedLandPassIds.map((pid) => {
                      const pass = landPasses.find((p) => p.id === pid);
                      return (
                        <span key={pid} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-mono font-bold text-[11px]">
                          {pass ? `${pass.passNumber} (${pass.ownerName})` : pid}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSelectedHouseholdDetail(null)}
                className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
