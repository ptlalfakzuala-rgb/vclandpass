export type PassType = 'huan_ram' | 'in_hmun';

export interface VillageConfig {
  id: string;
  villageName: string;
  blockName: string;
  districtName: string;
  stateName: string;
  pinCode: string;
  huanRamPrefix: string; // e.g. "MZ-05-SPH-HR-" or "SPH/VC/HR/"
  inHmunPrefix: string;  // e.g. "MZ-05-SPH-IH-" or "SPH/VC/IH/"
  familyIdPrefix?: string; // e.g. "SPH-FAM-"
  taxInvoicePrefix?: string; // e.g. "PTMS-SPH-"
  startingPassNumber?: number; // Starting Land Pass sequence number (e.g. 1001 or 1)
  startingHuanRamNumber?: number; // Starting sequence for Huan Ram
  startingInHmunNumber?: number;  // Starting sequence for In Hmun
  startingFamilyNumber?: number;  // Starting sequence for Family ID (e.g. 1 or 1001)
  startingTaxInvoiceNumber?: number; // Starting sequence for Tax Invoices
  defaultPropertyTaxRate?: number; // Base rate per sq ft or flat per property
  defaultSanitationFee?: number;   // Village sanitation cess
  logoUrl?: string; // Base64 or image URL of Village Council Logo (170x170 px)
  emblemLogoUrl?: string; // Base64 or image URL for State / Official Emblem in Print View
  conditionsAndTerms: string; // Customizable per village
  presidentName: string;
  secretaryName?: string;
  isConfigured?: boolean;
  updatedAt?: string;
}

export interface LandPass {
  id: string;
  passNumber: string;
  passType: PassType;
  villageId: string;
  villageName: string;
  ownerName: string;
  parentName: string; // Father's or Mother's name
  contactNumber: string;
  locationCoordinates: string; // "lat,lng"
  locationAddress: string;
  boundaryNorth: string;
  boundaryEast: string;
  boundaryWest: string;
  boundarySouth: string;
  areaSize: string; // e.g. "2 Bighas", "1.5 Hectares", "60x80 ft"
  nocDocumentUrl?: string; // Base64 or image URL
  nocDocumentName?: string;
  issueDate: string; // YYYY-MM-DD
  presidentSignatory?: string;
  secretarySignatory?: string;
  qrCodeData?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  syncedToCloud?: boolean;
  approvalStatus?: 'live' | 'pending_approval';
  approvedAt?: string;
  approvedBy?: string;
}

export interface AuditLog {
  id: string;
  action:
    | 'CREATE_PASS'
    | 'UPDATE_PASS'
    | 'DELETE_PASS'
    | 'PRINT_PASS'
    | 'ADMIN_ELEVATION'
    | 'QR_VERIFIED'
    | 'ROLE_CHANGE'
    | 'VILLAGE_PROFILE_UPDATE'
    | 'SECRETARY_REGISTERED_PAYMENT'
    | 'USER_REGISTRATION_SUBMITTED'
    | 'USER_REGISTRATION_APPROVED'
    | 'USER_REGISTRATION_REJECTED'
    | 'USER_PROFILE_UPDATED'
    | 'PASS_APPROVED_LIVE'
    | 'AUTHORITY_ELEVATION'
    | 'USER_DELETED'
    | 'CREATE_HOUSEHOLD'
    | 'UPDATE_HOUSEHOLD'
    | 'DELETE_HOUSEHOLD'
    | 'CREATE_TAX_RECORD'
    | 'UPDATE_TAX_RECORD'
    | 'RECORD_TAX_PAYMENT'
    | 'DELETE_TAX_RECORD';
  targetId: string;
  targetName: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export type UserType = 'secretary' | 'citizen';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  username?: string;
  email: string | null;
  phoneNumber?: string | null;
  displayName: string | null;
  userType: UserType;
  role: 'admin' | 'member';
  status: UserStatus;
  isLifetimeApproved?: boolean;
  villageId?: string;
  villageName?: string;
  passkey?: string;
  password?: string;
  profilePhotoUrl?: string;
  paymentStatus?: 'completed' | 'none';
  paymentRef?: string;
  paymentAmount?: number;
  upiProvider?: string;
  paymentScreenshotUrl?: string;
  paymentScreenshotName?: string;
  registrationDate?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type PrintTheme = 'classic_heritage' | 'royal_official' | 'modern_government' | 'parchment_ivory';
export type FontStyle = 'serif' | 'sans' | 'slab';

export interface PrintSettings {
  theme: PrintTheme;
  fontStyle: FontStyle;
  showWatermark: boolean;
  borderStyle: 'double' | 'solid' | 'ornate';
  fontSize: 'standard' | 'compact' | 'large';
}

export type SyncStatus = 'online' | 'offline' | 'syncing';

// =========================================================================
// PROPERTY TAX MANAGEMENT SYSTEM (PTMS) & FAMILY ID TYPES
// =========================================================================

export type PropertyCategory = 'residential' | 'commercial' | 'agricultural_huan' | 'vacant_plot' | 'mixed_use';
export type AssessmentStatus = 'assessed' | 'exempted' | 'under_review';
export type TaxPaymentStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface FamilyMember {
  id: string;
  fullName: string;
  relationToHead: 'Self (Head)' | 'Spouse' | 'Son' | 'Daughter' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Other';
  gender: 'Male' | 'Female' | 'Other';
  age?: number;
  occupation?: string;
  contactNumber?: string;
}

export interface HouseholdFamily {
  id: string; // e.g., FAM_SPH_001
  familyId: string; // Unique council serial ID, e.g. "SPH-FAM-0001" or "MZ-KOL-FAM-010"
  villageId: string;
  villageName: string;
  headOfFamily: string; // Head of household name
  headParentName: string; // Father / Mother name
  contactNumber: string;
  vengSection: string; // Veng / Section / Locality in the village
  houseNumber?: string; // House / Plot number
  rationCardNumber?: string; // Optional Mizo ration card / Aadhar
  totalMembers: number;
  members: FamilyMember[];
  annualIncomeRange?: string; // e.g. '< 1 Lakh', '1 - 3 Lakh', '3 - 5 Lakh', '> 5 Lakh'
  economicStatus?: 'APL' | 'BPL' | 'AAY';
  linkedLandPassIds: string[]; // Land passes linked to this family
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncedToCloud?: boolean;
}

export interface PropertyTaxRecord {
  id: string; // e.g., TAX_2025_001
  taxInvoiceNumber: string; // e.g. "PTMS-SPH-2025-0001"
  taxYear: string; // e.g. "2025-2026" or "2025"
  villageId: string;
  villageName: string;
  familyId: string; // Linked Household Family ID (e.g. SPH-FAM-0001)
  householdHeadName: string;
  contactNumber: string;
  vengSection: string;
  houseOrPlotNo?: string;
  linkedLandPassId?: string; // Optional linked Huan Ram / In Hmun pass
  linkedPassNumber?: string;
  propertyCategory: PropertyCategory;
  assessmentStatus: AssessmentStatus;
  
  // Tax assessment details
  landAreaSqFt?: number;
  builtUpAreaSqFt?: number;
  baseRatePerSqFt?: number; // Base council property tax assessment rate
  annualAssessedValue: number; // In Rupees (₹)
  totalTaxDue: number; // Total annual tax calculated in ₹
  garbageOrSanitationFee?: number; // Sanitation / garbage collection cess
  waterOrCivicFee?: number; // Village lighting or water maintenance fee
  totalPayableAmount: number; // Final payable = totalTaxDue + sanitation + civic

  // Payment information
  paymentStatus: TaxPaymentStatus;
  amountPaid: number;
  balanceDue: number;
  paidDate?: string;
  paymentMode?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  paymentReference?: string;
  receiptNumber?: string;
  receiptIssuedBy?: string;

  dueDate: string; // Payment deadline
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  syncedToCloud?: boolean;
}
