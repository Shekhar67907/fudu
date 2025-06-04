// Constants for prescription validation
export const PRESCRIPTION_RANGES = {
  SPH: { min: -20.00, max: 20.00, step: 0.25 },
  CYL: { min: -6.00, max: 6.00, step: 0.25 },
  AXIS: { min: 0, max: 180, step: 1 },
  ADD: { min: 0.75, max: 3.00, step: 0.25 },
  PD: { min: 25.00, max: 40.00, step: 0.5 }
} as const;

// Visual Acuity thresholds and mappings
export type VisualAcuityValue = string;

export const VA_THRESHOLDS: Record<string, VisualAcuityValue[]> = {
  NORMAL: ['6/6', '6/9', '20/20', '20/30'],
  SLIGHTLY_REDUCED: ['6/12', '6/18', '20/40', '20/60'],
  REDUCED: ['6/24', '6/36', '20/80', '20/120'],
  SEVERELY_REDUCED: ['6/60', '20/200']
};

export const VA_CONVERSION = {
  '6/6': '20/20',
  '6/9': '20/30',
  '6/12': '20/40',
  '6/18': '20/60',
  '6/24': '20/80',  
  '6/36': '20/120',
  '6/60': '20/200'
} as const;

// Alert thresholds
export const PRESCRIPTION_ALERTS = {
  HIGH_POWER: {
    SPH: { min: -6.00, max: 6.00 },
    CYL: { min: -2.50, max: 2.50 }
  }
} as const;

// Single prescription row data (DV or NV)
export interface PrescriptionData {
  sph: string;
  cyl: string;
  ax: string;
  add: string;
  vn: string;
  rpd?: string;
  lpd?: string;
  sphericalEquivalent?: string;  // Calculated value (SPH + CYL/2)
  age?: number;  // Added age property for visual acuity calculations
}

// Data for one eye
export interface EyeData {
  dv: PrescriptionData;
  nv: PrescriptionData;
}

export interface VisualAcuity {
  fraction: string;  // e.g., "6/6", "6/9", "20/20"
  equivalentValue?: string; // Alternative notation (e.g., "20/20" for "6/6")
  status: "Normal" | "Slightly reduced" | "Reduced" | "Severely reduced";
  decimalValue: number; // Decimal representation (e.g., 1.0 for 6/6)
  comparisonToExpected?: {
    difference: number;
    status: 'Better than expected' | 'As expected' | 'Worse than expected';
    recommendation?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface Option {
  label: string;
  value: string;
}

export interface SelectedItem {
  si: number;
  itemCode: string;
  itemName: string;
  unit: string;
  taxPercent: number;
  rate: number;
  amount: number;
  qty: number;
  discountAmount: number;
  discountPercent: number;
  brandName?: string;
  index?: string;
  coating?: string;
}

export interface PrescriptionFormData {
  // Database record identifier - set to true when data is loaded from database
  isFromDatabase?: boolean;
  
  prescriptionNo: string;
  referenceNo: string;
  class: string;
  prescribedBy: string;
  date: string;
  name: string;
  title: string;
  age: string;
  gender: string;
  customerCode: string;
  birthDay: string;
  marriageAnniversary: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  phoneLandline: string;
  mobileNo: string;
  email: string;
  ipd: string;
  rightEye: EyeData;
  leftEye: EyeData;
  balanceLens: boolean;
  remarks: {
    forConstantUse: boolean;
    forDistanceVisionOnly: boolean;
    forNearVisionOnly: boolean;
    separateGlasses: boolean;
    biFocalLenses: boolean;
    progressiveLenses: boolean;
    antiReflectionLenses: boolean;
    antiRadiationLenses: boolean;
    underCorrected: boolean;
  };
  retestAfter: string;
  others: string;
  status: string;
  bookingBy: string;
  namePrefix: string;
  billed: boolean;
  selectedItems: SelectedItem[];
  orderStatus: string;
  orderStatusDate: string;
  billNo: string;
  paymentEstimate: string;
  schAmt: string;
  advance: string;
  balance: string;
  cashAdv1: string;
  ccUpiAdv: string;
  chequeAdv: string;  // Keeping for backward compatibility
  advanceOther: string;  // New field to separate from chequeAdv
  taxAmount: string;  // New field specifically for tax amount
  cashAdv2: string;
  cashAdv2Date: string;
  applyDiscount: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  discountReason: string;
  manualEntryType: 'Frames' | 'Sun Glasses';
  manualEntryItemName: string;
  manualEntryRate: string;
  manualEntryQty: number;
  manualEntryItemAmount: number;
  currentDateTime: string;
  deliveryDateTime: string;
} 