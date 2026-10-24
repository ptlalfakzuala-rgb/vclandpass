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
  startingPassNumber?: number; // Starting Land Pass sequence number (e.g. 1001 or 1)
  startingHuanRamNumber?: number; // Starting sequence for Huan Ram
  startingInHmunNumber?: number;  // Starting sequence for In Hmun
  logoUrl?: string; // Base64 or image URL of Village Council Logo (170x170 px)
  emblemLogoUrl?: string; // Base64 or image URL for State / Official Emblem in Print View
  conditionsAndTerms: string; // Customizable per village
  presidentName: string;
  secretaryName?: string;
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
    | 'AUTHORITY_ELEVATION';
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
