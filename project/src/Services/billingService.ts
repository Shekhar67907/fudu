import { supabase } from './supabaseService';
import { contactLensService } from './contactLensService';

// Types for unified search results
export interface UnifiedSearchResult {
  id: string;
  sourceType: 'order' | 'contact_lens' | 'prescription';
  name: string;
  referenceNo: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  date: string;
  totalAmount: number;
  balanceAmount: number;
  itemCount: number;
  jobType: string;
  originalData: any;
}

// Type definitions for the data returned from Supabase
interface Prescription {
  id: string;
  prescription_no: string;
  reference_no?: string;
  date: string;
  name: string;
  mobile_no?: string;
  phone_landline?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  source: string;
  title?: string;
  age?: string;
  gender?: string;
  customer_code?: string;
  birth_day?: string;
  marriage_anniversary?: string;
  ipd?: string;
  retest_after?: string;
  others?: string;
  balance_lens?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Prescription specific fields
  doctor_name?: string;
  vision_type?: string;
  remarks?: string;
  
  // Right eye prescription
  re_sphere?: string | number;
  re_cylinder?: string | number;
  re_axis?: string | number;
  re_add?: string | number;
  re_va?: string;
  
  // Left eye prescription
  le_sphere?: string | number;
  le_cylinder?: string | number;
  le_axis?: string | number;
  le_add?: string | number;
  le_va?: string;
  
  // Pupillary Distance
  pd_od?: string | number; // OD = Oculus Dexter (right eye)
  pd_os?: string | number; // OS = Oculus Sinister (left eye)
}

interface Order {
  id: string;
  order_no: string;
  order_date: string;
  bill_no?: string;
  delivery_date?: string;
  status: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  prescription_id: string;
  prescriptions?: Prescription[];
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  si: number;
  item_type: string;
  item_code?: string;
  item_name: string;
  rate: number;
  qty: number;
  amount: number;
  tax_percent: number;
  discount_percent: number;
  discount_amount: number;
  brand_name?: string;
  index?: string;
  coating?: string;
  created_at?: string;
  updated_at?: string;
  customer_code?: string;
  birth_day?: string;
  marriage_anniversary?: string;
  pin?: string;
  phone_landline?: string;
  prescribed_by?: string;
  reference_no?: string;
  material?: string;
  dispose?: string;
  brand?: string;
  prescriptions?: Prescription[];
  contact_lens_items?: ContactLensItem[];
}

interface ContactLensItem {
  id: string;
  contact_lens_prescription_id: string;
  eye_side: string;
  base_curve?: string;
  power?: string;
  material?: string;
  dispose?: string;
  brand?: string;
  diameter?: string;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  sph?: string;
  cyl?: string;
  axis?: string;
  lens_code?: string;
  created_at?: string;
  updated_at?: string;
  item_index?: number;
  discount_percent: number | string;
  discount_amount: number | string;
  final_amount: number | string;
  item_name?: string;
  item_code?: string;
  tax_percent?: number | string;
  [key: string]: any; // Allow additional properties
}

interface BillingItem {
  id: string;
  item_name: string;
  item_code: string;
  quantity: number;
  rate: number;
  amount: number;
  tax_percent: number;
  discount_percent: number;
  discount_amount: number;
  eye_side: string;  // Made non-optional to match usage
  brand?: string;
  material?: string;
  power?: string;
  base_curve?: string;
  diameter?: string;
  [key: string]: any; // Allow additional properties for flexibility
}

/**
 * Unified search across orders, contact lenses, and prescriptions
 */
export const unifiedSearch = async (searchTerm: string): Promise<UnifiedSearchResult[]> => {
  console.log(`[unifiedSearch] Searching for: ${searchTerm}`);
  
  try {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      console.warn('[unifiedSearch] Empty search term provided');
      return [];
    }

    // Search for all three types in parallel
    const [orders, contactLenses, prescriptions] = await Promise.all([
      searchOrders(normalizedTerm),
      searchContactLenses(normalizedTerm),
      searchPrescriptions(normalizedTerm)
    ]);
    
    console.log(`[unifiedSearch] Search completed`, {
      orders: orders.length,
      contactLenses: contactLenses.length,
      prescriptions: prescriptions.length
    });

    // Create a map to track merged entries by customer mobile
    const mergedEntries = new Map<string, UnifiedSearchResult>();
    const results: UnifiedSearchResult[] = [];

    // Process prescriptions (P only)
    prescriptions.forEach(prescription => {
      if (!prescription.mobile) return;
      
      // Check if this customer already has a contact lens entry
      const existingEntry = mergedEntries.get(prescription.mobile);
      
      if (existingEntry) {
        // If we already have a CL entry, update it to be a merged entry
        if (existingEntry.jobType === 'Contact Lens') {
          existingEntry.jobType = 'P, CL';
          existingEntry.referenceNo = `${prescription.referenceNo} | ${existingEntry.referenceNo}`;
        }
      } else {
        // Add as P only entry
        const entry = {
          ...prescription,
          jobType: 'P',
          originalData: {
            ...prescription.originalData,
            isMerged: false,
            sourceTypes: ['prescription']
          }
        };
        mergedEntries.set(prescription.mobile, entry);
        results.push(entry);
      }
    });

    // Process contact lenses (CL only or merge with existing P)
    contactLenses.forEach(cl => {
      if (!cl.mobile) return;
      
      const existingEntry = mergedEntries.get(cl.mobile);
      
      if (existingEntry) {
        // If we have a P entry, update it to be a merged entry
        if (existingEntry.jobType === 'P') {
          existingEntry.jobType = 'P, CL';
          existingEntry.referenceNo = `${existingEntry.referenceNo} | ${cl.referenceNo}`;
          existingEntry.originalData = {
            ...existingEntry.originalData,
            ...cl.originalData,
            isMerged: true,
            sourceTypes: ['prescription', 'contact_lens']
          };
        }
      } else {
        // Add as CL only entry
        const entry = {
          ...cl,
          jobType: 'CL',
          originalData: {
            ...cl.originalData,
            isMerged: false,
            sourceTypes: ['contact_lens']
          }
        };
        mergedEntries.set(cl.mobile, entry);
        results.push(entry);
      }
    });

    // Add orders (these are separate and not merged)
    orders.forEach(order => {
      results.push({
        ...order,
        jobType: 'Order',
        originalData: {
          ...order.originalData,
          isMerged: false,
          sourceTypes: ['order']
        }
      });
    });

    // Sort by date (newest first)
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('[unifiedSearch] Search failed:', error);
    throw new Error('Search failed. Please try again.');
  }
};

// Helper function to search orders
const searchOrders = async (searchTerm: string): Promise<UnifiedSearchResult[]> => {
  console.log(`[searchOrders] Searching orders for: ${searchTerm}`);
  try {
    // Query 1: order_no and bill_no
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_no, order_date, status, prescription_id, bill_no,
        prescriptions!inner (
          id, name, mobile_no, phone_landline, email, address, city, state, pin_code, source
        ),
        order_items (
          id, item_name, qty, rate, amount, tax_percent, discount_percent, discount_amount
        )
      `)
      .or(`order_no.ilike.%${searchTerm}%,bill_no.ilike.%${searchTerm}%`)
      .order('order_date', { ascending: false })
      .limit(20);

    // Query 2: prescription fields
    const { data: prescriptionOrders, error: prescriptionError } = await supabase
      .from('orders')
      .select(`
        id, order_no, order_date, status, prescription_id, bill_no,
        prescriptions!inner (
          id, name, mobile_no, phone_landline, email, address, city, state, pin_code, source
        ),
        order_items (
          id, item_name, qty, rate, amount, tax_percent, discount_percent, discount_amount
        )
      `)
      .or(`prescriptions.name.ilike.%${searchTerm}%,prescriptions.mobile_no.ilike.%${searchTerm}%,prescriptions.phone_landline.ilike.%${searchTerm}%`)
      .order('order_date', { ascending: false })
      .limit(20);

    if (error && prescriptionError) {
      console.error('[searchOrders] Error:', error, prescriptionError);
      return [];
    }
    const allData = [...(data || []), ...(prescriptionOrders || [])]
      .filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
    if (!allData || !Array.isArray(allData)) {
      console.warn('[searchOrders] No data returned or invalid format');
      return [];
    }
    const results = allData as Array<Order>;
    return results.map(order => ({
      id: order.id,
      sourceType: 'order' as const,
      name: order.prescriptions?.[0]?.name || 'Unknown Customer',
      referenceNo: order.order_no || order.bill_no || 'N/A',
      mobile: order.prescriptions?.[0]?.mobile_no || order.prescriptions?.[0]?.phone_landline || '',
      email: order.prescriptions?.[0]?.email,
      address: order.prescriptions?.[0]?.address,
      city: order.prescriptions?.[0]?.city,
      state: order.prescriptions?.[0]?.state,
      pinCode: order.prescriptions?.[0]?.pin_code,
      date: order.order_date || new Date().toISOString(),
      totalAmount: order.order_items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
      balanceAmount: 0,
      itemCount: order.order_items?.length || 0,
      jobType: 'Order',
      originalData: order
    }));
  } catch (error) {
    console.error('[searchOrders] Unexpected error:', error);
    return [];
  }
};

// Helper function to search contact lenses
const searchContactLenses = async (searchTerm: string): Promise<UnifiedSearchResult[]> => {
  console.log(`[searchContactLenses] Searching contact lenses for: ${searchTerm}`);
  try {
    // First, find matching prescriptions
    const { data: prescriptions, error: prescriptionError } = await supabase
      .from('prescriptions')
      .select('*')
      .or(`prescription_no.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,mobile_no.ilike.%${searchTerm}%,phone_landline.ilike.%${searchTerm}%`)
      .limit(50);

    if (prescriptionError) {
      console.error('[searchContactLenses] Error fetching prescriptions:', prescriptionError);
      return [];
    }

    if (!prescriptions || prescriptions.length === 0) {
      return [];
    }

    // Get the contact lens prescriptions for these prescription IDs
    const prescriptionIds = prescriptions.map(p => p.id);
    const { data: contactLensPrescriptions, error: clError } = await supabase
      .from('contact_lens_prescriptions')
      .select(`
        id, 
        prescription_id,
        status,
        created_at,
        contact_lens_items (
          id, quantity, rate, amount, discount_percent, discount_amount, brand, material, power, eye_side
        )
      `)
      .in('prescription_id', prescriptionIds)
      .order('created_at', { ascending: false });

    if (clError) {
      console.error('[searchContactLenses] Error fetching contact lens prescriptions:', clError);
      return [];
    }

    if (!contactLensPrescriptions || contactLensPrescriptions.length === 0) {
      return [];
    }

    // Create a map of prescription_id to prescription data for quick lookup
    const prescriptionMap = new Map(prescriptions.map(p => [p.id, p]));

    // Map the results to the unified format
    return contactLensPrescriptions.map(clPrescription => {
      const prescription = prescriptionMap.get(clPrescription.prescription_id);
      
      // Map eye side from database format to UI format and prepare items with all required fields
      // Define a type for the raw contact lens item from the database
      type RawContactLensItem = {
        id?: string;
        eye_side?: string;
        brand?: string;
        material?: string;
        power?: string;
        quantity?: any;
        rate?: any;
        amount?: any;
        discount_percent?: any;
        discount_amount?: any;
        base_curve?: string;
        diameter?: string;
        [key: string]: any;
      };

      const items = (clPrescription.contact_lens_items || [] as RawContactLensItem[])
        .map((item: RawContactLensItem): BillingItem | null => {
          try {
            const eyeSide = item.eye_side === 'Right' ? 'RE' : item.eye_side === 'Left' ? 'LE' : '';
            const itemName = [
              item.brand,
              item.material,
              item.power,
              eyeSide ? `(${eyeSide})` : ''
            ].filter(Boolean).join(' ');
            
            return {
              id: item.id || `item-${Math.random().toString(36).substr(2, 9)}`,
              item_name: itemName,
              item_code: `CL-${(item.brand || '').substring(0, 3).toUpperCase() || 'LENS'}`,
              quantity: Number(item.quantity) || 1,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              tax_percent: 0, // Default tax for contact lenses
              discount_percent: Number(item.discount_percent) || 0,
              discount_amount: Number(item.discount_amount) || 0,
              eye_side: eyeSide,  // This is now required
              brand: item.brand,
              material: item.material,
              power: item.power,
              base_curve: item.base_curve,
              diameter: item.diameter
            };
          } catch (error) {
            console.error('Error mapping contact lens item:', item, error);
            return null;
          }
        })
        .filter((item): item is BillingItem => item !== null);

      const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

      return {
        id: clPrescription.id,
        sourceType: 'contact_lens' as const,
        name: prescription?.name || 'Unknown Customer',
        referenceNo: prescription?.prescription_no || 'N/A',
        mobile: prescription?.mobile_no || prescription?.phone_landline || '',
        email: prescription?.email,
        address: prescription?.address,
        city: prescription?.city,
        state: prescription?.state,
        pinCode: prescription?.pin_code,
        date: clPrescription.created_at || new Date().toISOString(),
        totalAmount: totalAmount,
        balanceAmount: 0,
        itemCount: items.length,
        jobType: 'CL',
        items: items, // Include the detailed items array
        originalData: {
          ...clPrescription,
          prescriptions: [prescription],
          contact_lens_items: items,
          items: items // Duplicate for backward compatibility
        }
      };
    });
  } catch (error) {
    console.error('[searchContactLenses] Unexpected error:', error);
    return [];
  }
};

// Helper function to search prescriptions
const searchPrescriptions = async (searchTerm: string): Promise<UnifiedSearchResult[]> => {
  console.log(`[searchPrescriptions] Searching prescriptions for: ${searchTerm}`);
  try {
    // Query 1: prescription_no
    const { data: directData, error: directError } = await supabase
      .from('prescriptions')
      .select('*')
      .ilike('prescription_no', `%${searchTerm}%`)
      .order('date', { ascending: false })
      .limit(20);

    // Query 2: name, mobile_no, phone_landline
    const { data: fieldData, error: fieldError } = await supabase
      .from('prescriptions')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,mobile_no.ilike.%${searchTerm}%,phone_landline.ilike.%${searchTerm}%`)
      .order('date', { ascending: false })
      .limit(20);

    if (directError && fieldError) {
      console.error('[searchPrescriptions] Error:', directError, fieldError);
      return [];
    }
    const allData = [...(directData || []), ...(fieldData || [])]
      .filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
    if (!allData || !Array.isArray(allData)) {
      console.warn('[searchPrescriptions] No data returned or invalid format');
      return [];
    }
    const results = allData as Array<Prescription>;
    return results.map(prescription => {
      // Create a default item for the prescription
      const items = [{
        id: `prescription-${prescription.id}`,
        item_name: 'Eye Examination',
        item_code: 'EXAM',
        quantity: 1,
        rate: 0,
        amount: 0,
        tax_percent: 0,
        discount_percent: 0,
        discount_amount: 0
      }];

      return {
        id: prescription.id,
        sourceType: 'prescription' as const,
        name: prescription.name || 'Unknown Customer',
        referenceNo: prescription.prescription_no || prescription.reference_no || 'N/A',
        mobile: prescription.mobile_no || prescription.phone_landline || '',
        email: prescription.email,
        address: prescription.address,
        city: prescription.city,
        state: prescription.state,
        pinCode: prescription.pin_code,
        date: prescription.date || new Date().toISOString(),
        totalAmount: 0, // Will be updated if there are order items
        balanceAmount: 0,
        itemCount: items.length,
        jobType: 'P',
        items: items, // Include the items array
        originalData: {
          ...prescription,
          items: items // Include items in originalData for backward compatibility
        }
      };
    });
  } catch (error) {
    console.error('[searchPrescriptions] Unexpected error:', error);
    return [];
  }
};

/**
 * @deprecated Use UnifiedSearchResult instead
 */
interface CustomerSearchResult {
  id: string;
  source: 'prescription' | 'ordercard' | 'contact_lens';
  prescription_no?: string;
  reference_no?: string;
  name: string;
  mobile_no?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  date?: string;
  total_amount?: number;
  balance_amount?: number;
}

/**
 * @deprecated Use unifiedSearch instead
 */
const searchCustomers = async (field: string, value: string): Promise<CustomerSearchResult[]> => {
  try {
    if (!value.trim()) {
      return [];
    }

    const results: CustomerSearchResult[] = [];
    
    // Search in prescriptions table
    const { data: prescriptions, error: rxError } = await supabase
      .from('prescriptions')
      .select('*')
      .ilike(field, `%${value}%`)
      .limit(10);

    if (!rxError && prescriptions) {
      prescriptions.forEach((rx: any) => {
        results.push({
          id: rx.id,
          source: 'prescription',
          prescription_no: rx.prescription_no,
          reference_no: rx.reference_no,
          name: rx.name,
          mobile_no: rx.mobile_no,
          email: rx.email,
          address: rx.address,
          city: rx.city,
          state: rx.state,
          pin_code: rx.pin_code,
          date: rx.date
        });
      });
    }

    // Search in ordercards table
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .ilike(field, `%${value}%`)
      .limit(10);

    if (!orderError && orders) {
      orders.forEach((order: any) => {
        results.push({
          id: order.id,
          source: 'ordercard',
          reference_no: order.reference_no,
          name: order.customer_name,
          mobile_no: order.mobile_no,
          total_amount: order.total_amount,
          balance_amount: order.balance_amount,
          date: order.order_date
        });
      });
    }

    // Search in contact lens prescriptions
    const { data: contactLensPrescriptions, error: clError } = await supabase
      .from('contact_lens_prescriptions')
      .select('*')
      .ilike(field, `%${value}%`)
      .limit(10);

    if (!clError && contactLensPrescriptions) {
      contactLensPrescriptions.forEach((cl: any) => {
        results.push({
          id: cl.id,
          source: 'contact_lens',
          prescription_no: cl.prescription_no,
          reference_no: cl.reference_no,
          name: cl.name,
          mobile_no: cl.mobile_no,
          date: cl.created_at
        });
      });
    }

    // Group by mobile number and combine sources
    const groupedResults = results.reduce((acc: any[], result) => {
      const existing = acc.find(r => r.mobile_no === result.mobile_no && r.name === result.name);
      
      if (existing) {
        // If we already have this customer, just add the source to the existing entry
        if (!existing.sources.includes(result.source)) {
          existing.sources.push(result.source);
        }
      } else {
        // Otherwise add a new entry with sources array
        acc.push({
          ...result,
          sources: [result.source],
          // Store the first ID and source for backward compatibility
          id: result.id,
          source: result.source
        });
      }
      return acc;
    }, []);

    // Format display name with all available sources
    const formattedResults = groupedResults.map(result => ({
      ...result,
      displayName: `${result.name} (${result.sources.map((s: string) => 
        s === 'prescription' ? 'Rx' : 
        s === 'contact_lens' ? 'CL' : 'Order'
      ).join('/')})`
    }));

    return formattedResults;
  } catch (error) {
    console.error('Error searching customers:', error);
    return [];
  }
};

/**
 * Fetches full details for a specific record
 */
export const getRecordDetails = async <T = any>(
  id: string,
  sourceType: 'order' | 'contact_lens' | 'prescription'
): Promise<T> => {
  console.log(`[getRecordDetails] Fetching ${sourceType} with ID: ${id}`);
  try {
    switch (sourceType) {
      case 'order':
        return await getOrderDetails(id) as T;
      case 'contact_lens':
        return await getContactLensDetails(id) as T;
      case 'prescription':
        return await getPrescriptionDetails(id) as T;
      default:
        throw new Error('Invalid source type');
    }
  } catch (error) {
    console.error(`[getRecordDetails] Error fetching ${sourceType}:`, error);
    throw new Error(`Failed to fetch ${sourceType} details`);
  }
};

// Helper function to get order details with items (refactored for billing table)
const getOrderDetails = async (orderId: string): Promise<OrderDetails> => {
  console.log(`[getOrderDetails] Fetching order with ID: ${orderId}`);
  try {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, item_code, item_name, rate, qty, amount, tax_percent, discount_percent, discount_amount
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !orderData) {
      console.error('[getOrderDetails] Error:', orderError);
      throw new Error('Order not found');
    }

    // Normalize items for billing table
    const items = (orderData.order_items || []).map((item: any) => ({
      id: item.id,
      itemCode: item.item_code,
      itemName: item.item_name,
      rate: Number(item.rate) || 0,
      taxPercent: Number(item.tax_percent) || 0,
      qty: Number(item.qty) || 1,
      amount: Number(item.amount) || 0,
      orderNo: orderData.order_no,
      discount: Number(item.discount_amount) || 0,
      discountPercent: Number(item.discount_percent) || 0,
      sourceType: 'order',
    }));

    console.log('[getOrderDetails] Items mapped for billing:', items);

    return {
      ...orderData,
      type: 'order',
      referenceNo: orderData.order_no,
      date: orderData.order_date,
      items,
    };
  } catch (error) {
    console.error('[getOrderDetails] Exception:', error);
    throw error;
  }
};

// Type definitions for order details
interface OrderDetails extends Omit<Order, 'order_no' | 'order_date' | 'order_items'> {
  type: 'order';
  referenceNo: string;
  date: string;
  items: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    rate: number;
    taxPercent: number;
    qty: number;
    amount: number;
    orderNo: string;
    discount: number;
    discountPercent: number;
    sourceType: string;
  }>;
}

// Interface for contact lens details
interface ContactLensDetails {
  type: 'contact_lens';
  id: string;
  prescription_id: string;
  prescription_no?: string;
  status: string;
  referenceNo: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  items: Array<{
    id: string;
    itemCode: string;
    itemName: string;
    rate: number;
    taxPercent: number;
    qty: number;
    amount: number;
    orderNo: string;
    discount: number;
    discountPercent: number;
    sourceType: string;
    brand?: string;
    material?: string;
    power?: string;
    eye_side?: string;
  }>;
  name: string;
  mobile_no?: string;
  phone_landline?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  pinCode?: string;
  totalAmount: number;
  balanceAmount: number;
  [key: string]: any; // Allow additional properties
}

// Helper to get contact lens details with items (updated to handle missing date column)
const getContactLensDetails = async (prescriptionId: string): Promise<ContactLensDetails> => {
  console.log(`[getContactLensDetails] Fetching contact lens with ID: ${prescriptionId}`);
  try {
    // First, get the contact lens prescription
    const { data: prescriptionData, error: prescriptionError } = await supabase
      .from('contact_lens_prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (prescriptionError || !prescriptionData) {
      console.error('[getContactLensDetails] Error fetching prescription:', prescriptionError);
      throw prescriptionError || new Error('Prescription not found');
    }

    // Then get the related contact lens items
    const { data: itemsData, error: itemsError } = await supabase
      .from('contact_lens_items')
      .select('*')
      .eq('contact_lens_prescription_id', prescriptionId);

    if (itemsError) {
      console.error('[getContactLensDetails] Error fetching items:', itemsError);
      throw itemsError;
    }

    // Normalize items for billing table
    const items = (itemsData || []).map((item: any) => ({
      id: item.id,
      itemCode: item.brand || '',
      itemName: [
        item.brand,
        item.material,
        item.power && `P:${item.power}`,
        item.base_curve && `BC:${item.base_curve}`,
        item.diameter && `DIA:${item.diameter}`
      ].filter(Boolean).join(' ').trim(),
      rate: Number(item.rate) || 0,
      taxPercent: 0, // Not available in schema
      qty: Number(item.quantity) || 1,
      amount: Number(item.amount) || 0,
      orderNo: prescriptionData.prescription_no || '',
      discount: Number(item.discount_amount) || 0,
      discountPercent: Number(item.discount_percent) || 0,
      sourceType: 'contact_lens',
      brand: item.brand,
      material: item.material,
      power: item.power,
      eye_side: item.eye_side,
      base_curve: item.base_curve,
      diameter: item.diameter
    }));

    console.log('[getContactLensDetails] Items mapped for billing:', items);

    const result: ContactLensDetails = {
      ...prescriptionData,
      type: 'contact_lens',
      referenceNo: prescriptionData.prescription_no || '',
      date: prescriptionData.created_at || new Date().toISOString(),
      items,
      name: prescriptionData.name || 'Unknown Customer',
      mobile: prescriptionData.mobile_no || prescriptionData.phone_landline,
      mobile_no: prescriptionData.mobile_no,
      phone_landline: prescriptionData.phone_landline,
      email: prescriptionData.email,
      address: prescriptionData.address,
      city: prescriptionData.city,
      state: prescriptionData.state,
      pinCode: prescriptionData.pin_code,
      pin_code: prescriptionData.pin_code,
      totalAmount: items.reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0),
      balanceAmount: 0
    };

    return result;
  } catch (error) {
    console.error('[getContactLensDetails] Exception:', error);
    throw error;
  }
};

// Helper to get prescription details (no items, but log for completeness)
const getPrescriptionDetails = async (prescriptionId: string) => {
  console.log(`[getPrescriptionDetails] Fetching prescription: ${prescriptionId}`);
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (error || !data) {
      console.error('[getPrescriptionDetails] Error:', error);
      throw error;
    }
    console.log('[getPrescriptionDetails] Found prescription:', data);
    return data;
  } catch (error) {
    console.error('[getPrescriptionDetails] Exception:', error);
    throw error;
  }
};

/**
 * Formats a search result for display in the UI
 */
export const formatSearchResult = (result: UnifiedSearchResult) => {
  return {
    id: result.id,
    label: `${result.name} (${result.referenceNo})`,
    subLabel: [
      result.mobile,
      result.jobType,
      new Date(result.date).toLocaleDateString(),
      `Items: ${result.itemCount}`
    ].filter(Boolean).join(' • '),
    sourceType: result.sourceType,
    originalData: result.originalData
  };
};

/**
 * @deprecated Use getRecordDetails instead
 * Fetches and returns detailed customer information from various sources
 * @param customer Customer object with at least an ID or mobile number
 * @returns Detailed customer information or null if not found
 */
export const getCustomerDetails = async (customer: CustomerSearchResult) => {
  try {
    let query;
    
    if (customer.source === 'prescription') {
      query = supabase
        .from('prescriptions')
        .select('*')
        .eq('id', customer.id)
        .single();
    } else if (customer.source === 'ordercard') {
      query = supabase
        .from('orders')
        .select(`
          *,
          prescriptions (
            id,
            name,
            mobile_no,
            phone_landline,
            email,
            address,
            city,
            state,
            pin_code
          )
        `)
        .eq('id', customer.id)
        .single();
    } else if (customer.source === 'contact_lens') {
      query = supabase
        .from('contact_lens_prescriptions')
        .select(`
          *,
          prescriptions (
            id,
            name,
            mobile_no,
            phone_landline,
            email,
            address,
            city,
            state,
            pin_code
          )
        `)
        .eq('id', customer.id)
        .single();
    }

    if (!query) {
      throw new Error('Invalid customer source');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Customer not found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching customer details:', error);
    throw error;
  }
};

/**
 * Fetches purchase history for a customer across all sources (orders, prescriptions, contact lens)
 * @param mobileNo Customer's mobile number or phone number
 * @returns Array of purchase history items
 */
export const getCustomerPurchaseHistory = async (mobileNo: string) => {
  try {
    console.log('Fetching purchase history for mobile:', mobileNo);
    if (!mobileNo) {
      console.error('No mobile number provided for purchase history lookup');
      return [];
    }
    
    // Initialize variables
    const allItems: any[] = [];
    let customerPrescriptionIds: string[] = [];
    
    // 1. Get prescriptions with only the columns that exist in the database
    const { data: prescriptionsData, error: rxError } = await supabase
      .from('prescriptions')
      .select('*')
      .or(`mobile_no.ilike.%${mobileNo}%,phone_landline.ilike.%${mobileNo}%`)
      .order('date', { ascending: false });
    
    const customerPrescriptions = (prescriptionsData || []) as Prescription[];
    if (rxError) {
      console.error('Error fetching prescriptions:', rxError);
      throw rxError;
    }
    
    // 2. Get orders with order items (via prescriptions)
    const { data: ordersData, error: orderError } = await supabase
      .from('prescriptions')
      .select('*, orders(*, order_items(*))')
      .or(`mobile_no.ilike.%${mobileNo}%,phone_landline.ilike.%${mobileNo}%`)
      .order('order_date', { foreignTable: 'orders', ascending: false });
    
    if (orderError) {
      console.error('Error fetching orders:', orderError);
      throw orderError;
    }
    
    // 3. Get contact lens prescriptions with items and all relevant details
    let clPrescriptionsData: any[] = [];
    
    try {
      console.log('Fetching contact lens prescriptions for mobile:', mobileNo);
      
      // Get all contact lens prescriptions with related data in a single query
      const { data: clPrescriptions, error: clError } = await supabase
        .from('contact_lens_prescriptions')
        .select('*, prescriptions!inner(*), contact_lens_items(*)')
        .or(`prescriptions.mobile_no.ilike.%${mobileNo}%,prescriptions.phone_landline.ilike.%${mobileNo}%`)
        .order('created_at', { ascending: false });
      
      if (clError) {
        console.error('Error fetching contact lens prescriptions:', clError);
        throw clError;
      }
      
      if (clPrescriptions) {
        // Map the prescriptions data to the expected format
        clPrescriptionsData = clPrescriptions.map(cl => ({
          ...cl,
          prescriptions: [cl.prescriptions],
          contact_lens_items: Array.isArray(cl.contact_lens_items) 
            ? cl.contact_lens_items 
            : []
        }));
      }
      
      // Also fetch by prescription IDs if available
      customerPrescriptionIds = customerPrescriptions?.map(p => p.id) || [];
      if (customerPrescriptionIds.length > 0) {
        console.log(`Found ${customerPrescriptionIds.length} prescription IDs for contact lens search`);
        
        const { data: clPrescriptionsById, error: clByIdError } = await supabase
          .from('contact_lens_prescriptions')
          .select('*, prescriptions!inner(*), contact_lens_items(*)')
          .in('prescription_id', customerPrescriptionIds)
          .order('created_at', { ascending: false });
          
        if (clByIdError) {
          console.error('Error fetching contact lens prescriptions by ID:', clByIdError);
          throw clByIdError;
        }
        
        console.log(`Found ${clPrescriptionsById?.length || 0} contact lens prescriptions by ID`);
        
        if (clPrescriptionsById) {
          // Merge with existing data, avoiding duplicates
          const newPrescriptions = clPrescriptionsById
            .filter(cl => !clPrescriptionsData.some(existing => existing.id === cl.id))
            .map(cl => ({
              ...cl,
              prescriptions: [cl.prescriptions],
              contact_lens_items: Array.isArray(cl.contact_lens_items) 
                ? cl.contact_lens_items 
                : []
            }));
          
          clPrescriptionsData = [...clPrescriptionsData, ...newPrescriptions];
        }
      }
    } catch (error) {
      console.error('Error in contact lens prescription processing:', error);
      // Continue with whatever data we have if there's an error
    }
    // Helper function to format prescription details
    const formatPrescriptionDetails = (rx: Prescription) => {
      const details = [];
      
      // Right eye details
      if (rx.re_sphere || rx.re_cylinder || rx.re_axis) {
        const reDetails = [
          'RE:',
          rx.re_sphere && `Sph: ${rx.re_sphere}`,
          rx.re_cylinder && `Cyl: ${rx.re_cylinder}`,
          rx.re_axis && `Axis: ${rx.re_axis}`,
          rx.re_add && `Add: ${rx.re_add}`,
          rx.re_va && `VA: ${rx.re_va}`
        ].filter(Boolean).join(' ');
        details.push(reDetails);
      }
      
      // Left eye details
      if (rx.le_sphere || rx.le_cylinder || rx.le_axis) {
        const leDetails = [
          'LE:',
          rx.le_sphere && `Sph: ${rx.le_sphere}`,
          rx.le_cylinder && `Cyl: ${rx.le_cylinder}`,
          rx.le_axis && `Axis: ${rx.le_axis}`,
          rx.le_add && `Add: ${rx.le_add}`,
          rx.le_va && `VA: ${rx.le_va}`
        ].filter(Boolean).join(' ');
        details.push(leDetails);
      }
      
      // PD and other details
      if (rx.pd_od || rx.pd_os) {
        details.push(`PD: OD ${rx.pd_od || '-'} / OS ${rx.pd_os || '-'}`);
      }
      
      return details.join(' | ');
    };

    // Map and combine all data
    // allItems is already declared at the top of the function

    // Map prescriptions with enhanced details
    (prescriptionsData || []).forEach((rx: Prescription) => {
      try {
        const rxDate = rx.date ? new Date(rx.date) : new Date();
        const prescriptionDetails = formatPrescriptionDetails(rx);
        const itemName = [
          rx.vision_type || 'Eye Examination',
          rx.doctor_name && `(Dr. ${rx.doctor_name})`
        ].filter(Boolean).join(' ');
        
        allItems.push({
          id: `rx_${rx.id || ''}`,
          date: rx.date || new Date().toISOString(),
          dateFormatted: rxDate.toLocaleDateString(),
          type: 'prescription',
          referenceNo: rx.prescription_no || `RX-${Date.now()}`,
          item_name: itemName,
          item_code: `RX-${rx.vision_type?.substring(0, 3).toUpperCase() || 'EXAM'}`,
          item_details: prescriptionDetails,
          quantity: 1,
          rate: 0,
          amount: 0,
          balance_amount: 0,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 0,
          doctor_name: rx.doctor_name,
          vision_type: rx.vision_type,
          _originalPurchase: rx,
          _prescriptionDetails: {
            re_sphere: rx.re_sphere,
            re_cylinder: rx.re_cylinder,
            re_axis: rx.re_axis,
            re_add: rx.re_add,
            re_va: rx.re_va,
            le_sphere: rx.le_sphere,
            le_cylinder: rx.le_cylinder,
            le_axis: rx.le_axis,
            le_add: rx.le_add,
            le_va: rx.le_va,
            pd_od: rx.pd_od,
            pd_os: rx.pd_os,
            remarks: rx.remarks
          }
        });
      } catch (error) {
        console.error('Error processing prescription:', rx, error);
      }
    });

    // Helper function to format order item details
    const formatOrderItemDetails = (item: any) => {
      const details = [];
      
      // Frame details
      if (item.item_type === 'frame') {
        if (item.brand_name) details.push(`Brand: ${item.brand_name}`);
        if (item.material) details.push(`Material: ${item.material}`);
        if (item.color) details.push(`Color: ${item.color}`);
        if (item.size) details.push(`Size: ${item.size}`);
      }
      
      // Lens details
      if (item.item_type === 'lens') {
        if (item.lens_type) details.push(`Type: ${item.lens_type}`);
        if (item.coating) details.push(`Coating: ${item.coating}`);
        if (item.index) details.push(`Index: ${item.index}`);
        if (item.sph || item.cyl || item.axis) {
          details.push(`Rx: ${item.sph || ''} ${item.cyl || ''} ${item.axis || ''}`.trim());
        }
        if (item.add) details.push(`Add: ${item.add}`);
        if (item.pd) details.push(`PD: ${item.pd}`);
      }
      
      return details.join(' | ');
    };

    // Map orders with enhanced details
    // Use the already declared customerPrescriptionIds
    (ordersData || []).forEach((prescription: any) => {
      if (prescription.orders && Array.isArray(prescription.orders)) {
        prescription.orders.forEach((order: any) => {
          if (order.order_items && Array.isArray(order.order_items)) {
            order.order_items.forEach((item: any) => {
              try {
                const orderDate = order.order_date ? new Date(order.order_date) : new Date();
                const itemDetails = formatOrderItemDetails(item);
                const itemName = [
                  item.item_name,
                  item.brand_name && `(${item.brand_name})`,
                  item.lens_type && `[${item.lens_type}]`
                ].filter(Boolean).join(' ');
                
                allItems.push({
                  id: `order_${order.id || 'unknown'}_${item.id || 'item'}`,
                  type: 'order',
                  item_type: item.item_type || 'other',
                  date: order.order_date || new Date().toISOString(),
                  dateFormatted: orderDate.toLocaleDateString(),
                  referenceNo: order.order_no || `ORDER-${Date.now()}`,
                  item_name: itemName || 'Unnamed Item',
                  item_code: item.item_code || `${item.item_type?.toUpperCase().substring(0, 3) || 'ITM'}-${item.id || 'UNK'}`,
                  item_details: itemDetails,
                  quantity: Number(item.qty) || 1,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                  balance_amount: 0,
                  discount_percent: Number(item.discount_percent) || 0,
                  discount_amount: Number(item.discount_amount) || 0,
                  tax_percent: Number(item.tax_percent) || 0,
                  status: order.status,
                  delivery_date: order.delivery_date,
                  remarks: order.remarks,
                  _originalPurchase: order,
                  _originalItem: item,
                  _prescriptionNo: prescription.prescription_no
                });
              } catch (error) {
                console.error('Error processing order item:', item, error);
              }
            });
          }
        });
      }
    });

    // Helper function to format contact lens details
    const formatContactLensDetails = (item: any) => {
      const details = [];
      
      // Eye side mapping (RE/LE/'')
      const eyeSide = item.eye_side === 'Right' ? 'RE' : item.eye_side === 'Left' ? 'LE' : '';
      
      // Add eye side if not both
      if (eyeSide) {
        details.push(`Eye: ${eyeSide}`);
      }
      
      // Lens details
      if (item.brand) details.push(`Brand: ${item.brand}`);
      if (item.material) details.push(`Material: ${item.material}`);
      if (item.base_curve) details.push(`BC: ${item.base_curve}`);
      if (item.diameter) details.push(`DIA: ${item.diameter}`);
      if (item.power) details.push(`Power: ${item.power}`);
      if (item.cylinder) details.push(`Cyl: ${item.cylinder}`);
      if (item.axis) details.push(`Axis: ${item.axis}`);
      if (item.add_power) details.push(`Add: ${item.add_power}`);
      
      // Disposal and replacement
      if (item.dispose) details.push(`Disposal: ${item.dispose}`);
      if (item.replacement_schedule) details.push(`Replace: ${item.replacement_schedule}`);
      
      // Solution details if available
      if (item.solution_brand) details.push(`Solution: ${item.solution_brand}`);
      
      return details.join(' | ');
    };

    // Map contact lens prescriptions with enhanced details
    (clPrescriptionsData || []).forEach((cl: any) => {
      try {
        if (!cl.contact_lens_items || !Array.isArray(cl.contact_lens_items)) {
          console.warn('No contact lens items found for prescription:', cl.id);
          return;
        }
        
        const prescription = cl.prescriptions?.[0] || {};
        const prescriptionNo = cl.prescription_no || prescription.prescription_no || `CL-${Date.now()}`;
        const itemDate = cl.created_at ? new Date(cl.created_at) : new Date();
        
        cl.contact_lens_items.forEach((item: any) => {
          try {
            const eyeSide = item.eye_side === 'Right' ? 'RE' : item.eye_side === 'Left' ? 'LE' : '';
            const itemDetails = formatContactLensDetails(item);
            const itemName = [
              item.brand || 'Contact Lens',
              item.material,
              item.power ? `(${item.power}${item.cylinder ? `/${item.cylinder}` : ''}${item.axis ? `x${item.axis}` : ''}${item.add_power ? ` Add ${item.add_power}` : ''})` : '',
              eyeSide ? `[${eyeSide}]` : ''
            ].filter(Boolean).join(' ').trim();
            
            allItems.push({
              id: `cl_${cl.id || 'unknown'}_${item.id || 'item'}`,
              type: 'contact_lens',
              date: cl.created_at || new Date().toISOString(),
              dateFormatted: itemDate.toLocaleDateString(),
              referenceNo: prescriptionNo,
              item_name: itemName,
              item_code: `CL-${item.brand?.substring(0, 3).toUpperCase() || 'LENS'}`,
              item_details: itemDetails,
              quantity: Number(item.quantity) || 1,
              rate: Number(item.rate) || 0,
              amount: Number(item.amount) || 0,
              balance_amount: 0,
              discount_percent: Number(item.discount_percent) || 0,
              discount_amount: Number(item.discount_amount) || 0,
              tax_percent: Number(item.tax_percent) || 0,
              eye_side: eyeSide,
              brand: item.brand,
              material: item.material,
              power: item.power,
              cylinder: item.cylinder,
              axis: item.axis,
              add_power: item.add_power,
              base_curve: item.base_curve,
              diameter: item.diameter,
              disposal: item.dispose,
              replacement_schedule: item.replacement_schedule,
              solution_brand: item.solution_brand,
              expiry_date: item.expiry_date,
              batch_number: item.batch_number,
              _originalPurchase: {
                ...cl,
                prescription: prescription
              },
              _originalItem: item,
              _prescriptionNo: prescriptionNo
            });
          } catch (itemError) {
            console.error('Error processing contact lens item:', item, itemError);
          }
        });
      } catch (clError) {
        console.error('Error processing contact lens prescription:', cl, clError);
      }
    });

    // Sort all items by date (newest first)
    allItems.sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // Sort in descending order (newest first)
    });

    console.log('Successfully fetched and processed purchase history:', {
      prescriptions: customerPrescriptions?.length || 0,
      orders: (ordersData || []).length,
      contactLensPrescriptions: (clPrescriptionsData || []).length,
      totalItems: allItems.length
    });

    return allItems;
  } catch (error) {
    console.error('Error in getCustomerPurchaseHistory:', error);
    throw error;
  }
}
