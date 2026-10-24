import React, { useState, useEffect, useRef } from 'react';
import { LandPass, PassType, VillageConfig } from '../types';
import { getNextPassNumber } from '../services/offlineSync';
import { MapPickerModal } from './MapPickerModal';
import {
  X,
  MapPin,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  FileCheck2,
  Trash2,
  Lock,
} from 'lucide-react';

interface AddEditLandPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passData: Omit<LandPass, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud'>, isEdit: boolean, existingId?: string) => void;
  editingPass?: LandPass | null;
  existingPasses: LandPass[];
  village: VillageConfig;
}

export const AddEditLandPassModal: React.FC<AddEditLandPassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPass,
  existingPasses,
  village,
}) => {
  const [passType, setPassType] = useState<PassType>('huan_ram');
  const [passNumber, setPassNumber] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [locationCoordinates, setLocationCoordinates] = useState<string>('');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [boundaryNorth, setBoundaryNorth] = useState<string>('');
  const [boundaryEast, setBoundaryEast] = useState<string>('');
  const [boundaryWest, setBoundaryWest] = useState<string>('');
  const [boundarySouth, setBoundarySouth] = useState<string>('');
  const [areaSize, setAreaSize] = useState<string>('');
  const [nocDocumentUrl, setNocDocumentUrl] = useState<string>('');
  const [nocDocumentName, setNocDocumentName] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [presidentSignatory, setPresidentSignatory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingPass) {
      setPassType(editingPass.passType);
      setPassNumber(editingPass.passNumber);
      setOwnerName(editingPass.ownerName);
      setParentName(editingPass.parentName);
      setContactNumber(editingPass.contactNumber);
      setLocationCoordinates(editingPass.locationCoordinates || '24.2415, 92.9350');
      setLocationAddress(editingPass.locationAddress || '');
      setBoundaryNorth(editingPass.boundaryNorth);
      setBoundaryEast(editingPass.boundaryEast);
      setBoundaryWest(editingPass.boundaryWest);
      setBoundarySouth(editingPass.boundarySouth);
      setAreaSize(editingPass.areaSize || '');
      setNocDocumentUrl(editingPass.nocDocumentUrl || '');
      setNocDocumentName(editingPass.nocDocumentName || '');
      setIssueDate(editingPass.issueDate);
      setPresidentSignatory(editingPass.presidentSignatory || village.presidentName || '');
      setNotes(editingPass.notes || '');
    } else {
      // New Pass - Clean with NO pre-filled values
      const activePrefix = passType === 'huan_ram' ? village.huanRamPrefix : village.inHmunPrefix;
      const startNum = passType === 'huan_ram'
        ? (village.startingHuanRamNumber || village.startingPassNumber || 1001)
        : (village.startingInHmunNumber || village.startingPassNumber || 1001);
      const calculatedNumber = getNextPassNumber(passType, existingPasses, activePrefix, village.id, startNum);
      setPassNumber(calculatedNumber);
      setOwnerName('');
      setParentName('');
      setContactNumber('');
      setLocationCoordinates('');
      setLocationAddress('');
      setBoundaryNorth('');
      setBoundaryEast('');
      setBoundaryWest('');
      setBoundarySouth('');
      setAreaSize('');
      setNocDocumentUrl('');
      setNocDocumentName('');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setPresidentSignatory(village.presidentName || '');
      setNotes('');
    }
    setErrors({});
  }, [editingPass, isOpen, village, passType]);

  // Recalculate pass number if type changes in "Add" mode
  const handlePassTypeChange = (type: PassType) => {
    setPassType(type);
    if (!editingPass) {
      const activePrefix = type === 'huan_ram' ? village.huanRamPrefix : village.inHmunPrefix;
      const startNum = type === 'huan_ram'
        ? (village.startingHuanRamNumber || village.startingPassNumber || 1001)
        : (village.startingInHmunNumber || village.startingPassNumber || 1001);
      const calculatedNumber = getNextPassNumber(type, existingPasses, activePrefix, village.id, startNum);
      setPassNumber(calculatedNumber);
    }
  };

  // Photo / Document picker for NOC
  const handleNocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB. Please upload a smaller compressed image or document.');
      return;
    }

    setNocDocumentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNocDocumentUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearNoc = () => {
    setNocDocumentUrl('');
    setNocDocumentName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required.';
    if (!parentName.trim()) newErrors.parentName = "Father's or Mother's name is required.";
    if (!contactNumber.trim() || contactNumber.length < 8)
      newErrors.contactNumber = 'Valid contact phone number is required.';
    if (!passNumber.trim()) newErrors.passNumber = 'Pass number is required.';
    if (!boundaryNorth.trim()) newErrors.boundaryNorth = 'North boundary is required.';
    if (!boundaryEast.trim()) newErrors.boundaryEast = 'East boundary is required.';
    if (!boundaryWest.trim()) newErrors.boundaryWest = 'West boundary is required.';
    if (!boundarySouth.trim()) newErrors.boundarySouth = 'South boundary is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Omit<LandPass, 'id' | 'createdAt' | 'updatedAt' | 'syncedToCloud'> = {
      passNumber: passNumber.trim(),
      passType,
      villageId: village.id,
      villageName: village.villageName,
      ownerName: ownerName.trim(),
      parentName: parentName.trim(),
      contactNumber: contactNumber.trim(),
      locationCoordinates: locationCoordinates.trim(),
      locationAddress: locationAddress.trim(),
      boundaryNorth: boundaryNorth.trim(),
      boundaryEast: boundaryEast.trim(),
      boundaryWest: boundaryWest.trim(),
      boundarySouth: boundarySouth.trim(),
      areaSize: areaSize.trim(),
      nocDocumentUrl,
      nocDocumentName,
      issueDate,
      presidentSignatory: presidentSignatory || village.presidentName || 'LALTHANSANGA',
      qrCodeData: `https://mizoram.gov.in/verify/${encodeURIComponent(village.id)}/${encodeURIComponent(passNumber.trim())}`,
      notes: notes.trim(),
      createdBy: editingPass ? editingPass.createdBy : 'Admin Officer',
    };

    onSave(payload, !!editingPass, editingPass?.id);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-800 rounded-lg">
                <FileCheck2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {editingPass ? `Edit Land Pass (${village.villageName})` : `Issue New ${village.villageName} Land Pass`}
                </h3>
                <p className="text-xs text-emerald-200">
                  Official {village.villageName} Village Council / Court Land Registry ({village.districtName})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
            {/* Step 1: Pass Type Selection */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                1. Select Land Pass Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePassTypeChange('huan_ram')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                    passType === 'huan_ram'
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mt-0.5 border border-emerald-600 flex items-center justify-center bg-white">
                    {passType === 'huan_ram' && (
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 block">Huan Ram Pass</span>
                    <span className="text-xs text-neutral-600 block mt-0.5">
                      Agricultural / Plantation land. Serial starts: SPH/VC/HR/1001
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePassTypeChange('in_hmun')}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-start gap-3 transition ${
                    passType === 'in_hmun'
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-neutral-200 bg-white hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mt-0.5 border border-blue-600 flex items-center justify-center bg-white">
                    {passType === 'in_hmun' && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-blue-950 block">In Hmun Pass</span>
                    <span className="text-xs text-neutral-600 block mt-0.5">
                      Residential plot / House site. Serial starts: SPH/VC/IH/1001
                    </span>
                  </div>
                </button>
              </div>

              {/* Pass Number Field - STRICTLY AUTOMATIC SEQUENTIAL & NON-EDITABLE */}
              <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-neutral-700 font-semibold block">
                    Assigned Pass Number (Auto-Generated Sequential):
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    Fixed official serial assigned automatically from council records
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono font-bold text-emerald-950 bg-neutral-100 border border-neutral-300 rounded-lg px-3.5 py-1.5 text-sm flex items-center justify-between gap-3 shadow-2xs select-none">
                    <span className="text-base tracking-wider">{passNumber}</span>
                    <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-sans font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3 text-neutral-500" /> Auto Sequential
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Owner Information */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                2. Owner / Pass Holder Particulars
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Owner Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pu Lalremruata"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  {errors.ownerName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Father's / Mother's Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rochhunga (L)"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  {errors.parentName && (
                    <p className="text-xs text-rose-600 mt-1">{errors.parentName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Owner Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 94361 xxxxx"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  />
                  {errors.contactNumber && (
                    <p className="text-xs text-rose-600 mt-1">{errors.contactNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Location Coordination & Google Map Picker */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block">
                  3. Location &amp; Google Map Coordination
                </label>
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition self-start sm:self-auto shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  Open Google Map Picker
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    GPS Coordinates (Lat, Lng)
                  </label>
                  <input
                    type="text"
                    placeholder="24.2415, 92.9350"
                    value={locationCoordinates}
                    onChange={(e) => setLocationCoordinates(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Locality / Sub-Area Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vaphai Road Huan, Saiphai"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Area Extent / Dimension
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2.5 Bighas / 50x70 ft"
                    value={areaSize}
                    onChange={(e) => setAreaSize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Boundaries (North, East, West, South) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 block mb-2">
                4. Four Cardinal Boundaries (Ramri Ziahna) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    North (Hmar Lam Ri) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Sawrkar kawngpui leh lungphun lian inkar"
                    value={boundaryNorth}
                    onChange={(e) => setBoundaryNorth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                  {errors.boundaryNorth && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.boundaryNorth}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    East (Chhak Lam Ri) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Tlawng luite kam leh mau hmun pial"
                    value={boundaryEast}
                    onChange={(e) => setBoundaryEast(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                  {errors.boundaryEast && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.boundaryEast}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    West (Thlang Lam Ri) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Pi Thangkhumi huan leh thingpui hmun inriatna"
                    value={boundaryWest}
                    onChange={(e) => setBoundaryWest(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                  {errors.boundaryWest && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.boundaryWest}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    South (Chhim Lam Ri) *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Pu Vanlalhlua serthlum huan inriatna chin"
                    value={boundarySouth}
                    onChange={(e) => setBoundarySouth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
                  />
                  {errors.boundarySouth && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.boundarySouth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5: Photo Picker for NOC Document */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900 block mb-1">
                5. NOC Document Attachment (Photo Picker)
              </label>
              <p className="text-xs text-amber-700 mb-3">
                Upload scanned copy or photo of the Village Council No Objection Certificate (NOC)
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,.pdf"
                onChange={handleNocFileChange}
                className="hidden"
              />

              {nocDocumentUrl ? (
                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-amber-300">
                  <img
                    src={nocDocumentUrl}
                    alt="NOC Document Preview"
                    className="w-20 h-20 object-cover rounded-md border border-neutral-200 shrink-0"
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs font-bold text-neutral-800 block truncate">
                      {nocDocumentName || 'Attached NOC Document'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium block">
                      ✓ Ready for document archival
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearNoc}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove NOC Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white/70 hover:bg-white p-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition text-neutral-600"
                >
                  <div className="p-2 bg-amber-100 rounded-full text-amber-700">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-800">
                    Click to select NOC Document photo / scan
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Supports JPG, PNG (Max 2MB)
                  </span>
                </button>
              )}
            </div>

            {/* Step 6: Council Signatory & Issue Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-700 block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  President Name for Signature
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pu Lalthansanga"
                  value={presidentSignatory}
                  onChange={(e) => setPresidentSignatory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Input President name to appear on the official certificate signature line.
                </p>
              </div>
            </div>

            {/* Step 7: Remarks / Notes */}
            <div>
              <label className="text-xs font-medium text-neutral-700 block mb-1">
                Official Village Council Notes / Resolution Reference
              </label>
              <input
                type="text"
                placeholder="e.g. Approved under VC Meeting Resolution No. 04/2025"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                After saving, printable A4 certificate will be opened immediately.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg transition shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingPass ? 'Update Land Pass' : 'Save & Open Printable View'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Map Coordinate Picker Modal */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoordinates={locationCoordinates}
        onSelectCoordinates={(coords, hint) => {
          setLocationCoordinates(coords);
          if (hint && !locationAddress) {
            setLocationAddress(hint);
          }
        }}
      />
    </>
  );
};
