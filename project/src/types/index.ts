export interface PrescriptionData {
  id?: string;
  prescriptionNo: string;
  referenceNo: string;
  class: string;
  prescribedBy: string;
  date: string;
  name: string;
  title: string;
  age: string;
  gender: 'Male' | 'Female';
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
  rightEye: {
    dv: {
      sph: string;
      cyl: string;
      ax: string;
      add: string;
      vn: string;
      rpd: string;
    };
    nv: {
      sph: string;
      cyl: string;
      ax: string;
      add: string;
      vn: string;
    };
  };
  leftEye: {
    dv: {
      sph: string;
      cyl: string;
      ax: string;
      add: string;
      vn: string;
      lpd: string;
    };
    nv: {
      sph: string;
      cyl: string;
      ax: string;
      add: string;
      vn: string;
    };
  };
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
  balanceLens: boolean;
}

export interface Option {
  label: string;
  value: string;
}