// Define interfaces for form data
export interface ContactLensEyeData {
  sph: string;
  cyl: string;
  ax: string;
  add: string;
  vn: string;
  rpd?: string; // Right Pupillary Distance
  lpd?: string; // Left Pupillary Distance
  sphericalEquivalent?: string; // For calculated spherical equivalent
}

export interface ContactLensEyePrescription {
  dv: ContactLensEyeData;
  nv: ContactLensEyeData;
}

export interface ContactLensItem {
  si: number;
  bc: string;
  power: string;
  material: string;
  dispose: string;
  brand: string;
  qty: number;
  diameter: string;
  rate: number;
  discountPercent: number; // Primary property used in UI
  discountAmount: number; // Primary property used in UI
  // Allow database aliases as potential properties
  discount_percent?: number; // Database format
  discount_amount?: number; // Database format
  disc_percent?: number;    // Alternative database format
  disc_amount?: number;     // Alternative database format
  amount: number;
  lensCode: string;
  lens_code?: string;      // Alternative for database mapping
  side: 'Right' | 'Left' | 'Both';  // Direct representation matching database values
  sph: string;
  cyl: string;
  ax: string;
  axis?: string;           // Alternative for database mapping
  base_curve?: string;     // Alternative for database mapping
}

export interface ContactLensFormData {
  prescriptionNo: string;
  reference_no: string; // Changed from refNo to match database schema
  date: string;
  time: string;
  dvDate: string;
  dvTime: string;
  class: string;
  bookingBy: string;
  title: string;
  name: string;
  gender: 'Male' | 'Female';
  age: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  phoneLandline: string;
  mobile: string;
  email: string;
  customerCode: string;
  birthDay: string;
  marriageAnniversary: string;
  prescBy: string;
  billed: boolean;
  billNumber: string;
  rightEye: ContactLensEyePrescription;
  leftEye: ContactLensEyePrescription;
  ipd: string;
  balanceLens: boolean;
  contactLensItems: ContactLensItem[];
  remarks: string;
  orderStatus: 'Processing' | 'Ready' | 'Hand Over';
  orderStatusDate: string;
  retestAfter: string;
  expiryDate: string;
  payment: string;
  estimate: string;
  schAmt: string;
  advance: string;
  balance: string;
  cashAdv: string;
  ccUpiAdv: string;
  chequeAdv: string;
  cashAdv2: string;
  advDate: string;
  paymentMethod: string;
  sourceType: 'USER_INPUT' | 'DATABASE_VALUES' | 'INITIAL';
}
