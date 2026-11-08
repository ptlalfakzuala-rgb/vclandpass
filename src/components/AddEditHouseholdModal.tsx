import React, { useState, useEffect } from 'react';
import {
  X,
  Users2,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Phone,
  User,
  Hash,
  CreditCard,
  Layers,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Search,
  FileText,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { HouseholdFamily, FamilyMember, VillageConfig, LandPass } from '../types';
import { generateNextFamilyId } from '../services/ptmsService';

interface AddEditHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (household: HouseholdFamily) => void;
  editingHousehold: HouseholdFamily | null;
  village: VillageConfig;
  existingHouseholds: HouseholdFamily[];
  allLandPasses: LandPass[];
}

export const AddEditHouseholdModal: React.FC<AddEditHouseholdModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHousehold,
  village,
  existingHouseholds,
  allLandPasses
}) => {
  const [familyId, setFamilyId] = useState<string>('');
  const [headOfFamily, setHeadOfFamily] = useState<string>('');
  const [headParentName, setHeadParentName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [vengSection, setVengSection] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [rationCardNumber, setRationCardNumber] = useState<string>('');
  const [economicStatus, setEconomicStatus] = useState<'APL' | 'BPL' | 'AAY'>('APL');
  const [annualIncomeRange, setAnnualIncomeRange] = useState<string>('1 - 3 Lakh');
  const [linkedLandPassIds, setLinkedLandPassIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Family Members list
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRelation, setNewMemberRelation] = useState<FamilyMember['relationToHead']>('Spouse');
  const [newMemberGender, setNewMemberGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newMemberAge, setNewMemberAge] = useState<string>('');
  const [newMemberOccupation, setNewMemberOccupation] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Land pass search & detail inspection state
  const [passSearchQuery, setPassSearchQuery] = useState<string>('');
  const [selectedPassDetail, setSelectedPassDetail] = useState<LandPass | null>(null);

  useEffect(() => {
    setPassSearchQuery('');
    setSelectedPassDetail(null);
    if (editingHousehold) {
      setFamilyId(editingHousehold.familyId || '');
      setHeadOfFamily(editingHousehold.headOfFamily || '');
      setHeadParentName(editingHousehold.headParentName || '');
      setContactNumber(editingHousehold.contactNumber || '');
      setVengSection(editingHousehold.vengSection || '');
      setHouseNumber(editingHousehold.houseNumber || '');
      setRationCardNumber(editingHousehold.rationCardNumber || '');
      setEconomicStatus(editingHousehold.economicStatus || 'APL');
      setAnnualIncomeRange(editingHousehold.annualIncomeRange || '1 - 3 Lakh');
      setLinkedLandPassIds(editingHousehold.linkedLandPassIds || []);
      setNotes(editingHousehold.notes || '');
      setMembers(editingHousehold.members || []);
    } else {
      // Auto-generate sequential Family ID based on village prefix
      const nextId = generateNextFamilyId(
        existingHouseholds,
        village.familyIdPrefix || `${village.villageName ? village.villageName.substring(0, 3).toUpperCase() : 'VC'}-FAM-`,
        village.startingFamilyNumber || 1
      );
      setFamilyId(nextId);
      setHeadOfFamily('');
      setHeadParentName('');
      setContactNumber('');
      setVengSection('');
      setHouseNumber('');
      setRationCardNumber('');
      setEconomicStatus('APL');
      setAnnualIncomeRange('1 - 3 Lakh');
      setLinkedLandPassIds([]);
      setNotes('');
      setMembers([]);
    }
    setErrors({});
  }, [editingHousehold, village, existingHouseholds, isOpen]);

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const member: FamilyMember = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      fullName: newMemberName.trim(),
      relationToHead: newMemberRelation,
      gender: newMemberGender,
      age: newMemberAge ? parseInt(newMemberAge, 10) : undefined,
      occupation: newMemberOccupation.trim() || undefined
    };
    setMembers((prev) => [...prev, member]);
    setNewMemberName('');
    setNewMemberAge('');
    setNewMemberOccupation('');
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleTogglePassLink = (passId: string) => {
    setLinkedLandPassIds((prev) =>
      prev.includes(passId) ? prev.filter((id) => id !== passId) : [...prev, passId]
    );
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!familyId.trim()) errs.familyId = 'Family ID is required';
    if (!headOfFamily.trim()) errs.headOfFamily = 'Head of Family name is required';
    if (!contactNumber.trim()) errs.contactNumber = 'Contact number is required';
    if (!vengSection.trim()) errs.vengSection = 'Veng / Section locality is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Total members is members array length + 1 (the head of family himself/herself)
    const totalCount = members.length + 1;

    const record: HouseholdFamily = {
      id: editingHousehold ? editingHousehold.id : `FAM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      familyId: familyId.trim(),
      villageId: village.id,
      villageName: village.villageName,
      headOfFamily: headOfFamily.trim(),
      headParentName: headParentName.trim(),
      contactNumber: contactNumber.trim(),
      vengSection: vengSection.trim(),
      houseNumber: houseNumber.trim() || undefined,
      rationCardNumber: rationCardNumber.trim() || undefined,
      economicStatus,
      annualIncomeRange,
      totalMembers: totalCount,
      members,
      linkedLandPassIds,
      notes: notes.trim() || undefined,
      createdAt: editingHousehold?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false
    };

    onSave(record);
    onClose();
  };

  // Village specific land passes to link
  const villagePasses = allLandPasses.filter(
    (p) => p.villageId === village.id || p.villageName.toLowerCase() === village.villageName.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh] animate-modal-pop">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-800/80 rounded-xl shadow-inner border border-purple-600/40">
              <Users2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span>{editingHousehold ? 'Edit Household & Family ID' : 'Create New Household & Family ID'}</span>
                <span className="text-[10px] bg-purple-700/80 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                  {village.villageName}
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                Official Village Council Family Identity, members census, and property tax record linkage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-purple-200 hover:text-white hover:bg-purple-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Family ID Identification Banner */}
          <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                Council Official Household Family ID (Unique)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Hash className="w-4 h-4 text-purple-700" />
                <input
                  type="text"
                  required
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  placeholder="e.g. SPH-FAM-0001"
                  className="bg-white border border-purple-300 rounded-lg px-3 py-1 font-mono font-black text-sm text-purple-950 shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {errors.familyId && <p className="text-xs text-rose-600 mt-1">{errors.familyId}</p>}
            </div>

            <div className="text-right text-[11px] text-purple-800 bg-purple-100/80 px-3 py-1.5 rounded-xl border border-purple-200">
              <span>Jurisdiction: </span>
              <strong>{village.villageName} Council</strong>
            </div>
          </div>

          {/* Section 1: Head of Family Details */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block border-b border-neutral-200 pb-1">
              1. Head of Family (Chhungkaw Lu) Information
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Head of Family Name (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={headOfFamily}
                    onChange={(e) => setHeadOfFamily(e.target.value)}
                    placeholder="e.g. Pu Lalremruata"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                  />
                </div>
                {errors.headOfFamily && <p className="text-xs text-rose-600 mt-1">{errors.headOfFamily}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Father&apos;s / Mother&apos;s Name
                </label>
                <input
                  type="text"
                  value={headParentName}
                  onChange={(e) => setHeadParentName(e.target.value)}
                  placeholder="e.g. Pu Rochhunga (L)"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Contact Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+91 94361 XXXXX"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                  />
                </div>
                {errors.contactNumber && <p className="text-xs text-rose-600 mt-1">{errors.contactNumber}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Veng / Section / Locality *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={vengSection}
                    onChange={(e) => setVengSection(e.target.value)}
                    placeholder="e.g. Vengthar / Bazar Veng / Chhim Veng"
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                  />
                </div>
                {errors.vengSection && <p className="text-xs text-rose-600 mt-1">{errors.vengSection}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  House / Plot Number (Optional)
                </label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g. H.No 45 / Plot B-12"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Ration Card / ID Number (Optional)
                </label>
                <input
                  type="text"
                  value={rationCardNumber}
                  onChange={(e) => setRationCardNumber(e.target.value)}
                  placeholder="e.g. MIZ-RC-88912"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Economic Category
                </label>
                <select
                  value={economicStatus}
                  onChange={(e: any) => setEconomicStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                >
                  <option value="APL">APL (Above Poverty Line)</option>
                  <option value="BPL">BPL (Below Poverty Line)</option>
                  <option value="AAY">AAY (Antyodaya Anna Yojana)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Estimated Annual Income
                </label>
                <select
                  value={annualIncomeRange}
                  onChange={(e) => setAnnualIncomeRange(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                >
                  <option value="< 1 Lakh">&lt; ₹1,00,000 / year</option>
                  <option value="1 - 3 Lakh">₹1,00,000 - ₹3,00,000 / year</option>
                  <option value="3 - 5 Lakh">₹3,00,000 - ₹5,00,000 / year</option>
                  <option value="> 5 Lakh">&gt; ₹5,00,000 / year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Family Members List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                2. Chhungte (Family Members) &bull; Total: {members.length + 1}
              </label>
              <span className="text-[11px] text-neutral-500">
                Head ({headOfFamily || 'Self'}) + {members.length} other members
              </span>
            </div>

            {/* Existing Members table */}
            {members.length > 0 ? (
              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-neutral-100 text-neutral-700 border-b border-neutral-200 font-bold">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Relation</th>
                      <th className="p-2.5">Gender</th>
                      <th className="p-2.5">Age</th>
                      <th className="p-2.5">Occupation</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {members.map((mem) => (
                      <tr key={mem.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 font-bold text-neutral-900">{mem.fullName}</td>
                        <td className="p-2.5 text-neutral-700">{mem.relationToHead}</td>
                        <td className="p-2.5 text-neutral-600">{mem.gender}</td>
                        <td className="p-2.5 text-neutral-600">{mem.age ?? '-'}</td>
                        <td className="p-2.5 text-neutral-600">{mem.occupation || '-'}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(mem.id)}
                            className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                No additional family members added yet. You can add spouse, children, or dependents below.
              </p>
            )}

            {/* Add Member inline form */}
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">
                + Add Another Family Member
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
                <select
                  value={newMemberRelation}
                  onChange={(e: any) => setNewMemberRelation(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                >
                  <option value="Spouse">Spouse (Nupui / Pasal)</option>
                  <option value="Son">Son (Fapa)</option>
                  <option value="Daughter">Daughter (Fanu)</option>
                  <option value="Father">Father (Pa)</option>
                  <option value="Mother">Mother (Nu)</option>
                  <option value="Brother">Brother (Unaupa)</option>
                  <option value="Sister">Sister (Unaunu)</option>
                  <option value="Other">Other dependent</option>
                </select>
                <select
                  value={newMemberGender}
                  onChange={(e: any) => setNewMemberGender(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Age"
                  min={0}
                  value={newMemberAge}
                  onChange={(e) => setNewMemberAge(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Job/Student"
                    value={newMemberOccupation}
                    onChange={(e) => setNewMemberOccupation(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Search & Link Land Passes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 block">
                3. Link Land Passes (Huan Ram &amp; In Hmun)
              </label>
              <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                {linkedLandPassIds.length} pass(es) linked
              </span>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-purple-600 absolute left-3 top-2.5" />
              <input
                type="text"
                value={passSearchQuery}
                onChange={(e) => setPassSearchQuery(e.target.value)}
                placeholder="Search Land Pass No. or Pass Owner Name (e.g. SPH-HR-1001, Lalremruata)..."
                className="w-full pl-9 pr-8 py-2 bg-purple-50/50 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-xs font-medium placeholder:text-neutral-400 shadow-inner"
              />
              {passSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPassSearchQuery('')}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search results dropdown/list */}
            {passSearchQuery.trim() && (
              <div className="bg-white border border-purple-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-neutral-100">
                {(() => {
                  const q = passSearchQuery.toLowerCase().trim();
                  const matches = villagePasses.filter(
                    (p) =>
                      p.passNumber.toLowerCase().includes(q) ||
                      p.ownerName.toLowerCase().includes(q) ||
                      (p.parentName && p.parentName.toLowerCase().includes(q)) ||
                      (p.locationAddress && p.locationAddress.toLowerCase().includes(q)) ||
                      (p.contactNumber && p.contactNumber.includes(q))
                  );

                  if (matches.length === 0) {
                    return (
                      <div className="p-3 text-center text-xs text-neutral-500">
                        No land passes found matching &ldquo;{passSearchQuery}&rdquo; in {village.villageName}.
                      </div>
                    );
                  }

                  return matches.map((p) => {
                    const isLinked = linkedLandPassIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`p-3 flex items-center justify-between gap-2 hover:bg-purple-50/60 transition-colors cursor-pointer ${
                          selectedPassDetail?.id === p.id ? 'bg-purple-50' : ''
                        }`}
                        onClick={() => setSelectedPassDetail(p)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-purple-950">
                              {p.passNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              p.passType === 'huan_ram'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.passType === 'huan_ram' ? '🌳 Huan Ram' : '🏠 In Hmun'}
                            </span>
                            {isLinked && (
                              <span className="text-[10px] bg-purple-700 text-white font-bold px-1.5 py-0.5 rounded-full">
                                ✓ Linked
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-neutral-800 truncate mt-0.5">
                            {p.ownerName} {p.parentName ? `(s/d of ${p.parentName})` : ''}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            Area: {p.areaSize || 'Boundary Area'} &bull; Loc: {p.locationAddress || village.villageName}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPassDetail(p);
                            }}
                            className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[11px] font-medium cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePassLink(p.id);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-transform active:scale-95 cursor-pointer ${
                              isLinked
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-purple-700 text-white hover:bg-purple-800'
                            }`}
                          >
                            {isLinked ? 'Unlink' : '+ Link Pass'}
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Fetched Pass Detail Card (when user clicks or searches a pass) */}
            {selectedPassDetail && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 border-2 border-purple-300 rounded-2xl p-3.5 shadow-xs relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-700 text-white rounded-xl shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-purple-950">
                          {selectedPassDetail.passNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedPassDetail.passType === 'huan_ram'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {selectedPassDetail.passType === 'huan_ram' ? '🌳 Huan Ram' : '🏠 In Hmun'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 mt-0.5">
                        Owner: {selectedPassDetail.ownerName}{' '}
                        {selectedPassDetail.parentName && (
                          <span className="font-normal text-neutral-600">
                            (Nu/Pa: {selectedPassDetail.parentName})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePassLink(selectedPassDetail.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs ${
                        linkedLandPassIds.includes(selectedPassDetail.id)
                          ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                          : 'bg-purple-700 hover:bg-purple-800 text-white'
                      }`}
                    >
                      {linkedLandPassIds.includes(selectedPassDetail.id) ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Unlink this Pass</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Link to Family ID</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPassDetail(null)}
                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Detailed Metadata Fetched */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white/80 p-2.5 rounded-xl border border-purple-200">
                  <div>
                    <span className="text-neutral-500 block">Area Size:</span>
                    <strong className="text-neutral-800 font-mono">{selectedPassDetail.areaSize || 'Full Boundary Area'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Location:</span>
                    <strong className="text-neutral-800 truncate block">{selectedPassDetail.locationAddress || village.villageName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Contact:</span>
                    <strong className="text-neutral-800">{selectedPassDetail.contactNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Issue Date:</span>
                    <strong className="text-neutral-800 font-mono">{selectedPassDetail.issueDate}</strong>
                  </div>
                </div>

                {/* Boundaries Detail */}
                <div className="mt-2 text-[11px] bg-white/70 p-2 rounded-xl border border-purple-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div><span className="text-neutral-500">Hmar (N):</span> <span className="font-medium text-neutral-800">{selectedPassDetail.boundaryNorth}</span></div>
                  <div><span className="text-neutral-500">Chhim (S):</span> <span className="font-medium text-neutral-800">{selectedPassDetail.boundarySouth}</span></div>
                  <div><span className="text-neutral-500">Chhak (E):</span> <span className="font-medium text-neutral-800">{selectedPassDetail.boundaryEast}</span></div>
                  <div><span className="text-neutral-500">Thlang (W):</span> <span className="font-medium text-neutral-800">{selectedPassDetail.boundaryWest}</span></div>
                </div>
              </div>
            )}

            {/* Currently Linked Passes Cards */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                Currently Linked Land Passes ({linkedLandPassIds.length}):
              </span>

              {linkedLandPassIds.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {linkedLandPassIds.map((passId) => {
                    const pass = allLandPasses.find((p) => p.id === passId);
                    if (!pass) return null;
                    return (
                      <div
                        key={pass.id}
                        className="p-3 bg-purple-50/70 hover:bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            pass.passType === 'huan_ram'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pass.passType === 'huan_ram' ? '🌳' : '🏠'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-950">
                                {pass.passNumber}
                              </span>
                              <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-neutral-200 text-neutral-600 font-medium">
                                {pass.passType === 'huan_ram' ? 'Huan Ram' : 'In Hmun'}
                              </span>
                            </div>
                            <p className="font-semibold text-neutral-800 mt-0.5">
                              {pass.ownerName} &bull; <span className="text-neutral-500 font-normal">{pass.areaSize || 'Boundary Area'}</span>
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              N: {pass.boundaryNorth} &bull; S: {pass.boundarySouth} &bull; E: {pass.boundaryEast} &bull; W: {pass.boundaryWest}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPassDetail(pass)}
                            className="p-1.5 text-neutral-600 hover:text-purple-800 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="View full pass details"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePassLink(pass.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="Unlink this pass from family"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-4 bg-neutral-50 border border-dashed border-neutral-300 rounded-xl text-neutral-500 text-xs">
                  <p className="font-medium text-neutral-700">No Land Passes linked yet.</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Search above by Pass No. or Owner Name to find and link Huan Ram or In Hmun.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1">
              Council Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any administrative observations, voter details, or property remarks..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-purple-500 text-xs"
            />
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
              className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Check className="w-4 h-4" />
              <span>{editingHousehold ? 'Update Household Record' : 'Save & Register Family ID'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
