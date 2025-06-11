import React, { useState, useEffect } from 'react';
import { X, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodayDate } from '../../utils/helpers';
import CustomerSearch from './CustomerSearch';
import { getCustomerDetails, getCustomerPurchaseHistory } from '../../Services/billingService';

interface PurchaseHistory {
  id: string;
  type: string;
  prescription_no?: string;
  order_no?: string;
  date: string;
  total_amount?: number;
}

// Define the interface for billing items
interface BillingItem {
  id: string;
  selected: boolean;
  itemCode: string;
  itemName: string;
  orderNo: string;
  rate: string;
  taxPercent: string;
  quantity: string;
  amount: string;
  discount: string;
  discountPercent: string;
  _originalPurchase?: any;
  [key: string]: any;
}

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cashMemo, setCashMemo] = useState('B1920-030');
  const [referenceNo, setReferenceNo] = useState('B1920-030');
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  // Format time in 24-hour format for HTML input[type="time"]
  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5); // Returns HH:MM
  };
  
  const [currentTime, setCurrentTime] = useState(formatTimeForInput(new Date()));
  const [jobType, setJobType] = useState('');
  const [bookingBy, setBookingBy] = useState('');
  const [itemName, setItemName] = useState('');
  const [prescBy, setPrescBy] = useState('');
  
  // Personal Information
  const [namePrefix, setNamePrefix] = useState('Mr.');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [ccode, setCcode] = useState('');
  const [isCash, setIsCash] = useState(false);
  
  // Customer data and purchase history
  const [customerPurchaseHistory, setCustomerPurchaseHistory] = useState<Array<PurchaseHistory & { [key: string]: any }>>([]);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  
  // Billing items state
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  
  // Start with an empty array - items will be loaded when a customer is selected
  useEffect(() => {
    setBillingItems([]);
  }, []);

  // Handle customer selection from search
  const handleCustomerSelect = async (customer: any) => {
    try {
      console.log('Customer selected from search:', customer);
      setIsLoadingCustomer(true);
      
      // Clear previous customer data
      setName('');
      setMobile('');
      setEmail('');
      setAddress('');
      setCity('');
      setState('');
      setPin('');
      setAge('');
      
      // Start with empty billing items
      setBillingItems([]);
      console.log('Cleared previous billing items');
      
      // TEMP: Don't set any default billing items yet
      // setBillingItems([1, 2, 3].map(id => ({
      //   id: id.toString(),
      //   selected: false,
      //   itemCode: '',
      //   itemName: '',
      //   orderNo: '',
      //   rate: '0',
      //   taxPercent: '0',
      //   quantity: '1',
      //   amount: '0',
      //   discount: '0',
      //   discountPercent: '0',
      //   _originalPurchase: null
      // })));
      
      // Fetch full customer details from their original table
      console.log('Fetching detailed customer data...');
      const detailedCustomerData = await getCustomerDetails(customer);
      console.log('Detailed customer data:', detailedCustomerData);

      // Use detailed data if available, otherwise fall back to search result data
      const customerData = detailedCustomerData || customer;
      const mobileNo = customerData.mobile_no || customer.mobile_no || customer.mobile || customer.phone;
      
      if (!mobileNo) {
        console.error('No mobile number found for customer');
        return;
      }

      // Populate form fields with customer data
      console.log('Setting customer details from data');
      const customerName = customerData.name || customerData.customer_name || '';
      
      // Extract name prefix if present (e.g., "Mr. John Doe" -> "Mr.")
      const nameParts = customerName.split(' ');
      const possiblePrefix = nameParts[0].endsWith('.') ? nameParts[0] : '';
      const nameWithoutPrefix = possiblePrefix ? nameParts.slice(1).join(' ') : customerName;
      
      if (possiblePrefix && namePrefixOptions.includes(possiblePrefix)) {
        setNamePrefix(possiblePrefix);
        setName(nameWithoutPrefix);
      } else {
        setName(customerName);
      }
      
      setMobile(mobileNo);
      setEmail(customerData.email || '');
      setAddress(customerData.address || '');
      setCity(customerData.city || '');
      setState(customerData.state || '');
      setPin(customerData.pin_code || customerData.pin || '');
      
      if (customerData.age) {
        setAge(customerData.age.toString());
      }
      
      // Get purchase history for the customer
      console.log('Fetching purchase history for mobile:', mobileNo);
      const purchaseHistoryResponse = await getCustomerPurchaseHistory(mobileNo);
      
      // Ensure we have an array of purchase history items and filter out non-billable items
      let purchaseHistoryItems: Array<PurchaseHistory & { [key: string]: any }> = [];
      
      // Helper function to determine if an item should be included
      const shouldIncludeItem = (item: any) => {
        // Always include orders
        if (item.type === 'order') return true;
        
        // Only include prescriptions that have actual billable content
        if (item.type === 'prescription') {
          // Exclude system prescriptions like 'Eye Examination'
          if (item.item_name === 'Eye Examination') return false;
          
          // Include prescriptions that have items or are marked as billable
          return (item.items && item.items.length > 0) || 
                 item.is_billable === true ||
                 (item.item_name && item.item_name.trim() !== '');
        }
        
        // Include contact lens items by default
        if (item.type === 'contact_lens') return true;
        
        // Default to excluding anything else
        return false;
      };
      
      if (Array.isArray(purchaseHistoryResponse)) {
        purchaseHistoryItems = purchaseHistoryResponse.filter(shouldIncludeItem);
      } else if (purchaseHistoryResponse && typeof purchaseHistoryResponse === 'object') {
        if (shouldIncludeItem(purchaseHistoryResponse)) {
          purchaseHistoryItems = [purchaseHistoryResponse];
        }
      }
      
      console.log('Filtered purchase history items:', purchaseHistoryItems);
      
      console.log('Raw purchase history data:', {
        data: purchaseHistoryItems,
        count: purchaseHistoryItems.length
      });
      
      // Log details of each item
      purchaseHistoryItems.forEach((item, index) => {
        console.log(`Purchase history item ${index + 1}:`, {
          id: item.id,
          type: item.type,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity: item.quantity,
          amount: item.amount,
          date: item.date,
          _originalItem: item._originalItem,
          _originalPurchase: item._originalPurchase
        });
      });
      
      // Update state with the purchase history items
      console.log('Setting purchase history with items:', purchaseHistoryItems.length);
      setCustomerPurchaseHistory(purchaseHistoryItems);
      
      // Auto-populate billing items with recent purchases
      if (purchaseHistoryItems.length > 0) {
        console.log('Populating billing items with history');
        try {
          const populatedItems = [];
          let itemCount = 0;
          const maxItems = 3; // Maximum number of items to show initially
          
          // Process each history item
          for (const purchase of purchaseHistoryItems) {
            if (itemCount >= maxItems) break;
            
            console.log(`Processing purchase:`, purchase);
            
            // Log the full purchase object for debugging
            console.log('Processing purchase details:', JSON.parse(JSON.stringify(purchase)));
            
            // Handle order items (from order table)
            if (purchase.type === 'order') {
              // If we have _originalItem, it's an order item
              if (purchase._originalItem) {
                const item = purchase._originalItem;
                const itemName = item.item_name || item.lens_type || item.product_name || 'Order Item';
                const itemCode = item.item_code || item.product_code || `ITEM-${itemCount}`;
                const orderNo = purchase.referenceNo || purchase.order_no || `ORDER-${purchase.id}`;
                const rate = item.rate || item.unit_price || 0;
                const quantity = item.quantity || 1;
                const taxPercent = item.tax_percent || 0;
                const discountPercent = typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0');
                const discountAmount = typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0');
                const amount = item.amount || (rate * quantity);
                
                populatedItems.push({
                  id: `order_${purchase.id}_${item.id || itemCount}`,
                  selected: false,
                  itemCode: itemCode,
                  itemName: itemName,
                  orderNo: orderNo,
                  rate: rate.toFixed(2),
                  taxPercent: taxPercent.toFixed(2),
                  quantity: quantity.toString(),
                  amount: amount.toFixed(2),
                  discount: discountAmount.toFixed(2),
                  discountPercent: discountPercent.toFixed(2),
                  _originalPurchase: {
                    ...purchase,
                    // Ensure we preserve the original values
                    discount_amount: typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0'),
                    discount_percent: typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0'),
                    rate: item.rate || 0,
                    amount: item.amount || 0,
                    tax_percent: item.tax_percent || 0,
                    quantity: item.quantity || 1,
                    item_name: item.item_name || itemName,
                    item_code: item.item_code || `ITEM-${itemCount}`
                  }
                });
                itemCount++;
              }
              // If we have order_items array, process each item
              else if (purchase._originalPurchase?.order_items) {
                for (const item of purchase._originalPurchase.order_items) {
                  if (itemCount >= maxItems) break;
                  
                  const itemName = item.item_name || 
                                 (item.lens_type ? `${item.lens_type} Lenses` : 'Order Item');
                  
                  populatedItems.push({
                    id: `${purchase.id}_${item.id || itemCount}`,
                    selected: false,
                    itemCode: item.item_code || `ITEM-${itemCount}`,
                    itemName: itemName,
                    orderNo: purchase.referenceNo || purchase.order_no || `ORDER-${purchase.id}`,
                    rate: (item.rate || 0).toFixed(2),
                    taxPercent: (item.tax_percent || 0).toFixed(2),
                    quantity: (item.quantity || 1).toString(),
                    amount: (item.amount || 0).toFixed(2),
                    discount: (typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0')).toFixed(2),
                    discountPercent: (typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0')).toFixed(2),
                    _originalPurchase: {
                      ...purchase,
                      ...item,
                      // Ensure we preserve the original values
                      discount_amount: typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0'),
                      discount_percent: typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0'),
                      rate: item.rate || 0,
                      amount: item.amount || 0,
                      tax_percent: item.tax_percent || 0,
                      quantity: item.quantity || 1,
                      item_name: item.item_name || itemName,
                      item_code: item.item_code || `ITEM-${itemCount}`
                    }
                  });
                  itemCount++;
                }
              }
            } 
            // Handle contact lens items
            else if (purchase.type === 'contact_lens' || purchase.sourceType === 'contact_lens' || 
                    (purchase._originalPurchase?.contact_lens_items?.length > 0)) {
              const items = purchase.items || purchase._originalPurchase?.contact_lens_items || [];
              
              for (const item of items) {
                if (itemCount >= maxItems) break;
                
                // Map contact lens side from database to UI values
                const side = item.eye_side === 'Right' ? 'RE' : 
                            item.eye_side === 'Left' ? 'LE' : '';
                
                // Get all relevant fields with fallbacks
                const brand = item.brand || item.brand_name || '';
                const material = item.material || '';
                const power = item.power || item.sph || '';
                const baseCurve = item.base_curve || item.bc || '';
                const diameter = item.diameter || item.dia || '';
                const quantity = item.quantity || 1;
                const rate = item.rate || item.unit_price || 0;
                const taxPercent = item.tax_percent || 0;
                const discountPercent = typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0');
                const discountAmount = typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0');
                const amount = item.amount || (rate * quantity) || 0;
                
                // Build a descriptive name for contact lenses
                const itemName = [
                  brand || 'Contact Lens',
                  material,
                  power,
                  side,
                  baseCurve ? `BC:${baseCurve}` : '',
                  diameter ? `DIA:${diameter}` : ''
                ].filter(Boolean).join(' ').trim();
                
                populatedItems.push({
                  id: `cl_${purchase.id}_${item.id || itemCount}`,
                  selected: false,
                  itemCode: item.item_code || `CL-${item.id || itemCount}`,
                  itemName: itemName || 'Contact Lens',
                  orderNo: purchase.prescription_no || purchase.referenceNo || `CL-${purchase.id}`,
                  rate: (item.rate || 0).toString(),
                  taxPercent: (item.tax_percent || 0).toString(),
                  quantity: (item.quantity || 1).toString(),
                  amount: amount.toString(),
                  discount: (typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0')).toFixed(2),
                  discountPercent: (typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0')).toFixed(2),
                  _originalPurchase: { 
                    ...purchase, 
                    ...item,
                    // Ensure we preserve the original discount values
                    discount_amount: typeof item.discount_amount === 'number' ? item.discount_amount : parseFloat(item.discount_amount || '0'),
                    discount_percent: typeof item.discount_percent === 'number' ? item.discount_percent : parseFloat(item.discount_percent || '0'),
                    // Ensure we have all required fields for contact lens items
                    brand: item.brand,
                    material: item.material,
                    power: item.power,
                    base_curve: item.base_curve,
                    diameter: item.diameter,
                    quantity: item.quantity || 1,
                    rate: item.rate || 0,
                    amount: item.amount || 0
                  }
                });
                itemCount++;
              }
            } 
            // Handle prescription items
            else if (purchase.type === 'prescription' || purchase.sourceType === 'prescription') {
              const identifier = purchase.prescription_no || purchase.referenceNo || `RX-${purchase.id}`;
              const amount = purchase.amount || purchase.total_amount || 0;
              const discountAmount = purchase.discount_amount || 0;
              const discountPercent = purchase.discount_percent || 0;
              const prescriptionType = purchase.prescription_type || 'Eye Examination';
              
              // Include all prescription details in the item name
              const itemName = [
                prescriptionType,
                purchase.vision_type ? `(${purchase.vision_type})` : ''
              ].filter(Boolean).join(' ').trim();
              
              populatedItems.push({
                id: `rx_${purchase.id}`,
                selected: false,
                itemCode: identifier,
                itemName: itemName,
                orderNo: identifier,
                rate: amount.toFixed(2),
                taxPercent: '0',
                quantity: '1',
                amount: amount.toFixed(2),
                discount: discountAmount.toFixed(2),
                discountPercent: discountPercent.toFixed(2),
                _originalPurchase: {
                  ...purchase,
                  // Include all relevant prescription details
                  prescription_type: prescriptionType,
                  vision_type: purchase.vision_type,
                  // Ensure we have all financial fields
                  amount: amount,
                  discount_amount: discountAmount,
                  discount_percent: discountPercent
                }
              });
              itemCount++;
            }
          }
          
          // No need to fill empty rows, just use the populated items
          
          console.log('Final billing items to set:', populatedItems);
          setBillingItems(populatedItems);
        } catch (error) {
          console.error('Error populating billing items:', error);
          // Return empty array if there's an error
          setBillingItems([]);
        }
      }
    } catch (error) {
      console.error('Error handling customer selection:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };
  
  // Payment details
  const [estimate, setEstimate] = useState('');
  const [schDisc, setSchDisc] = useState('');
  const [payment, setPayment] = useState('');
  const [tax, setTax] = useState('');
  const [advance, setAdvance] = useState('');
  const [balance, setBalance] = useState('');
  const [cash, setCash] = useState('0');
  const [ccUpiAdv, setCcUpiAdv] = useState('0');
  const [ccUpiType, setCcUpiType] = useState('');
  const [cheque, setCheque] = useState('0');
  
  // Billing table state (initialized in useEffect above)
  const [discountToApply, setDiscountToApply] = useState('');
  
  const jobTypes = ['OrderCard', 'Contact lens', 'Repairing', 'Others'];
  const namePrefixOptions = ['Mr.', 'Mrs.', 'Ms.'];
  
  // Handle checkbox selection change
  const handleSelectionChange = (id: string) => {
    setBillingItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Handle item field changes
  const handleItemChange = (id: string, field: keyof BillingItem, value: string) => {
    setBillingItems(prevItems => 
      prevItems.map(item => {
        if (item.id !== id) return item;
        
        const updatedItem = { ...item, [field]: value };
        
        // If quantity or rate changes, calculate amount
        if ((field === 'quantity' || field === 'rate') && updatedItem.quantity && updatedItem.rate) {
          const quantity = parseFloat(updatedItem.quantity) || 0;
          const rate = parseFloat(updatedItem.rate) || 0;
          updatedItem.amount = (quantity * rate).toFixed(2);
        }
        
        return updatedItem;
      })
    );
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    const hasSelectedItems = billingItems.some(item => item.selected);
    
    if (hasSelectedItems) {
      setBillingItems(prevItems => {
        const remainingItems = prevItems.filter(item => !item.selected);
        return remainingItems;
      });
    }
  };

  // Add new empty row
  const handleAddRow = () => {
    const newItem = {
      id: Date.now().toString(),
      selected: false,
      itemCode: '',
      itemName: '',
      orderNo: '',
      rate: '0',
      taxPercent: '0',
      quantity: '1',
      amount: '0',
      discount: '0',
      discountPercent: '0',
      _originalPurchase: null
    };
    
    // If there are no items, just add one empty row
    if (billingItems.length === 0) {
      setBillingItems([newItem]);
    } else {
      // Otherwise add the new row after the last item
      setBillingItems([...billingItems, newItem]);
    }
  };

  // Apply same discount percentage to all items
  const handleApplyDiscount = () => {
    if (!discountToApply) return;
    
    setBillingItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        discountPercent: discountToApply,
        discount: item.amount ? ((parseFloat(item.amount) * parseFloat(discountToApply) / 100) || 0).toFixed(2) : ''
      }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  const handleClear = () => {
    setCashMemo('B1920-030');
    setReferenceNo('B1920-030');
    setJobType('');
    setBookingBy('');
    setItemName('');
    setPrescBy('');
    setNamePrefix('Mr.');
    setName('');
    setAge('');
    setAddress('');
    setCity('');
    setState('');
    setPhone('');
    setPin('');
    setMobile('');
    setEmail('');
    setCcode('');
    setIsCash(false);
    setEstimate('');
    setSchDisc('');
    setPayment('');
    setTax('');
    setAdvance('');
    setBalance('');
    setCash('0');
    setCcUpiAdv('0');
    setCcUpiType('');
    setCheque('0');
  };
  
  const handleExitBill = () => {
    navigate('/');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-screen w-full max-w-screen-xl mx-auto">
      {/* Title Bar */}
      <div className="flex justify-between items-center bg-[#d5d5e1] p-1 rounded-t-md border border-gray-400">
        <div className="flex items-center">
          <img src="/favicon.ico" alt="Billing" className="w-5 h-5 mr-2" />
          <span className="font-semibold text-gray-800">Billing</span>
        </div>
        <div className="flex">
          <button type="button" className="ml-2 text-gray-600 hover:text-gray-800">
            <Minus size={14} />
          </button>
          <button type="button" className="ml-2 text-gray-600 hover:text-gray-800">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center bg-[#f0f0f5] p-1 border-x border-b border-gray-400">
        <button type="button" className="flex items-center text-sm text-blue-700 mr-3 px-1">
          &lt;&lt; First
        </button>
        <button type="button" className="flex items-center text-sm text-blue-700 mr-3 px-1">
          &lt; Prev
        </button>
        <button type="button" className="flex items-center text-sm text-blue-700 mr-3 px-1">
          Next &gt;
        </button>
        <button type="button" className="flex items-center text-sm text-blue-700 px-1">
          Last &gt;&gt;
        </button>
        <span className="ml-auto font-medium text-gray-700">Personal Information</span>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        <div className="w-full bg-white border-x border-gray-400 overflow-auto">
          
          {/* Top Section */}
          <div className="flex p-3 border-b border-gray-300">
            {/* Left Side */}
            <div className="w-1/2 pr-3">
              <div className="flex mb-3">
                <div className="w-1/2 pr-2">
                  <label className="block text-sm mb-1">Cash Memo</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none" 
                    value={cashMemo}
                    onChange={(e) => setCashMemo(e.target.value)}
                  />
                </div>
                <div className="w-1/2 pl-2">
                  <label className="block text-sm mb-1">Reference No.</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none" 
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="text-gray-700 font-medium mb-2">Bill Details</div>
              <div className="mb-2">
                <div className="flex mb-2">
                  <div className="w-1/2 pr-2">
                    <label className="block text-sm mb-1">Date</label>
                    <div className="flex">
                      <input 
                        type="date" 
                        className="w-full px-2 py-1 border border-gray-300 rounded-none" 
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="w-1/2 pl-2">
                    <label className="block text-sm mb-1 opacity-0">.</label>
                    <input 
                      type="time" 
                      className="w-full px-2 py-1 border border-gray-300 rounded-none" 
                      value={currentTime}
                      onChange={(e) => setCurrentTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex mb-2">
                  <div className="w-1/2 pr-2">
                    <label className="block text-sm mb-1">Job Type</label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                    >
                      <option value="">Select</option>
                      {jobTypes.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2 pl-2">
                    <label className="block text-sm mb-1">Booking By <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={bookingBy}
                      onChange={(e) => setBookingBy(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Admin">Admin</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex mb-2">
                  <div className="w-1/2 pr-2">
                    <label className="block text-sm mb-1">Item Name</label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Frames">Frames</option>
                      <option value="Lenses">Lenses</option>
                      <option value="Contact Lenses">Contact Lenses</option>
                    </select>
                  </div>
                  <div className="w-1/2 pl-2">
                    <label className="block text-sm mb-1">Presc. By <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={prescBy}
                      onChange={(e) => setPrescBy(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Dr. Smith">Dr. Smith</option>
                      <option value="Dr. Johnson">Dr. Johnson</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Personal Information */}
            <div className="w-1/2 pl-3">
              <div className="mb-3">
                {/* Customer Search Section */}
                <div className="p-2 bg-white border border-gray-300">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Search</h3>
                  <CustomerSearch onSelectCustomer={handleCustomerSelect} />
                  
                  {isLoadingCustomer && (
                    <div className="text-sm text-gray-500 mt-2">Loading customer data...</div>
                  )}
                  
                  {customerPurchaseHistory.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Recent Purchases:</h4>
                      <div className="max-h-32 overflow-y-auto border rounded text-xs">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref No</th>
                              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {customerPurchaseHistory.slice(0, 5).map((purchase, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900">
                                  {new Date(purchase.date).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500 capitalize">
                                  {purchase.type}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-500">
                                  {purchase.prescription_no || purchase.order_no || 'N/A'}
                                </td>
                                <td className="px-2 py-1 whitespace-nowrap text-xs text-gray-900 text-right">
                                  {purchase.total_amount ? `₹${Number(purchase.total_amount).toFixed(2)}` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2 bg-white border border-gray-300">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Date</label>
                      <input
                        type="text"
                        value={currentDate}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Job Type</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select Job Type</option>
                        {jobTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Time</label>
                      <input
                        type="text"
                        value={currentTime}
                        readOnly
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Booking By</label>
                      <input
                        type="text"
                        value={bookingBy}
                        onChange={(e) => setBookingBy(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Item Name</label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Presc. By</label>
                      <input
                        type="text"
                        value={prescBy}
                        onChange={(e) => setPrescBy(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-1/6">
                    <label className="block text-sm mb-1">Name<span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={namePrefix}
                      onChange={(e) => setNamePrefix(e.target.value)}
                    >
                      {namePrefixOptions.map((prefix, index) => (
                        <option key={index} value={prefix}>{prefix}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-4/6 pl-2">
                    <label className="block text-sm mb-1 opacity-0">.</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="w-1/6 pl-2">
                    <label className="block text-sm mb-1">Age</label>
                    <input 
                      type="text" 
                      className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-sm mb-1">Address</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              
              <div className="flex mb-2">
                <div className="w-3/4 pr-2">
                  <label className="block text-sm mb-1">City</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="w-1/4 pl-2">
                  <label className="block text-sm mb-1">State</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex mb-2">
                <div className="w-3/4 pr-2">
                  <label className="block text-sm mb-1">Phone (L.L.)</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="w-1/4 pl-2">
                  <label className="block text-sm mb-1">Pin</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-2">
                <label className="block text-sm mb-1">Mobile<span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              
              <div className="mb-2">
                <label className="block text-sm mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="flex items-center">
                <div className="w-2/3 pr-2">
                  <label className="block text-sm mb-1">CCode</label>
                  <input 
                    type="text" 
                    className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none"
                    value={ccode}
                    onChange={(e) => setCcode(e.target.value)}
                  />
                </div>
                <div className="w-1/3 pl-2 flex items-center pt-5">
                  <input 
                    type="checkbox" 
                    id="cash" 
                    className="h-4 w-4 text-blue-600 border-gray-300"
                    checked={isCash}
                    onChange={(e) => setIsCash(e.target.checked)}
                  />
                  <label htmlFor="cash" className="ml-2 text-sm text-gray-700">Cash</label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Table Section */}
          <div className="mb-4 overflow-x-auto border-b border-gray-300 pb-2">
            <div className="flex mb-2 justify-between">
              <button 
                type="button" 
                className="px-2 py-1 bg-red-100 text-red-700 border border-red-300 text-xs rounded hover:bg-red-200 flex items-center"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={14} className="mr-1" /> Delete Selected
              </button>
              <button 
                type="button" 
                className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 text-xs rounded hover:bg-blue-200"
                onClick={handleAddRow}
              >
                + Add Row
              </button>
            </div>
            <table className="min-w-full border border-gray-300 border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Sel</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Item Code</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Rate Rs.</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Tax %</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Qty</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Amount</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Item Name</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Order No.</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Discount</th>
                  <th className="border border-gray-300 px-2 py-1 text-left text-xs font-medium text-gray-700">Discount %</th>
                </tr>
              </thead>
              <tbody>
                {billingItems.map(item => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <input 
                        type="checkbox" 
                        checked={item.selected} 
                        onChange={() => handleSelectionChange(item.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.itemCode} 
                        onChange={(e) => handleItemChange(item.id, 'itemCode', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.rate} 
                        onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.taxPercent} 
                        onChange={(e) => handleItemChange(item.id, 'taxPercent', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.quantity} 
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.amount} 
                        onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                        readOnly
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.itemName} 
                        onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.orderNo} 
                        onChange={(e) => handleItemChange(item.id, 'orderNo', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.discount} 
                        onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                      />
                    </td>
                    <td className="border border-gray-300 px-0 py-0">
                      <input 
                        type="text" 
                        value={item.discountPercent} 
                        onChange={(e) => handleItemChange(item.id, 'discountPercent', e.target.value)}
                        className="w-full px-1 py-1 border-0 focus:ring-0 focus:outline-none text-right"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-end mt-2 items-center">
              <span className="text-sm mr-2">Apply same discount % to all items above:</span>
              <input 
                type="text" 
                value={discountToApply}
                onChange={(e) => setDiscountToApply(e.target.value)}
                className="px-2 py-1 border border-gray-300 w-16 text-right mr-2"
              />
              <button 
                type="button" 
                className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-300 text-xs rounded hover:bg-blue-200"
                onClick={handleApplyDiscount}
              >
                Apply Disc
              </button>
            </div>
          </div>
          
          {/* Payment Section */}
          <div className="mb-4 px-3 pt-2 border-b border-gray-300 pb-2">
            <div className="font-medium text-gray-700 mb-2">Payment</div>
            <div className="flex">
              <div className="w-1/6 pr-1">
                <label className="block text-xs mb-1">Estimate</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none text-right" 
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-1/6 px-1">
                <label className="block text-xs mb-1">*Sch. Disc.</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none text-right" 
                  value={schDisc}
                  onChange={(e) => setSchDisc(e.target.value)}
                  placeholder="0"
                />
                <span className="text-xs text-gray-500">(Rs.)</span>
              </div>
              <div className="w-1/6 px-1">
                <label className="block text-xs mb-1">Payment</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 rounded-none text-right" 
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-1/6 px-1">
                <label className="block text-xs mb-1">Tax Rs.</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 rounded-none text-right" 
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-1/6 px-1">
                <label className="block text-xs mb-1">Adv.</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none text-right" 
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-1/6 pl-1">
                <label className="block text-xs mb-1">Balance</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 bg-[#e8e7fa] rounded-none text-right" 
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="flex mt-2">
              <div className="w-1/3 pr-2">
                <label className="block text-xs mb-1">Cash</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 rounded-none text-right" 
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="w-1/3 px-2">
                <label className="block text-xs mb-1">CC/UPI Adv.</label>
                <div className="flex">
                  <select 
                    className="w-1/2 px-2 py-1 border border-gray-300 rounded-none"
                    value={ccUpiType}
                    onChange={(e) => setCcUpiType(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                  <input 
                    type="text" 
                    className="w-1/2 px-2 py-1 border border-gray-300 border-l-0 rounded-none text-right" 
                    value={ccUpiAdv}
                    onChange={(e) => setCcUpiAdv(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="w-1/3 pl-2">
                <label className="block text-xs mb-1">Cheque</label>
                <input 
                  type="text" 
                  className="w-full px-2 py-1 border border-gray-300 rounded-none text-right" 
                  value={cheque}
                  onChange={(e) => setCheque(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="text-right mt-1">
              <span className="text-blue-700 font-semibold text-sm">*SCHEME DISCOUNT (IF ANY)</span>
            </div>
          </div>
          
          {/* Bottom Buttons */}
          <div className="flex justify-between px-3 pb-3">
            <button type="button" className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100">
              &lt;&lt; Add Bill &gt;&gt;
            </button>
            <button type="button" className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100">
              &lt;&lt; Edit/Search Bill &gt;&gt;
            </button>
            <button type="button" className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100">
              &lt;&lt; Email Invoice To Cust &gt;&gt;
            </button>
            <button type="button" className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100">
              &lt;&lt; Print Bill &gt;&gt;
            </button>
            <button 
              type="button" 
              className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100"
              onClick={handleClear}
            >
              &lt;&lt; Clear Bill &gt;&gt;
            </button>
            <button 
              type="button" 
              className="px-3 py-1 bg-[#dcf8fa] text-blue-700 border border-blue-300 text-sm hover:bg-blue-100"
              onClick={handleExitBill}
            >
              &lt;&lt; Exit Bill &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BillingPage;
