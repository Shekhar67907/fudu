// src/Services/contactLensService.ts
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not defined. Please check your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a unique contact lens prescription number with prefix CL-YYYYMMDD-XXX
export const generateContactLensPrescriptionNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `CL-${year}${month}${day}-${random}`;
};

interface ContactLensEye {
  eye_side: string;
  sph?: string;
  cyl?: string;
  axis?: string;
  add_power?: string;
  vn?: string;
  rpd?: string;
  lpd?: string;
  ipd?: string; // Adding IPD field for distance between pupils
}

interface ContactLensItem {
  // Database fields (snake_case)
  eye_side: string;
  base_curve?: string;
  power?: string;
  material?: string;
  dispose?: string;
  brand?: string;
  diameter?: string;
  quantity?: number;
  rate?: number;
  discount_percent?: number;
  discount_amount?: number;
  final_amount?: number;
  sph?: string;
  cyl?: string;
  axis?: string;
  lens_code?: string;
  
  // UI fields (camelCase) - added to support fields from the UI
  discountPercent?: number;
  discountAmount?: number;
  amount?: number; // UI equivalent of final_amount
}

interface ContactLensPayment {
  // Direct mapping fields (matching UI fields exactly)
  payment_total?: number;      // Maps to UI's Total field
  estimate?: number;          // Maps to UI's Estimate field
  advance?: number;           // Maps to UI's Advance field
  balance?: number;           // Maps to UI's Balance field
  
  // Payment method
  payment_mode?: string;      // Cash, Card, UPI, Cheque
  
  // Individual advance amounts
  cash_advance?: number;
  card_upi_advance?: number;
  cheque_advance?: number;
  
  // Discount information
  discount_amount?: number;   // Amount of discount
  discount_percent?: number;  // Percentage of discount
  scheme_discount?: boolean;  // Whether this is a scheme discount
  
  // Dates
  payment_date?: string;
}

interface ContactLensPrescription {
  prescription_id?: string;
  booked_by?: string;
  delivery_date?: string;
  delivery_time?: string;
  status?: string;
  retest_date?: string;
  expiry_date?: string;
  remarks?: string;
  reference_no?: string; // Changed from ref_no to match the database schema
  customer_code?: string;
  birth_day?: string;
  marriage_anniversary?: string;
  pin?: string;
  phone_landline?: string;
  prescribed_by?: string;
  name?: string;
  gender?: string;
  age?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface ContactLensData {
  prescription: ContactLensPrescription;
  eyes: ContactLensEye[];
  items: ContactLensItem[];
  payment: ContactLensPayment;
}

/**
 * Service functions for handling contact lens prescriptions
 * This includes saving and retrieving data across the following tables:
 * - contact_lens_prescriptions
 * - contact_lens_eyes
 * - contact_lens_items
 * - contact_lens_payments
 */

/**
 * Save contact lens prescription data to Supabase
 * This handles inserting data into all four contact lens tables:
 * - contact_lens_prescriptions
 * - contact_lens_eyes
 * - contact_lens_items
 * - contact_lens_payments
 */
// Helper function to get or create a prescription record for Contact Lens
const createMainPrescription = async (contactLensData: ContactLensData): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    const { prescription } = contactLensData;
    const mobileNumber = prescription.mobile || null; // Get mobile number


    // 1. Try to find an existing ContactLens prescription for this mobile_no
    if (mobileNumber && mobileNumber.trim() !== '') {
      try {
        // First check if there's a ContactLens prescription with this mobile number
        const { data: contactLensPrescription, error: clFindError } = await supabase
          .from('prescriptions')
          .select('id')
          .eq('mobile_no', mobileNumber)
          .eq('source', 'ContactLens')
          .maybeSingle();

        if (contactLensPrescription?.id) {
          // Found existing ContactLens prescription - reuse it
          console.log('Found existing ContactLens prescription with ID:', contactLensPrescription.id);
          return {
            success: true,
            message: 'Main ContactLens prescription record found and reused.',
            id: contactLensPrescription.id
          };
        }

        if (clFindError) {
          console.warn('Error checking for existing ContactLens prescription:', clFindError.message);
        }

        // Check if there's any prescription with this mobile number (regardless of source)
        const { data: anyPrescription, error: anyFindError } = await supabase
          .from('prescriptions')
          .select('id, source')
          .eq('mobile_no', mobileNumber)
          .maybeSingle();

        if (anyFindError) {
          console.warn('Error checking for any existing prescription:', anyFindError.message);
        }

        if (anyPrescription) {
          console.log(`Found existing prescription with mobile ${mobileNumber} and source: ${anyPrescription.source}`);
          // We'll continue to create a new ContactLens prescription with the same mobile number
          // The unique constraint on (mobile_no, source) will allow this
        }
      } catch (error) {
        console.error('Error in prescription lookup:', error);
        // Continue with creation if there was an error in lookup
      }
    }

    // 2. If no existing ContactLens prescription found (or mobile_no was blank/find failed), create a new one
    const prescriptionNo = prescription.prescription_id || generateContactLensPrescriptionNo();
    const referenceNo = prescriptionNo; // Standard practice, can be same as prescription_no

    const insertPayload = {
      prescription_no: prescriptionNo,
      reference_no: referenceNo,
      name: prescription.name || 'Customer',
      gender: prescription.gender || 'Male',
      age: prescription.age || null,
      mobile_no: mobileNumber,
      email: prescription.email || null,
      address: prescription.address || null,
      city: prescription.city || null,
      state: prescription.state || null,
      pin_code: prescription.pin || null,
      customer_code: prescription.customer_code || null,
      birth_day: prescription.birth_day || null,
      marriage_anniversary: prescription.marriage_anniversary || null,
      phone_landline: prescription.phone_landline || null,
      prescribed_by: prescription.prescribed_by || 'Contact Lens Dept',
      date: new Date().toISOString().split('T')[0],
      others: prescription.remarks || null,
      source: 'ContactLens' // CRITICAL: Set the source for ContactLens
    };
    
    const { data: newPrescription, error: insertError } = await supabase
      .from('prescriptions')
      .insert(insertPayload)
      .select('id') // Only select the ID for efficiency
      .single();

    if (insertError) {
      console.error('Error creating new main prescription:', insertError.message);
      return {
        success: false,
        message: `Error creating main prescription: ${insertError.message}`
      };
    }

    if (!newPrescription || !newPrescription.id) {
      console.error('Failed to create main prescription: No ID returned after insert.');
      return {
        success: false,
        message: 'Failed to create main prescription: No ID returned after insert.'
      };
    }

    console.log('Created new main prescription with ID:', newPrescription.id);
    return {
      success: true,
      message: 'Main prescription created successfully',
      id: newPrescription.id
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during main prescription creation';
    console.error('Error in createMainPrescription catch block:', errorMessage);
    return {
      success: false,
      message: `Error creating main prescription: ${errorMessage}`
    };
  }
};

// Export the function in the service object at the end of file

export const saveContactLensPrescription = async (data: ContactLensData): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    const { prescription } = data;
    console.log('Saving contact lens prescription for prescription number:', prescription.prescription_id);
    
    let prescriptionUuid: string;
    
    // Always use createMainPrescription which handles the find-or-create logic
    // This ensures we properly handle the source field and mobile number uniqueness
    console.log('Creating/updating main prescription...');
    const createResult = await createMainPrescription(data);
    
    if (!createResult.success || !createResult.id) {
      return createResult; // Return the error from createMainPrescription
    }
    
    prescriptionUuid = createResult.id;
    console.log('Main prescription processed with UUID:', prescriptionUuid);
    
    // Check if a contact lens prescription already exists for this prescription ID
    console.log('Checking if contact lens prescription already exists...');
    const { data: existingContactLens, error: existingCheckError } = await supabase
      .from('contact_lens_prescriptions')
      .select('id')
      .eq('prescription_id', prescriptionUuid)
      .maybeSingle();
      
    if (existingCheckError) {
      console.error('Error checking existing contact lens prescription:', existingCheckError);
      return { success: false, message: `Error checking existing data: ${existingCheckError.message}` };
    }
    
    // If contact lens prescription already exists, update it instead of creating a new one
    if (existingContactLens) {
      console.log('Contact lens prescription already exists with ID:', existingContactLens.id);
      console.log('Updating existing contact lens prescription instead of creating new one...');
      return await updateContactLensPrescription(existingContactLens.id, data);
    }
    
    // If no existing contact lens prescription, create a new one
    console.log('No existing contact lens prescription found. Creating new record...');
    
    // 1. First, insert or update the main contact lens prescription record using UPSERT
    const { data: contactLensPrescription, error: prescriptionError } = await supabase
      .from('contact_lens_prescriptions')
      .upsert({
        prescription_id: prescriptionUuid,
        booked_by: prescription.booked_by,
        delivery_date: prescription.delivery_date || null,
        delivery_time: prescription.delivery_time || null,
        status: prescription.status || 'Processing',
        retest_date: prescription.retest_date || null,
        expiry_date: prescription.expiry_date || null,
        remarks: prescription.remarks || null,
        
        // Add the new fields that were previously missing in the database
        reference_no: prescription.reference_no || null,
        customer_code: prescription.customer_code || null,
        birth_day: prescription.birth_day || null,
        marriage_anniversary: prescription.marriage_anniversary || null,
        pin: prescription.pin || null,
        phone_landline: prescription.phone_landline || null,
        prescribed_by: prescription.prescribed_by || null
      }, { onConflict: 'prescription_id' })
      .select()
      .single();

    if (prescriptionError) {
      console.error('Error saving contact lens prescription:', prescriptionError);
      return { 
        success: false, 
        message: `Error saving contact lens prescription: ${prescriptionError.message}` 
      };
    }
    
    if (!contactLensPrescription) {
      console.error('Failed to create contact lens prescription: No data returned');
      return { 
        success: false, 
        message: 'Failed to create contact lens prescription: No data returned' 
      };
    }

    const contactLensPrescriptionId = contactLensPrescription.id;
    console.log('Contact lens prescription saved with ID:', contactLensPrescriptionId);

    // 2. Insert or update eye data (for both left and right eyes) using UPSERT
    console.log('Upserting contact lens eye data...');
    
    // First, delete any existing eye data for this prescription to avoid duplicates
    const { error: deleteEyesError } = await supabase
      .from('contact_lens_eyes')
      .delete()
      .eq('contact_lens_prescription_id', contactLensPrescriptionId);
      
    if (deleteEyesError) {
      console.error('Error removing existing eye data:', deleteEyesError);
      // We'll continue anyway and try to insert the new data
    }
    
    const eyeInsertPromises = data.eyes.map(async (eye) => {
      const { error: eyeError } = await supabase
        .from('contact_lens_eyes')
        .insert({
          contact_lens_prescription_id: contactLensPrescriptionId,
          eye_side: eye.eye_side, // Use the exact value as it should already be 'Left' or 'Right'
          sph: eye.sph || null,
          cyl: eye.cyl || null,
          axis: eye.axis || null,
          add_power: eye.add_power || null,
          vn: eye.vn || null,
          rpd: eye.rpd || null,
          lpd: eye.lpd || null,
          ipd: eye.ipd || null // Store IPD if available
        });

      if (eyeError) {
        console.error(`Error saving ${eye.eye_side} eye data:`, eyeError);
        throw new Error(`Error saving ${eye.eye_side} eye data: ${eyeError.message}`);
      }
      
      console.log(`${eye.eye_side} eye data saved successfully`);
      return true;
    });

    try {
      await Promise.all(eyeInsertPromises);
      console.log('All eye data saved successfully');
    } catch (eyeError) {
      console.error('Error saving eye data:', eyeError);
      // Attempt to clean up the prescription entry
      await supabase
        .from('contact_lens_prescriptions')
        .delete()
        .eq('id', contactLensPrescriptionId);
      
      return { 
        success: false, 
        message: eyeError instanceof Error ? eyeError.message : 'Error saving eye data' 
      };
    }
    
    // 3. Insert or update contact lens items using UPSERT
    console.log('Upserting contact lens items...');
    
    // First, delete any existing items for this prescription to avoid duplicates
    const { error: deleteItemsError } = await supabase
      .from('contact_lens_items')
      .delete()
      .eq('contact_lens_prescription_id', contactLensPrescriptionId);
      
    if (deleteItemsError) {
      console.error('Error removing existing items:', deleteItemsError);
      // We'll continue anyway and try to insert the new data
    }
    
    const itemInsertPromises = data.items.map(async (item, index) => {
      // Convert UI side values to database values
      const dbSideValue = item.eye_side === 'RE' ? 'Right' : 
                          item.eye_side === 'LE' ? 'Left' : 
                          'Both'; // Empty string or any other value becomes 'Both'

      // Important: Field names coming from UI are in camelCase but need to be converted to snake_case
      // For example, from UI: discountPercent -> database: discount_percent
      console.log('Saving item with discount fields:', {
        ui_fields: {
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          amount: item.amount  // Final amount in UI
        },
        db_fields: {
          discount_percent: item.discount_percent,
          discount_amount: item.discount_amount, 
          final_amount: item.final_amount
        }
      });
      
      // IMPORTANT: In the contact_lens_items table, discount_amount is a generated column
      // that's automatically calculated by the database based on rate, quantity, and discount_percent.
      // We must EXCLUDE discount_amount from the insert operation and only set discount_percent.
      console.log(`Inserting contact lens item ${index + 1} with discount_percent:`, item.discountPercent || 0);
      
      const insertData = {
        contact_lens_prescription_id: contactLensPrescriptionId,
        eye_side: dbSideValue,
        base_curve: item.base_curve || null,
        power: item.power || null,
        material: item.material || null,
        dispose: item.dispose || null,
        brand: item.brand || null,
        diameter: item.diameter || null,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        // Only set discount_percent - this is the key change
        discount_percent: item.discountPercent || 0,
        // Exclude discount_amount since it's a generated column
        // Exclude final_amount since it might also be a generated column
        sph: item.sph || null,
        cyl: item.cyl || null,
        axis: item.axis || null,
        lens_code: item.lens_code || null,
        item_index: index // Add an index for ordering
      };
      
      console.log('Contact lens item insert data:', insertData);
      
      const { error: itemError } = await supabase
        .from('contact_lens_items')
        .insert(insertData);
      
      if (itemError) {
        console.error(`Error saving item ${index + 1}:`, itemError);
        throw new Error(`Error saving item ${index + 1}: ${itemError.message}`);
      }
      
      console.log(`Item ${index + 1} saved successfully`);
      return true;
    });

    try {
      await Promise.all(itemInsertPromises);
      console.log('All items saved successfully');
    } catch (itemError) {
      console.error('Error saving items:', itemError);
      // Attempt to clean up the prescription entries and eye data
      await supabase
        .from('contact_lens_eyes')
        .delete()
        .eq('contact_lens_prescription_id', contactLensPrescriptionId);
        
      await supabase
        .from('contact_lens_prescriptions')
        .delete()
        .eq('id', contactLensPrescriptionId);
      
      return { 
        success: false, 
        message: itemError instanceof Error ? itemError.message : 'Error saving items' 
      };
    }

    // 4. Insert or update payment data using UPSERT pattern
    console.log('Upserting payment data...');
    
    // First, check if payment data already exists for this prescription
    const { data: existingPayment, error: paymentCheckError } = await supabase
      .from('contact_lens_payments')
      .select('*')
      .eq('contact_lens_prescription_id', contactLensPrescriptionId)
      .maybeSingle();
      
    if (paymentCheckError) {
      console.error('Error checking existing payment data:', paymentCheckError);
      // We'll continue anyway and try to insert/update
    }
    
    // Calculate actual values to ensure consistency between UI and database
    // This is critical to ensure payment_total, balance, and discount values match
    
    // Calculate total of all advances
    const totalAdvance = (
      parseFloat((data.payment.cash_advance || 0).toString()) +
      parseFloat((data.payment.card_upi_advance || 0).toString()) + 
      parseFloat((data.payment.cheque_advance || 0).toString())
    );
    
    // Calculate payment_total from items (sum of quantity * rate)
    let paymentTotal = 0;
    if (data.items && data.items.length > 0) {
      paymentTotal = data.items.reduce((total, item) => {
        const qty = parseFloat(item.quantity?.toString() || '0');
        const rate = parseFloat(item.rate?.toString() || '0');
        return total + (qty * rate);
      }, 0);
    } else {
      // Fallback to the existing payment_total if no items
      paymentTotal = parseFloat((data.payment.payment_total || 0).toString());
    }
    
    // Log the UI values we're getting
    console.log('SAVING - UI VALUES BEFORE PROCESSING:', {
      ui_payment_total: data.payment.payment_total,
      ui_estimate: data.payment.estimate,
      ui_discount_amount: data.payment.discount_amount,
      ui_cash_advance: data.payment.cash_advance,
      ui_card_upi_advance: data.payment.card_upi_advance,
      ui_cheque_advance: data.payment.cheque_advance,
      ui_advance: data.payment.advance,
      ui_balance: data.payment.balance
    });
    
    // Note: Balance is a generated column in the database
    // The database will calculate: balance = payment_total - advance
    
    // Construct payment data with corrected values
    const correctedPaymentData = {
      contact_lens_prescription_id: contactLensPrescriptionId,
      
      // Ensure payment_total is the amount AFTER discount
      payment_total: paymentTotal,
      
      // Estimate is the original amount BEFORE discount
      estimate: parseFloat((data.payment.estimate || 0).toString()),
      
      // Set advance to calculated total of all advances
      advance: totalAdvance,
      
      // DO NOT set balance - it's a generated column in the database
      // The database will calculate: balance = payment_total - advance
      
      // Individual advances
      payment_mode: data.payment.payment_mode || 'Cash',
      cash_advance: parseFloat((data.payment.cash_advance || 0).toString()),
      card_upi_advance: parseFloat((data.payment.card_upi_advance || 0).toString()),
      cheque_advance: parseFloat((data.payment.cheque_advance || 0).toString()),
      
      // Discount information
      discount_amount: parseFloat((data.payment.discount_amount || 0).toString()),
      discount_percent: parseFloat((data.payment.discount_percent || 0).toString()),
      scheme_discount: Boolean(data.payment.scheme_discount),
      payment_date: data.payment.payment_date || new Date().toISOString().split('T')[0]
    };
    
    console.log('Saving corrected payment data to database:', correctedPaymentData);
    
    // Use upsert if payment exists, otherwise insert
    const { error: paymentError } = existingPayment
      ? await supabase
          .from('contact_lens_payments')
          .update(correctedPaymentData)
          .eq('contact_lens_prescription_id', contactLensPrescriptionId)
      : await supabase
          .from('contact_lens_payments')
          .insert(correctedPaymentData);

    if (paymentError) {
      console.error('Error saving payment data:', paymentError);
      // Attempt to clean up all related data
      await supabase
        .from('contact_lens_items')
        .delete()
        .eq('contact_lens_prescription_id', contactLensPrescriptionId);
        
      await supabase
        .from('contact_lens_eyes')
        .delete()
        .eq('contact_lens_prescription_id', contactLensPrescriptionId);
        
      await supabase
        .from('contact_lens_prescriptions')
        .delete()
        .eq('id', contactLensPrescriptionId);
      
      return { 
        success: false, 
        message: `Error saving payment data: ${paymentError.message}` 
      };
    }
    
    console.log('Payment data saved successfully');
    console.log('All contact lens prescription data saved successfully!');
    
    return { 
      success: true, 
      message: 'Contact lens prescription saved successfully', 
      id: contactLensPrescriptionId 
    };
  } catch (error) {
    console.error('Unexpected error in saveContactLensPrescription:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Get a contact lens prescription by ID
 * Returns data from all four contact lens tables
 */
export const getContactLensPrescription = async (prescriptionId: string) => {
  try {
    // Get the contact lens prescription record
    const { data: prescriptionData, error: prescriptionError } = await supabase
      .from('contact_lens_prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (prescriptionError) {
      console.error('Error fetching contact lens prescription:', prescriptionError);
      return { success: false, message: prescriptionError.message, data: null };
    }

    // Get the eye data
    const { data: eyesData, error: eyesError } = await supabase
      .from('contact_lens_eyes')
      .select('*')
      .eq('contact_lens_prescription_id', prescriptionId);

    if (eyesError) {
      console.error('Error fetching contact lens eye data:', eyesError);
      return { success: false, message: eyesError.message, data: null };
    }

    // Get the items data
    const { data: itemsData, error: itemsError } = await supabase
      .from('contact_lens_items')
      .select('*')
      .eq('contact_lens_prescription_id', prescriptionId);

    if (itemsError) {
      console.error('Error fetching contact lens items:', itemsError);
      return { success: false, message: itemsError.message, data: null };
    }

    // Get the payment data
    const { data: paymentData, error: paymentError } = await supabase
      .from('contact_lens_payments')
      .select('*')
      .eq('contact_lens_prescription_id', prescriptionId)
      .single();

    if (paymentError) {
      console.error('Error fetching contact lens payment:', paymentError);
      return { success: false, message: paymentError.message, data: null };
    }

    // Get customer details from the main prescription
    const { data: customerData, error: customerError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionData.prescription_id)
      .single();

    if (customerError && customerError.code !== 'PGRST116') { // PGRST116 is not found, which is ok here
      console.error('Error fetching customer data:', customerError);
      // Don't return here, as we might still be able to provide the contact lens data
    }

    // Combine the data into a single response
    const combinedData = {
      prescription: {
        ...prescriptionData,
        // Add customer details if available
        name: customerData?.name,
        gender: customerData?.gender,
        age: customerData?.age,
        mobile: customerData?.mobile_no,
        email: customerData?.email,
        address: customerData?.address,
        city: customerData?.city,
        state: customerData?.state,
        pin: customerData?.pin_code,
        // Include the new fields
        reference_no: prescriptionData?.reference_no || customerData?.reference_no,
        customer_code: prescriptionData?.customer_code || customerData?.customer_code,
        birth_day: prescriptionData?.birth_day || customerData?.birth_day,
        marriage_anniversary: prescriptionData?.marriage_anniversary || customerData?.marriage_anniversary,
        phone_landline: prescriptionData?.phone_landline || customerData?.phone_landline,
        prescribed_by: prescriptionData?.prescribed_by || customerData?.prescribed_by
      },
      eyes: eyesData || [],
      items: itemsData || [],
      payment: paymentData
    };

    return {
      success: true,
      message: 'Contact lens prescription fetched successfully',
      data: combinedData
    };

  } catch (error) {
    console.error('Unexpected error fetching contact lens prescription:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};

/**
 * Get all contact lens prescriptions for a given prescription ID
 */
export const getContactLensPrescriptionsByPrescriptionId = async (prescriptionId: string) => {
  try {
    const { data, error } = await supabase
      .from('contact_lens_prescriptions')
      .select(`
        *,
        contact_lens_eyes(*),
        contact_lens_items(*),
        contact_lens_payments(*)
      `)
      .eq('prescription_id', prescriptionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact lens prescriptions:', error);
      return { success: false, message: error.message, data: null };
    }

    return {
      success: true,
      message: 'Contact lens prescriptions fetched successfully',
      data
    };
  } catch (error) {
    console.error('Unexpected error fetching contact lens prescriptions:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};

/**
 * Update an existing contact lens prescription
 */
export const updateContactLensPrescription = async (prescriptionId: string, data: ContactLensData) => {
  try {
    console.log('Updating contact lens prescription:', prescriptionId);
    
    // First, get the original record to ensure we have all required fields
    const { data: originalRecord, error: fetchError } = await supabase
      .from('contact_lens_prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching original record:', fetchError);
      return { success: false, message: `Error fetching original record: ${fetchError.message}` };
    }
    
    if (!originalRecord) {
      return { success: false, message: 'Record not found' };
    }
    
    // Instead of using update() which results in PATCH requests, use upsert
    // This approach uses POST method which is more commonly allowed in CORS policies
    const { error: prescriptionError } = await supabase
      .from('contact_lens_prescriptions')
      .upsert({
        id: prescriptionId, // Include the ID to match in conflict resolution
        prescription_id: originalRecord.prescription_id, // Keep the original required field
        booked_by: data.prescription.booked_by,
        delivery_date: data.prescription.delivery_date || null,
        delivery_time: data.prescription.delivery_time || null,
        status: data.prescription.status || 'Processing',
        retest_date: data.prescription.retest_date || null,
        expiry_date: data.prescription.expiry_date || null,
        remarks: data.prescription.remarks || null,
        reference_no: data.prescription.reference_no || null,
        customer_code: data.prescription.customer_code || null,
        birth_day: data.prescription.birth_day || null,
        marriage_anniversary: data.prescription.marriage_anniversary || null,
        pin: data.prescription.pin || null,
        phone_landline: data.prescription.phone_landline || null,
        prescribed_by: data.prescription.prescribed_by || null,
        updated_at: new Date().toISOString()
      });

    if (prescriptionError) {
      console.error('Error updating contact lens prescription:', prescriptionError);
      return { success: false, message: `Error updating contact lens prescription: ${prescriptionError.message}` };
    }

    // Update eye data - First delete existing eyes and then insert new ones
    const { error: deleteEyesError } = await supabase
      .from('contact_lens_eyes')
      .delete()
      .eq('contact_lens_prescription_id', prescriptionId);

    if (deleteEyesError) {
      console.error('Error deleting existing eye data:', deleteEyesError);
      return { success: false, message: `Error updating eye data: ${deleteEyesError.message}` };
    }

    // Insert new eye data
    const eyeInsertPromises = data.eyes.map(async (eye) => {
      const { error: eyeError } = await supabase
        .from('contact_lens_eyes')
        .insert({
          contact_lens_prescription_id: prescriptionId,
          eye_side: eye.eye_side, // Use the exact value as it should already be 'Left' or 'Right'
          sph: eye.sph || null,
          cyl: eye.cyl || null,
          axis: eye.axis || null,
          add_power: eye.add_power || null,
          vn: eye.vn || null,
          rpd: eye.rpd || null,
          lpd: eye.lpd || null
        });

      if (eyeError) {
        throw new Error(`Error updating ${eye.eye_side.toLowerCase()} eye data: ${eyeError.message}`);
      }
      return true;
    });

    try {
      await Promise.all(eyeInsertPromises);
    } catch (eyeError) {
      console.error('Error updating eye data:', eyeError);
      return { success: false, message: eyeError instanceof Error ? eyeError.message : 'Error updating eye data' };
    }

    // Update items - First delete existing items and then insert new ones
    const { error: deleteItemsError } = await supabase
      .from('contact_lens_items')
      .delete()
      .eq('contact_lens_prescription_id', prescriptionId);

    if (deleteItemsError) {
      console.error('Error deleting existing items:', deleteItemsError);
      return { success: false, message: `Error updating items: ${deleteItemsError.message}` };
    }

    // Insert new items
    const itemInsertPromises = data.items.map(async (item, index) => {
      const { error: itemError } = await supabase
        .from('contact_lens_items')
        .insert({
          contact_lens_prescription_id: prescriptionId,
          eye_side: item.eye_side, // Use the exact value as it should be 'Left', 'Right', or 'Both'
          base_curve: item.base_curve || null,
          power: item.power || null,
          material: item.material || null,
          dispose: item.dispose || null,
          brand: item.brand || null,
          diameter: item.diameter || null,
          quantity: item.quantity,
          rate: item.rate,
          sph: item.sph || null,
          cyl: item.cyl || null,
          axis: item.axis || null,
          lens_code: item.lens_code || null
        });

      if (itemError) {
        throw new Error(`Error updating item ${index + 1}: ${itemError.message}`);
      }
      return true;
    });

    try {
      await Promise.all(itemInsertPromises);
    } catch (itemError) {
      console.error('Error updating items:', itemError);
      return { success: false, message: itemError instanceof Error ? itemError.message : 'Error updating items' };
    }

    // Update payment data
    // First, get the payment record to get its ID which we need for the upsert
    const { data: existingPayment, error: fetchPaymentError } = await supabase
      .from('contact_lens_payments')
      .select('id')
      .eq('contact_lens_prescription_id', prescriptionId)
      .single();
      
    if (fetchPaymentError) {
      console.error('Error fetching payment record:', fetchPaymentError);
      return { success: false, message: `Error fetching payment record: ${fetchPaymentError.message}` };
    }
    
    // Calculate the adjusted estimate by subtracting the discount amount
    // This ensures the generated balance (estimate - advance) will match the UI calculation (estimate - advance - discount)
    const discountAmount = data.payment.discount_amount || 0;
    const originalEstimate = data.payment.estimate || 0;
    const effectiveEstimate = Math.max(0, originalEstimate - discountAmount);
    
    // Calculate the total payment from items
    const paymentTotal = data.items.reduce((total, item) => {
      return total + (item.quantity || 0) * (item.rate || 0);
    }, 0);
    
    // Use upsert instead of update to avoid CORS issues
    const { error: paymentError } = await supabase
      .from('contact_lens_payments')
      .upsert({
        id: existingPayment.id, // Include the ID to ensure we update existing record
        contact_lens_prescription_id: prescriptionId,
        payment_total: paymentTotal, // Set the payment_total from items
        estimate: effectiveEstimate, // Use adjusted estimate that accounts for discount
        advance: data.payment.advance,
        payment_mode: data.payment.payment_mode,
        cash_advance: data.payment.cash_advance,
        card_upi_advance: data.payment.card_upi_advance,
        cheque_advance: data.payment.cheque_advance,
        discount_amount: data.payment.discount_amount,
        payment_date: data.payment.payment_date || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Error updating payment data:', paymentError);
      return { success: false, message: `Error updating payment data: ${paymentError.message}` };
    }

    return {
      success: true,
      message: 'Contact lens prescription updated successfully',
      id: prescriptionId
    };

  } catch (error) {
    console.error('Unexpected error updating contact lens prescription:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Delete a contact lens prescription
 * This will cascade delete all related eyes, items, and payment data
 */
export const deleteContactLensPrescription = async (prescriptionId: string) => {
  try {
    // Delete the prescription record - due to cascade constraints,
    // this will automatically delete related eyes, items, and payment
    const { error } = await supabase
      .from('contact_lens_prescriptions')
      .delete()
      .eq('id', prescriptionId);

    if (error) {
      console.error('Error deleting contact lens prescription:', error);
      return { success: false, message: `Error deleting contact lens prescription: ${error.message}` };
    }

    return {
      success: true,
      message: 'Contact lens prescription deleted successfully'
    };
  } catch (error) {
    console.error('Unexpected error deleting contact lens prescription:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Search for contact lens patients by various fields
 * This will search across both the main prescriptions table and contact_lens_prescriptions
 * @param searchField - Field to search in (prescription_no, ref_no, name, mobile)
 * @param searchValue - Value to search for
 */
export const searchContactLensPatients = async (searchField: string, searchValue: string) => {
  try {
    if (!searchValue.trim()) {
      return { success: false, message: 'Search value cannot be empty', data: [] };
    }

    console.log(`Searching for ${searchField} with value: ${searchValue}`);
    
    // Different search logic based on the field
    switch (searchField) {
      case 'prescription_no':
        // Search by prescription number in the main prescriptions table
        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            prescription_no,
            name,
            gender,
            age,
            mobile_no,
            email,
            address,
            city,
            state,
            pin_code,
            date,
            prescribed_by
          `)
          .ilike('prescription_no', `%${searchValue}%`);

        if (prescriptionError) {
          console.error('Error searching prescriptions:', prescriptionError);
          return { success: false, message: `Error searching: ${prescriptionError.message}`, data: [] };
        }

        // For each found prescription, get any contact lens data
        const prescriptionResults = await Promise.all(prescriptionData.map(async (prescription) => {
          const { data: contactLensData } = await supabase
            .from('contact_lens_prescriptions')
            .select(`
              id,
              prescription_id,
              booked_by,
              delivery_date,
              delivery_time,
              status,
              retest_date,
              expiry_date,
              remarks
            `)
            .eq('prescription_id', prescription.id)
            .maybeSingle();

          return {
            ...prescription,
            contactLensData: contactLensData || null
          };
        }));

        return { 
          success: true, 
          message: `Found ${prescriptionResults.length} matching prescriptions`, 
          data: prescriptionResults 
        };

      case 'mobile':
        // Search by mobile number
        const { data: mobileData, error: mobileError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            prescription_no,
            name,
            gender,
            age,
            mobile_no,
            email,
            address,
            city,
            state,
            pin_code,
            date,
            prescribed_by
          `)
          .ilike('mobile_no', `%${searchValue}%`);

        if (mobileError) {
          console.error('Error searching by mobile:', mobileError);
          return { success: false, message: `Error searching: ${mobileError.message}`, data: [] };
        }

        // For each found prescription, get any contact lens data
        const mobileResults = await Promise.all(mobileData.map(async (prescription) => {
          const { data: contactLensData } = await supabase
            .from('contact_lens_prescriptions')
            .select(`
              id,
              prescription_id,
              booked_by,
              delivery_date,
              delivery_time,
              status,
              retest_date,
              expiry_date,
              remarks
            `)
            .eq('prescription_id', prescription.id)
            .maybeSingle();

          return {
            ...prescription,
            contactLensData: contactLensData || null
          };
        }));

        return { 
          success: true, 
          message: `Found ${mobileResults.length} matching patients`, 
          data: mobileResults 
        };

      case 'name':
        // Search by patient name
        const { data: nameData, error: nameError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            prescription_no,
            name,
            gender,
            age,
            mobile_no,
            email,
            address,
            city,
            state,
            pin_code,
            date,
            prescribed_by
          `)
          .ilike('name', `%${searchValue}%`);

        if (nameError) {
          console.error('Error searching by name:', nameError);
          return { success: false, message: `Error searching: ${nameError.message}`, data: [] };
        }

        // For each found prescription, get any contact lens data
        const nameResults = await Promise.all(nameData.map(async (prescription) => {
          const { data: contactLensData } = await supabase
            .from('contact_lens_prescriptions')
            .select(`
              id,
              prescription_id,
              booked_by,
              delivery_date,
              delivery_time,
              status,
              retest_date,
              expiry_date,
              remarks
            `)
            .eq('prescription_id', prescription.id)
            .maybeSingle();

          return {
            ...prescription,
            contactLensData: contactLensData || null
          };
        }));

        return { 
          success: true, 
          message: `Found ${nameResults.length} matching patients`, 
          data: nameResults 
        };

      case 'ref_no':
        // Search by reference number (custom field in your system)
        // This assumes ref_no is stored somewhere - adapt as needed
        const { data: refData, error: refError } = await supabase
          .from('prescriptions')
          .select(`
            id,
            prescription_no,
            name,
            gender,
            age,
            mobile_no,
            email,
            address,
            city,
            state,
            pin_code,
            date,
            prescribed_by,
            ref_no
          `)
          .ilike('ref_no', `%${searchValue}%`);

        if (refError) {
          console.error('Error searching by reference number:', refError);
          return { success: false, message: `Error searching: ${refError.message}`, data: [] };
        }

        // For each found prescription, get any contact lens data
        const refResults = await Promise.all(refData.map(async (prescription) => {
          const { data: contactLensData } = await supabase
            .from('contact_lens_prescriptions')
            .select(`
              id,
              prescription_id,
              booked_by,
              delivery_date,
              delivery_time,
              status,
              retest_date,
              expiry_date,
              remarks
            `)
            .eq('prescription_id', prescription.id)
            .maybeSingle();

          return {
            ...prescription,
            contactLensData: contactLensData || null
          };
        }));

        return { 
          success: true, 
          message: `Found ${refResults.length} matching prescriptions`, 
          data: refResults 
        };

      default:
        return { success: false, message: 'Invalid search field', data: [] };
    }
  } catch (error) {
    console.error('Unexpected error during search:', error);
    return {
      success: false,
      message: `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: []
    };
  }
};

/**
 * Get detailed contact lens prescription data for a patient
 * This fetches all the eye data, items, and payment information
 * to fully populate the contact lens form
 */
export const getDetailedContactLensData = async (contactLensPrescriptionId: string) => {
  try {
    // Get the basic prescription data
    const { data: prescription, error: prescriptionError } = await supabase
      .from('contact_lens_prescriptions')
      .select('*')
      .eq('id', contactLensPrescriptionId)
      .single();
    
    if (prescriptionError) {
      console.error('Error fetching prescription details:', prescriptionError);
      return { success: false, message: `Error fetching details: ${prescriptionError.message}` };
    }
    
    // Get the main prescription data (customer info)
    const { data: mainPrescription, error: mainError } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescription.prescription_id)
      .single();
    
    if (mainError) {
      console.error('Error fetching main prescription:', mainError);
      return { success: false, message: `Error fetching customer info: ${mainError.message}` };
    }
    
    // Get eye data
    const { data: eyes, error: eyesError } = await supabase
      .from('contact_lens_eyes')
      .select('*')
      .eq('contact_lens_prescription_id', contactLensPrescriptionId);
    
    if (eyesError) {
      console.error('Error fetching eye data:', eyesError);
      return { success: false, message: `Error fetching eye data: ${eyesError.message}` };
    }
    
    // Get items
    const { data: items, error: itemsError } = await supabase
      .from('contact_lens_items')
      .select('*')
      .eq('contact_lens_prescription_id', contactLensPrescriptionId)
      .order('item_index', { ascending: true });
    
    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return { success: false, message: `Error fetching items: ${itemsError.message}` };
    }
    
    // Get payment data
    const { data: payment, error: paymentError } = await supabase
      .from('contact_lens_payments')
      .select('*')
      .eq('contact_lens_prescription_id', contactLensPrescriptionId)
      .single();
    
    if (paymentError) {
      console.error('Error fetching payment data:', paymentError);
      return { success: false, message: `Error fetching payment data: ${paymentError.message}` };
    }
    
    // Log what we're loading from the database
    console.log('DATABASE VALUES BEING LOADED:', {
      items: items,
      payment: payment
    });
      
    // Map items to include all necessary fields with proper naming
    // Also convert database side values to UI side values
    const mappedItems = items.map((item, index) => {
      // Strictly parse all values as numbers with fallbacks to 0
      const qty = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      
      // Calculate expected total before discount
      const expectedBaseTotal = qty * rate;
      
      // Get discount values directly from database with fallbacks to 0
      // Force parsing as numbers to avoid type issues
      let discountPercent = parseFloat(item.discount_percent) || 0;
      let discountAmount = parseFloat(item.discount_amount) || 0;
      let finalAmount = parseFloat(item.final_amount) || 0;
      
      // If finalAmount is 0 or equal to base amount, but we have a discount percent, recalculate
      if ((finalAmount === 0 || finalAmount === expectedBaseTotal) && discountPercent > 0) {
        // Recalculate discount amount and final amount
        discountAmount = expectedBaseTotal * (discountPercent / 100);
        finalAmount = expectedBaseTotal - discountAmount;
      }
      
      // If we have a discount amount but no percent, calculate the percent
      if (discountAmount > 0 && discountPercent === 0 && expectedBaseTotal > 0) {
        discountPercent = (discountAmount / expectedBaseTotal) * 100;
      }
      
      // Enhanced logging of what we're loading
      console.log(`Item ${index + 1} values from database:`, {
        qty,
        rate,
        expectedBaseTotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      });
      
      // Debug log the raw eye_side value from database
      console.log('Raw eye_side from DB:', item.eye_side);
      
      // Map eye_side database values to UI values, handling case insensitivity
      const normalizedEyeSide = String(item.eye_side).toLowerCase().trim();
      let sideValue = '';
      
      if (['right', 'r', 're', 'od'].includes(normalizedEyeSide)) {
        sideValue = 'RE';
      } else if (['left', 'l', 'le', 'os'].includes(normalizedEyeSide)) {
        sideValue = 'LE';
      }
      
      return {
        // Map the normalized eye side to UI format
        side: sideValue,
        
        // Map other fields to UI format
        si: index + 1,                   // Serial number
        bc: item.base_curve || '',       // Base curve
        power: item.power || '',         // Power
        material: item.material || '',   // Material
        dispose: item.dispose || '',     // Dispose
        brand: item.brand || '',         // Brand
        diameter: item.diameter || '',   // Diameter
        qty: item.quantity || 1,         // Quantity
        rate: item.rate || 0,            // Rate
        
        // Convert discount fields from snake_case to camelCase for UI
        discountPercent: discountPercent,  // Discount percentage
        discountAmount: discountAmount,    // Direct from database
        amount: finalAmount,              // Direct from database
        
        // Other fields
        sph: item.sph || '',             // Spherical
        cyl: item.cyl || '',             // Cylindrical
        ax: item.axis || '',             // Axis
        lensCode: item.lens_code || ''   // Lens code
      };
    });
    
    // Combine all data
    const detailedData = {
      prescription: {
        ...prescription,
        ...mainPrescription
      },
      eyes,
      items: mappedItems,
      payment
    };
    
    return {
      success: true,
      message: 'Data retrieved successfully',
      data: detailedData
    };
    
  } catch (error) {
    console.error('Unexpected error retrieving detailed data:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Export as a service object
export const contactLensService = {
  saveContactLensPrescription,
  getContactLensPrescription,
  getContactLensPrescriptionsByPrescriptionId,
  updateContactLensPrescription,
  deleteContactLensPrescription,
  searchContactLensPatients,
  getDetailedContactLensData,
  generateContactLensPrescriptionNo
};
