// src/services/supabaseService.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrescriptionData } from '../types';

// Define TypeScript types for the database schema
type Database = {
  public: {
    Tables: {
      prescriptions: {
        Row: DatabasePrescription;
        Insert: Omit<DatabasePrescription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabasePrescription, 'id' | 'created_at'>>;
      };
      eye_prescriptions: {
        Row: DatabaseEyePrescription;
        Insert: Omit<DatabaseEyePrescription, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseEyePrescription, 'id' | 'created_at' | 'prescription_id'>>;
      };
      prescription_remarks: {
        Row: DatabaseRemarks;
        Insert: Omit<DatabaseRemarks, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseRemarks, 'id' | 'created_at' | 'prescription_id'>>;
      };
    };
    Functions: {
      upsert_prescription_remarks: {
        Args: {
          p_prescription_id: string;
          p_for_constant_use?: boolean;
          p_for_distance_vision_only?: boolean;
          p_for_near_vision_only?: boolean;
          p_separate_glasses?: boolean;
          p_bi_focal_lenses?: boolean;
          p_progressive_lenses?: boolean;
          p_anti_reflection_lenses?: boolean;
          p_anti_radiation_lenses?: boolean;
          p_under_corrected?: boolean;
        };
        Returns: DatabaseRemarks;
      };
    };
  };
};

type SupabaseClientType = SupabaseClient<Database>;

// Use a module-level variable to store the Supabase client instance
let supabaseInstance: SupabaseClientType | null = null;

// Debug environment variables
console.log('Environment variables:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'
});

// Initialize Supabase client
const initializeSupabase = (): SupabaseClientType => {
  // Return existing instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = 'Missing required Supabase environment variables. Please check your .env file.';
    console.error(errorMsg, {
      url: supabaseUrl ? '✓' : '✗',
      key: supabaseAnonKey ? '✓' : '✗'
    });
    throw new Error(errorMsg);
  }

  try {
    // Create a new instance of the Supabase client
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      },
      global: {
        headers: {
          'X-Supabase-Client': 'merijaan-app',
          // Force POST instead of PATCH for all operations to avoid CORS issues with localhost
          'Prefer': 'resolution=merge-duplicates,return=representation'
        }
      }
    });

    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw new Error('Failed to initialize Supabase client');
  }
};

// Initialize and export the Supabase client
const supabase = initializeSupabase();

// Test connection method
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { error } = await supabase.from('prescriptions').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test error:', error);
      throw error;
    }
    console.log('Supabase connection successful');
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to connect to Supabase' 
    };
  }
};

// Export the supabase client instance
export { supabase };

// Database Types
export interface DatabasePrescription {
  id?: string;
  prescription_no: string;
  reference_no?: string;
  class?: string;
  prescribed_by: string;
  date: string;
  name: string;
  title?: string;
  age?: string;
  gender?: string;
  customer_code?: string;
  birth_day?: string;
  marriage_anniversary?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  phone_landline?: string;
  mobile_no?: string;
  email?: string;
  ipd?: string;
  retest_after?: string;
  others?: string;
  balance_lens?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseEyePrescription {
  id?: string;
  prescription_id: string;
  eye_type: 'right' | 'left';
  vision_type: 'dv' | 'nv';
  sph?: string;
  cyl?: string;
  ax?: string;
  add_power?: string;
  vn?: string;
  rpd?: string;
  lpd?: string;
  spherical_equivalent?: string;
}

export interface DatabaseRemarks {
  id?: string;
  prescription_id: string;
  for_constant_use?: boolean;
  for_distance_vision_only?: boolean;
  for_near_vision_only?: boolean;
  separate_glasses?: boolean;
  bi_focal_lenses?: boolean;
  progressive_lenses?: boolean;
  anti_reflection_lenses?: boolean;
  anti_radiation_lenses?: boolean;
  under_corrected?: boolean;
}

// Helper function to convert database format to PrescriptionData format
function mapDatabaseToPrescriptionData(dbData: any): PrescriptionData | null {
  console.log('mapDatabaseToPrescriptionData - Raw dbData:', JSON.parse(JSON.stringify(dbData)));
  
  if (!dbData || !dbData.prescription) {
    console.log('No prescription data found in dbData');
    return null;
  }

  const prescription = dbData.prescription;
  const eyePrescriptions = dbData.eyePrescriptions || [];
  
  console.log('Raw remarks data from db:', {
    rawRemarks: dbData.remarks,
    isArray: Array.isArray(dbData.remarks),
    length: Array.isArray(dbData.remarks) ? dbData.remarks.length : 'N/A'
  });

  // Initialize with all false values first
  let remarks = {
    forConstantUse: false,
    forDistanceVisionOnly: false,
    forNearVisionOnly: false,
    separateGlasses: false,
    biFocalLenses: false,
    progressiveLenses: false,
    antiReflectionLenses: false,
    antiRadiationLenses: false,
    underCorrected: false
  };

  // Handle different formats of remarks data
  if (Array.isArray(dbData.remarks) && dbData.remarks.length > 0) {
    console.log('Processing remarks array:', dbData.remarks);
    // Take the first item if it's an array
    const remarkData = dbData.remarks[0];
    remarks = {
      forConstantUse: Boolean(remarkData.for_constant_use),
      forDistanceVisionOnly: Boolean(remarkData.for_distance_vision_only),
      forNearVisionOnly: Boolean(remarkData.for_near_vision_only),
      separateGlasses: Boolean(remarkData.separate_glasses),
      biFocalLenses: Boolean(remarkData.bi_focal_lenses),
      progressiveLenses: Boolean(remarkData.progressive_lenses),
      antiReflectionLenses: Boolean(remarkData.anti_reflection_lenses),
      antiRadiationLenses: Boolean(remarkData.anti_radiation_lenses),
      underCorrected: Boolean(remarkData.under_corrected)
    };
  } else if (dbData.remarks && typeof dbData.remarks === 'object') {
    console.log('Processing remarks object:', dbData.remarks);
    remarks = {
      forConstantUse: Boolean(dbData.remarks.for_constant_use),
      forDistanceVisionOnly: Boolean(dbData.remarks.for_distance_vision_only),
      forNearVisionOnly: Boolean(dbData.remarks.for_near_vision_only),
      separateGlasses: Boolean(dbData.remarks.separate_glasses),
      biFocalLenses: Boolean(dbData.remarks.bi_focal_lenses),
      progressiveLenses: Boolean(dbData.remarks.progressive_lenses),
      antiReflectionLenses: Boolean(dbData.remarks.anti_reflection_lenses),
      antiRadiationLenses: Boolean(dbData.remarks.anti_radiation_lenses),
      underCorrected: Boolean(dbData.remarks.under_corrected)
    };
  }

  console.log('Processed remarks:', remarks);

  // Helper to find raw eye data
  const findRawEyeData = (eye: 'right' | 'left', type: 'dv' | 'nv') => {
    return eyePrescriptions.find((ep: any) => ep.eye_type === eye && ep.vision_type === type);
  };

  const rightDvData = findRawEyeData('right', 'dv');
  const rightNvData = findRawEyeData('right', 'nv');
  const leftDvData = findRawEyeData('left', 'dv');
  const leftNvData = findRawEyeData('left', 'nv');

  return {
    prescriptionNo: prescription.prescription_no || '',
    referenceNo: prescription.reference_no || '',
    class: prescription.class || '',
    prescribedBy: prescription.prescribed_by || '',
    date: prescription.date || '',
    name: prescription.name || '',
    title: prescription.title || '',
    age: String(prescription.age || ''),
    gender: prescription.gender || 'Male',
    customerCode: prescription.customer_code || '',
    birthDay: prescription.birth_day || '',
    marriageAnniversary: prescription.marriage_anniversary || '',
    address: prescription.address || '',
    city: prescription.city || '',
    state: prescription.state || '',
    pinCode: prescription.pin_code || '',
    phoneLandline: prescription.phone_landline || '',
    mobileNo: prescription.mobile_no || '',
    email: prescription.email || '',
    ipd: String(prescription.ipd || ''),
    rightEye: {
      dv: {
        sph: String(rightDvData?.sph || ''),
        cyl: String(rightDvData?.cyl || ''),
        ax: String(rightDvData?.ax || ''),
        add: String(rightDvData?.add_power || ''),
        vn: rightDvData?.vn || '',
        rpd: String(rightDvData?.rpd || ''),
      },
      nv: {
        sph: String(rightNvData?.sph || ''),
        cyl: String(rightNvData?.cyl || ''),
        ax: String(rightNvData?.ax || ''),
        add: String(rightNvData?.add_power || ''),
        vn: rightNvData?.vn || '',
      }
    },
    leftEye: {
      dv: {
        sph: String(leftDvData?.sph || ''),
        cyl: String(leftDvData?.cyl || ''),
        ax: String(leftDvData?.ax || ''),
        add: String(leftDvData?.add_power || ''),
        vn: leftDvData?.vn || '',
        lpd: String(leftDvData?.lpd || ''),
      },
      nv: {
        sph: String(leftNvData?.sph || ''),
        cyl: String(leftNvData?.cyl || ''),
        ax: String(leftNvData?.ax || ''),
        add: String(leftNvData?.add_power || ''),
        vn: leftNvData?.vn || '',
      }
    },
    remarks,
    retestAfter: prescription.retest_after || '',
    others: prescription.others || '',
    balanceLens: prescription.balance_lens || false,
    id: prescription.id
  };
}

class PrescriptionService {
  // Validate prescription data before saving
  private validatePrescriptionData(data: PrescriptionData): { isValid: boolean; error?: string } {
    if (!data.prescriptionNo) {
      return { isValid: false, error: 'Prescription number is required' };
    }
    if (!data.name) {
      return { isValid: false, error: 'Patient name is required' };
    }
    if (!data.prescribedBy) {
      return { isValid: false, error: 'Prescribed by is required' };
    }
    return { isValid: true };
  }

  // Auto-save prescription with all related data
  async autoSavePrescription(data: PrescriptionData, prescriptionId?: string) {
    try {
      console.log('supabaseService: autoSavePrescription triggered', { data, prescriptionId });
      
      // Validate input data
      const validation = this.validatePrescriptionData(data);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      let prescriptionDataResult;
      
      const prescriptionToSave: Partial<DatabasePrescription> = {
        prescription_no: data.prescriptionNo,
        reference_no: data.referenceNo,
        class: data.class,
        prescribed_by: data.prescribedBy,
        date: data.date || new Date().toISOString().split('T')[0],
        name: data.name,
        title: data.title,
        age: data.age,
        gender: data.gender,
        customer_code: data.customerCode,
        birth_day: data.birthDay || undefined,
        marriage_anniversary: data.marriageAnniversary || undefined,
        address: data.address,
        city: data.city,
        state: data.state,
        pin_code: data.pinCode,
        phone_landline: data.phoneLandline,
        mobile_no: data.mobileNo,
        email: data.email,
        ipd: data.ipd,
        retest_after: data.retestAfter || undefined,
        others: data.others,
        balance_lens: data.balanceLens,
      };

      if (prescriptionId) {
        // Update existing prescription using upsert instead of update to avoid CORS PATCH issues
         const { data: updatedPrescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .upsert({ 
            id: prescriptionId, // Include id for upsert to work
            ...prescriptionToSave, 
            updated_at: new Date().toISOString() 
          })
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionDataResult = updatedPrescription;
      } else {
        // Create new prescription
         const { data: newPrescription, error: prescriptionError } = await supabase
          .from('prescriptions')
          .insert({ ...prescriptionToSave, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .select()
          .single();

        if (prescriptionError) throw prescriptionError;
        prescriptionDataResult = newPrescription;
      }

      // Save eye prescriptions
      const eyePrescriptionsToSave = [
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'right',
          vision_type: 'dv',
          sph: data.rightEye.dv.sph,
          cyl: data.rightEye.dv.cyl,
          ax: data.rightEye.dv.ax,
          add_power: data.rightEye.dv.add,
          vn: data.rightEye.dv.vn,
          rpd: data.rightEye.dv.rpd,
          spherical_equivalent: (parseFloat(data.rightEye.dv.sph || '0') + parseFloat(data.rightEye.dv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'right',
          vision_type: 'nv',
          sph: data.rightEye.nv.sph,
          cyl: data.rightEye.nv.cyl,
          ax: data.rightEye.nv.ax,
          add_power: data.rightEye.nv.add,
          vn: data.rightEye.nv.vn,
          spherical_equivalent: (parseFloat(data.rightEye.nv.sph || '0') + parseFloat(data.rightEye.nv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'left',
          vision_type: 'dv',
          sph: data.leftEye.dv.sph,
          cyl: data.leftEye.dv.cyl,
          ax: data.leftEye.dv.ax,
          add_power: data.leftEye.dv.add,
          vn: data.leftEye.dv.vn,
          lpd: data.leftEye.dv.lpd,
          spherical_equivalent: (parseFloat(data.leftEye.dv.sph || '0') + parseFloat(data.leftEye.dv.cyl || '0') / 2).toFixed(2)
        },
        {
          prescription_id: prescriptionDataResult.id,
          eye_type: 'left',
          vision_type: 'nv',
          sph: data.leftEye.nv.sph,
          cyl: data.leftEye.nv.cyl,
          ax: data.leftEye.nv.ax,
          add_power: data.leftEye.nv.add,
          vn: data.leftEye.nv.vn,
          spherical_equivalent: (parseFloat(data.leftEye.nv.sph || '0') + parseFloat(data.leftEye.nv.cyl || '0') / 2).toFixed(2)
        }
      ].filter(ep => ep.sph || ep.cyl || ep.ax || ep.add_power || ep.vn || ep.rpd || ep.lpd);

      // Delete existing eye prescriptions if updating
      if (prescriptionId) {
        const { error: deleteError } = await supabase
          .from('eye_prescriptions')
          .delete()
          .eq('prescription_id', prescriptionId);

        if (deleteError) throw deleteError;
      }

      // Insert new eye prescriptions if there are any to save
      if (eyePrescriptionsToSave.length > 0) {
        const { error: eyeError } = await supabase
          .from('eye_prescriptions')
          .insert(eyePrescriptionsToSave as any);

        if (eyeError) throw eyeError;
      }

      try {
        // Save or update remarks using the savePrescriptionRemarks method
        console.log('Saving remarks for prescription:', prescriptionDataResult.id);
        
        if (data.remarks) {
          const savedRemarks = await this.savePrescriptionRemarks(data.remarks, prescriptionDataResult.id);
          console.log('Successfully saved remarks:', savedRemarks);
        } else {
          console.log('No remarks to save');
        }
      } catch (error) {
        console.error('Error in remarks processing:', error);
        throw new Error(`Remarks processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: true,
        data: {
          id: prescriptionDataResult.id,
          ...prescriptionDataResult
        }
      };
    } catch (error) {
      console.error('Error auto-saving prescription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-save failed'
      };
    }
  }

  // Save prescription remarks
  async savePrescriptionRemarks(remarks: any, prescriptionId: string) {
    try {
      console.log('Saving prescription remarks:', { remarks, prescriptionId });
      
      // Use the stored procedure to upsert remarks
      const { data, error } = await supabase.rpc('upsert_prescription_remarks', {
        p_prescription_id: prescriptionId,
        p_for_constant_use: remarks?.forConstantUse || false,
        p_for_distance_vision_only: remarks?.forDistanceVisionOnly || false,
        p_for_near_vision_only: remarks?.forNearVisionOnly || false,
        p_separate_glasses: remarks?.separateGlasses || false,
        p_bi_focal_lenses: remarks?.biFocalLenses || false,
        p_progressive_lenses: remarks?.progressiveLenses || false,
        p_anti_reflection_lenses: remarks?.antiReflectionLenses || false,
        p_anti_radiation_lenses: remarks?.antiRadiationLenses || false,
        p_under_corrected: remarks?.underCorrected || false
      });
      
      if (error) {
        console.error('Error saving prescription remarks:', error);
        throw error;
      }

      console.log('Successfully saved prescription remarks:', data);
      return data;
    } catch (error) {
      console.error('Error in savePrescriptionRemarks:', error);
      throw error;
    }
  }

  // Get prescription by ID with all related data
  async getPrescription(prescriptionId: string): Promise<PrescriptionData | null> {
    try {
      console.log(`[getPrescription] Fetching prescription with ID: ${prescriptionId}`);
      
      // First, get the base prescription data
      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', prescriptionId)
        .single();

      if (prescriptionError) {
        console.error('[getPrescription] Error fetching prescription:', prescriptionError);
        return null;
      }

      if (!prescriptionData) {
        console.log('[getPrescription] No prescription found with ID:', prescriptionId);
        return null;
      }

      // Then get the eye prescriptions
      const { data: eyePrescriptions, error: eyeError } = await supabase
        .from('eye_prescriptions')
        .select('*')
        .eq('prescription_id', prescriptionId);

      if (eyeError) {
        console.error('[getPrescription] Error fetching eye prescriptions:', eyeError);
        // Continue even if there's an error with eye prescriptions
      }

      // Then get the remarks
      const { data: remarksData, error: remarksError } = await supabase
        .from('prescription_remarks')
        .select('*')
        .eq('prescription_id', prescriptionId);

      if (remarksError) {
        console.error('[getPrescription] Error fetching remarks:', remarksError);
        // Continue even if there's an error with remarks
      }

      console.log('[getPrescription] Data fetched:', {
        prescription: prescriptionData,
        eyePrescriptions: eyePrescriptions || [],
        remarks: remarksData || []
      });

      // Transform the data to match PrescriptionData interface
      const result = mapDatabaseToPrescriptionData({
        prescription: prescriptionData,
        eyePrescriptions: eyePrescriptions || [],
        remarks: Array.isArray(remarksData) && remarksData.length > 0 ? remarksData[0] : {}
      });

      console.log('[getPrescription] Mapped result:', result);
      return result;
    } catch (error) {
      console.error('[getPrescription] Error in getPrescription:', error);
      return null;
    }
  }

  // Search prescriptions by number (Prescription No. or Reference No.)
  async searchPrescriptionsByNumber(searchQuery: string) {
    try {
      console.log('[searchPrescriptionsByNumber] Starting search with query:', searchQuery);
      
      // Escape special characters in the search query for LIKE pattern matching
      const escapedQuery = searchQuery.replace(/[_%]/g, '\$&');

      const { data, error } = await supabase
        .from('prescriptions')
        .select(
          `
          *,
          eye_prescriptions (*),
          prescription_remarks (*)
        `
        )
        .or(`prescription_no.ilike.%${escapedQuery}%,reference_no.ilike.%${escapedQuery}%`)
        .limit(1); // Limit to 1 since prescription_no is unique

      if (error) {
        console.error('[searchPrescriptionsByNumber] Supabase query error:', error);
        throw error;
      }

      console.log('[searchPrescriptionsByNumber] Raw data from Supabase:', JSON.stringify(data, null, 2));

      if (data && data.length > 0) {
        console.log('[searchPrescriptionsByNumber] Found prescription:', {
          prescriptionNo: data[0].prescription_no,
          remarks: data[0].prescription_remarks
        });

        // Format the data to ensure prescription_remarks is always an array with at least one item
        const formattedPrescription = {
          ...data[0],
          prescription_remarks: Array.isArray(data[0].prescription_remarks) && data[0].prescription_remarks.length > 0 
            ? data[0].prescription_remarks 
            : [{
                for_constant_use: false,
                for_distance_vision_only: false,
                for_near_vision_only: false,
                separate_glasses: false,
                bi_focal_lenses: false,
                progressive_lenses: false,
                anti_reflection_lenses: false,
                anti_radiation_lenses: false,
                under_corrected: false
              }]
        };

        console.log('[searchPrescriptionsByNumber] Formatted prescription:', {
          prescriptionNo: formattedPrescription.prescription_no,
          remarks: formattedPrescription.prescription_remarks
        });

        const formattedData = mapDatabaseToPrescriptionData({
          prescription: formattedPrescription,
          eyePrescriptions: formattedPrescription.eye_prescriptions || [],
          remarks: formattedPrescription.prescription_remarks?.[0] || {}
        });

        console.log('[searchPrescriptionsByNumber] Final formatted data:', {
          prescriptionNo: formattedData?.prescriptionNo,
          remarks: formattedData?.remarks
        });
        
        return { success: true, data: formattedData };
      } else {
        console.log('[searchPrescriptionsByNumber] No prescription found');
        return { success: true, data: null, message: 'No prescription found' };
      }
    } catch (error) {
      console.error('[searchPrescriptionsByNumber] Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Search failed' };
    }
  }

  // Search prescriptions
  async searchPrescriptions(searchQuery: string) {
    try {
      console.log('[searchPrescriptions] Starting search with query:', searchQuery);

      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_remarks(*)
        `)
        .or(`name.ilike.%${searchQuery}%,prescription_no.ilike.%${searchQuery}%,mobile_no.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[searchPrescriptions] Supabase query error:', error);
        throw error;
      }

      console.log('[searchPrescriptions] Raw data from Supabase:', JSON.stringify(data, null, 2));
      
      if (!data) {
        console.log('[searchPrescriptions] No data returned');
        return [];
      }
      
      // Format the data to ensure prescription_remarks is always an array with at least one item
      const formattedData = data.map(prescription => {
        console.log('[searchPrescriptions] Processing prescription:', {
          prescriptionNo: prescription.prescription_no,
          remarks: prescription.prescription_remarks
        });

        const formatted = {
          ...prescription,
          prescription_remarks: Array.isArray(prescription.prescription_remarks) && prescription.prescription_remarks.length > 0 
            ? prescription.prescription_remarks 
            : [{
                for_constant_use: false,
                for_distance_vision_only: false,
                for_near_vision_only: false,
                separate_glasses: false,
                bi_focal_lenses: false,
                progressive_lenses: false,
                anti_reflection_lenses: false,
                anti_radiation_lenses: false,
                under_corrected: false
              }]
        };

        console.log('[searchPrescriptions] Formatted prescription:', {
          prescriptionNo: formatted.prescription_no,
          remarks: formatted.prescription_remarks
        });

        return formatted;
      });
      
      // Map the data to PrescriptionData format
      const result = formattedData.map(prescription => {
        const mapped = mapDatabaseToPrescriptionData({
          prescription,
          eyePrescriptions: [],
          remarks: prescription.prescription_remarks?.[0] || {}
        });

        console.log('[searchPrescriptions] Mapped prescription:', {
          prescriptionNo: mapped?.prescriptionNo,
          remarks: mapped?.remarks
        });

        return mapped;
      });

      return result;
    } catch (error) {
      console.error('[searchPrescriptions] Error:', error);
      return [];
    }
  }
}

// Create a singleton instance of the PrescriptionService
const prescriptionService = new PrescriptionService();

export { prescriptionService };