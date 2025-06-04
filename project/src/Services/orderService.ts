// src/Services/orderService.ts
import { supabase } from './supabaseService';

// Types for order data
interface OrderItem {
  si: number;
  itemType: string;
  itemCode: string;
  itemName: string;
  rate: number;
  qty: number;
  amount: number;
  taxPercent: number;
  discountPercent: number;
  discountAmount: number;
  brandName?: string;
  index?: string;
  coating?: string;
}

interface OrderPayment {
  paymentEstimate: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  advanceCash: number;
  advanceCardUpi: number;
  advanceOther: number;
  scheduleAmount: number;
}

interface OrderData {
  prescriptionId: string;
  orderNo: string;
  billNo?: string;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  remarks?: string;
  items: OrderItem[];
  payment: OrderPayment;
}

// Generate a unique order number with prefix ORD-YYYYMMDD-XXX
const generateOrderNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
};

// Generate a unique bill number with prefix BILL-YYYYMMDD-XXX
const generateBillNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `BILL-${year}${month}${day}-${random}`;
};

// Save order with items and payment details to Supabase
export const saveOrder = async (orderData: OrderData): Promise<{ success: boolean; message: string; orderId?: string }> => {
  try {
    console.log('====================== SAVE ORDER DEBUG START ======================');
    console.log('Saving order data:', JSON.stringify(orderData, null, 2));
    console.log('Connection info:', {
      functions: Object.keys(supabase).join(', ')
    });
    
    // Check if the tables exist in the database
    console.log('Checking database schema for order tables...');
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['orders', 'order_items', 'order_payments']);
        
      console.log('Schema check result:', {
        success: !schemaError, 
        tables: schemaData ? schemaData.map(t => t.table_name).join(', ') : 'No tables found',
        error: schemaError ? schemaError.message : null
      });
      
      // If no tables were found, let's explain why this might be happening
      if (!schemaData || schemaData.length === 0) {
        console.warn('⚠️ ORDER TABLES NOT FOUND IN DATABASE ⚠️');
        console.warn('Possible causes:');
        console.warn('1. The tables were added to schema.sql but not executed in the database');
        console.warn('2. The schema.sql changes were not saved or committed');
        console.warn('3. The tables have different names than expected');
        console.warn('4. There might be permission issues');
      }
    } catch (schemaCheckErr) {
      console.error('Schema check failed:', schemaCheckErr);
    }
    
    // Test connection first
    console.log('Testing database connection...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('prescriptions')
        .select('id')
        .limit(1);
        
      console.log('Database connection test:', { success: !testError, error: testError?.message, data: testData });
    } catch (testErr) {
      console.error('Connection test failed:', testErr);
    }
    
    // Check if tables exist
    console.log('Checking if tables exist...');
    try {
      const { data: orderTableInfo, error: tableError } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
        
      console.log('Order table check:', { exists: !tableError, error: tableError ? tableError.message : null });
    } catch (tableErr) {
      console.error('Table check failed:', tableErr);
    }
    
    // Let's check if the prescription actually exists first
    console.log(`Verifying prescription ID exists: ${orderData.prescriptionId}`);
    try {
      const { data: prescriptionCheck, error: prescriptionCheckError } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('id', orderData.prescriptionId);
        
      if (prescriptionCheckError || !prescriptionCheck || prescriptionCheck.length === 0) {
        console.error('⚠️ Prescription ID verification failed:', {
          error: prescriptionCheckError?.message,
          prescriptionFound: prescriptionCheck && prescriptionCheck.length > 0
        });
      } else {
        console.log('✅ Prescription ID verified:', prescriptionCheck[0].id);
      }
    } catch (prescCheckErr) {
      console.error('Prescription check error:', prescCheckErr);
    }
    
    // Create order with explicit debug info
    console.log('Attempting to create order record...');
    const orderInsertData = {
      prescription_id: orderData.prescriptionId,
      order_no: orderData.orderNo,
      bill_no: orderData.billNo,
      order_date: orderData.orderDate,
      delivery_date: orderData.deliveryDate,
      status: orderData.status,
      remarks: orderData.remarks
    };
    
    console.log('Order insert data:', orderInsertData);
    console.log('Order insert data (JSON):', JSON.stringify(orderInsertData, null, 2));
    console.log('Order insert data (stringified):', JSON.stringify(orderInsertData));
    
    // Try to insert with explicit error handling
    let order = null;
    let orderError = null;
    
    try {
      const result = await supabase
        .from('orders')
        .insert({
        prescription_id: orderData.prescriptionId,
        order_no: orderData.orderNo || generateOrderNo(),
        bill_no: orderData.billNo || generateBillNo(),
        order_date: orderData.orderDate,
        delivery_date: orderData.deliveryDate,
        status: orderData.status,
        remarks: orderData.remarks
      })
      .select()
      .single();
      
      order = result.data;
      orderError = result.error;
      
      // Check the raw response for more detailed debug info
      console.log('Raw order insert response:', result);
    } catch (insertErr) {
      console.error('❌ Order insert exception:', insertErr);
      orderError = { message: `Exception during insert: ${insertErr instanceof Error ? insertErr.message : 'Unknown error'}` };
    }
    
    if (orderError) {
      console.error('Error saving order:', orderError);
      return { success: false, message: `Error saving order: ${orderError.message}` };
    }
    
    console.log('Order saved successfully:', order);
    const orderId = order.id;
    
    console.log('Order created successfully:', order);
    console.log('Creating order items...');
    
    // Create order items, mapping carefully to schema fields
    const orderItems = orderData.items.map(item => {
      // Create a clean object with exact column names
      const mappedItem = {
        order_id: orderId,
        si: item.si,
        item_type: item.itemType,
        item_code: item.itemCode,
        item_name: item.itemName,
        rate: item.rate,
        qty: item.qty,
        amount: item.amount,
        tax_percent: item.taxPercent,
        discount_percent: item.discountPercent,
        discount_amount: item.discountAmount,
        brand_name: item.brandName,
        index: item.index,
        coating: item.coating
      };
      
      // Log each item for debugging
      console.log(`Mapped order item ${item.si}:`, mappedItem);
      
      return mappedItem;
    });
    
    console.log('Order items prepared:', orderItems);
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
      
    console.log('Order items insertion result:', { success: !itemsError, error: itemsError ? itemsError.message : null });
    
    if (itemsError) {
      console.error('Error saving order items:', itemsError);
      // Consider rolling back the order if items can't be saved
      await supabase.from('orders').delete().eq('id', orderId);
      return { success: false, message: `Error saving order items: ${itemsError.message}` };
    }
    
    // Create order payment with careful field mapping
    console.log('Creating order payment...');
    const paymentData = {
      order_id: orderId,
      payment_estimate: typeof orderData.payment.paymentEstimate === 'string' ? 
        parseFloat(orderData.payment.paymentEstimate) : 
        orderData.payment.paymentEstimate,
      tax_amount: typeof orderData.payment.taxAmount === 'string' ? 
        parseFloat(orderData.payment.taxAmount) : 
        orderData.payment.taxAmount,
      discount_amount: typeof orderData.payment.discountAmount === 'string' ? 
        parseFloat(orderData.payment.discountAmount) : 
        orderData.payment.discountAmount,
      final_amount: typeof orderData.payment.finalAmount === 'string' ? 
        parseFloat(orderData.payment.finalAmount) : 
        orderData.payment.finalAmount,
      advance_cash: typeof orderData.payment.advanceCash === 'string' ? 
        parseFloat(orderData.payment.advanceCash) : 
        orderData.payment.advanceCash,
      advance_card_upi: typeof orderData.payment.advanceCardUpi === 'string' ? 
        parseFloat(orderData.payment.advanceCardUpi) : 
        orderData.payment.advanceCardUpi,
      advance_other: typeof orderData.payment.advanceOther === 'string' ? 
        parseFloat(orderData.payment.advanceOther) : 
        orderData.payment.advanceOther,
      schedule_amount: typeof orderData.payment.scheduleAmount === 'string' ? 
        parseFloat(orderData.payment.scheduleAmount) : 
        orderData.payment.scheduleAmount
    };
    
    console.log('Payment data:', paymentData);
    const { error: paymentError } = await supabase
      .from('order_payments')
      .insert({
        order_id: orderId,
        payment_estimate: orderData.payment.paymentEstimate,
        tax_amount: orderData.payment.taxAmount,
        discount_amount: orderData.payment.discountAmount,
        final_amount: orderData.payment.finalAmount,
        advance_cash: orderData.payment.advanceCash,
        advance_card_upi: orderData.payment.advanceCardUpi,
        advance_other: orderData.payment.advanceOther,
        schedule_amount: orderData.payment.scheduleAmount
      });
    
    if (paymentError) {
      console.error('Error saving order payment:', paymentError);
      // Consider rolling back the order and items if payment can't be saved
      await supabase.from('order_items').delete().eq('order_id', orderId);
      await supabase.from('orders').delete().eq('id', orderId);
      return { success: false, message: `Error saving order payment: ${(paymentError as any).message}` };
    }
    
    console.log('Payment insertion result:', { success: !paymentError, error: paymentError ? (paymentError as any).message : null });
    console.log('====================== SAVE ORDER DEBUG END ======================');
    
    return { 
      success: true, 
      message: 'Order saved successfully', 
      orderId 
    };
  } catch (error) {
    console.error('====================== SAVE ORDER ERROR ======================');
    console.error('Unexpected error saving order:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Get all orders for a prescription
export const getOrdersByPrescriptionId = async (prescriptionId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_payments(*)
      `)
      .eq('prescription_id', prescriptionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      return { success: false, message: error.message, data: null };
    }

    console.log('Orders found:', data);
    return { 
      success: true, 
      message: 'Orders fetched successfully', 
      data 
    };
  } catch (error) {
    console.error('Unexpected error fetching orders:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};

// Get order by ID with all related items and payment details
export const getOrderById = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_payments(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (error) {
      console.error('Error fetching order:', error);
      return { success: false, message: error.message, data: null };
    }

    console.log('Order found:', data);
    return { 
      success: true, 
      message: 'Order fetched successfully', 
      data 
    };
  } catch (error) {
    console.error('Unexpected error fetching order:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data: null
    };
  }
};

export const orderService = {
  saveOrder,
  getOrdersByPrescriptionId,
  getOrderById,
  generateOrderNo,
  generateBillNo
};
