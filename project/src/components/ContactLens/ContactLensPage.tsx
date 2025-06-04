import React, { useState, useEffect } from 'react';
import { contactLensService } from '../../Services/contactLensService';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { getTodayDate } from '../../utils/helpers';
import ContactLensPersonalInfo from './ContactLensPersonalInfo';
import ContactLensPrescriptionSection from './ContactLensPrescriptionSection';
import ContactLensManualForm from './ContactLensManualForm';
import ContactLensItemTable from './ContactLensItemTable';
import ContactLensOrderStatus from './ContactLensOrderStatus';
import ContactLensPayment from './ContactLensPayment';
import { ContactLensFormData, ContactLensItem } from './ContactLensTypes';
import ToastNotification from '../ui/ToastNotification';
import ContactLensSearch from './ContactLensSearch';
// No direct imports from src folder to avoid path issues


// Generate prescription number on component initialization to avoid regenerating it on rerenders
const generatedPrescriptionNo = contactLensService.generateContactLensPrescriptionNo();

const initialContactLensForm: ContactLensFormData = {
  prescriptionNo: generatedPrescriptionNo,
  reference_no: generatedPrescriptionNo, // Set reference number equal to prescription number by default
  date: getTodayDate(),
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  dvDate: getTodayDate(),
  dvTime: '18:30:00',
  class: '',
  bookingBy: '',
  title: 'Mr.',
  name: '',
  gender: 'Male',
  age: '',
  address: '',
  city: '',
  state: '',
  pin: '',
  phoneLandline: '',
  mobile: '',
  email: '',
  customerCode: '',
  birthDay: '',
  marriageAnniversary: '',
  prescBy: '',
  billed: false,
  billNumber: '',
  rightEye: {
    dv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/'
    },
    nv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/'
    }
  },
  leftEye: {
    dv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/'
    },
    nv: {
      sph: '',
      cyl: '',
      ax: '',
      add: '',
      vn: '6/'
    }
  },
  ipd: '',
  balanceLens: false,
  contactLensItems: [],
  remarks: '',
  orderStatus: 'Processing',
  orderStatusDate: getTodayDate(),
  retestAfter: getTodayDate(),
  expiryDate: getTodayDate(),
  payment: '0.00',
  estimate: '0.00',
  schAmt: '0.00',
  advance: '0.00',
  balance: '0.00',
  cashAdv: '0.00',
  ccUpiAdv: '0.00',
  chequeAdv: '0.00',
  cashAdv2: '0.00',
  advDate: getTodayDate(),
  paymentMethod: 'Cash',
  sourceType: 'INITIAL', // Default source type for empty forms
};

const ContactLensPage: React.FC = () => {
  const [formData, setFormData] = useState<ContactLensFormData>(initialContactLensForm);
  const [showManualForm, setShowManualForm] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });
  const [isSaving, setIsSaving] = useState(false);
  const [showSearchSection, setShowSearchSection] = useState<boolean>(true);
  
  // Add a flag to prevent calculations while loading from DB
  // This is critical to prevent unwanted recalculations
  const [isLoadingFromDB, setIsLoadingFromDB] = useState<boolean>(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Extract name and value, but don't destructure to avoid issues with undefined
    const name = e.target?.name;
    const value = e.target?.value;
    
    // Early return if the target is undefined or the name is missing
    if (!e.target || !name) return;
    
    // Log issues but continue processing to avoid UI breaks
    if (!name) {
      console.error('Event target name is undefined:', e);
      return;
    }
    
    setFormData((prevState) => {
      // IMPORTANT: Mark as user input to allow recalculations
      // This will ensure any database-loaded values can now be recalculated
      const updatedState = { 
        ...prevState, 
        sourceType: 'USER_INPUT' as 'USER_INPUT' // Use correct type literal
      };
      
      // Handle nested properties using dot notation (e.g., "rightEye.dv.sph")
      if (name.includes('.')) {
        try {
          const keys = name.split('.');
          const obj = { ...updatedState };
          
          let current: any = obj;
          for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) {
              // Initialize missing objects in the path
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          
          current[keys[keys.length - 1]] = value;
          return obj;
        } catch (error: any) {
          console.error('Error updating nested state:', error);
          return updatedState; // Return state with sourceType on error
        }
      }
      
      // Handle simple properties
      return { ...updatedState, [name]: value };
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    // Mark as user input to allow recalculations
    setFormData({ 
      ...formData, 
      sourceType: 'USER_INPUT' as 'USER_INPUT',
      [name]: checked 
    });
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Skip processing if name is undefined (though it should be present here)
    if (!name) {
      console.error('Input name is undefined in handleNumericInputChange');
      return;
    }
    
    let processedValue = value;

    // For RPD and LPD fields, allow direct input without formatting
    if (name.includes('rpd') || name.includes('lpd')) {
      processedValue = value;
    } else if (name.includes('ax')) {
      // For axial, ensure integer between 0-180
      processedValue = value.replace(/[^0-9]/g, '');
      const numValue = parseInt(processedValue, 10);
      if (!isNaN(numValue)) {
         if (numValue > 180) {
           processedValue = '180';
         } else if (numValue < 0) { // Ensure non-negative, though regex handles non-digits
            processedValue = '0';
         }
      } else {
        processedValue = ''; // Clear if not a valid number after cleaning
      }
    } else { // Existing logic for other numeric fields
      // Allow only numbers, decimal point, and negative sign
      processedValue = value.replace(/[^0-9.-]/g, '');
    }
    
    // Create a properly structured synthetic event with explicitly set name and formatted value
    const syntheticEvent = {
      ...e,
      target: {
        // Copy necessary properties from original target
        ...e.target,
        name: name,  // Explicitly set the original name
        value: processedValue, // Use the processed value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Call the main handleChange with the properly structured synthetic event
    handleChange(syntheticEvent);
  };

  // We already have the isLoadingFromDB state declared above

  // Consolidated function to calculate and update payment totals
  const calculateTotal = (items: ContactLensItem[], isManualCalculation: boolean = true) => {
    // IMPORTANT DEBUG - Log current state to diagnose issues
    console.log('calculateTotal called with:', {
      isManualCalculation,
      currentPaymentValue: formData.payment,
      currentAdvanceValue: formData.advance,
      currentBalanceValue: formData.balance,
      itemCount: items?.length || 0,
      sourceType: formData.sourceType || 'UNKNOWN'
    });
    
    // IMPORTANT: We need special handling for newly added items
    const hasNewItems = items.length > 0;

    // Always calculate new totals when manually adding items or when explicitly forced
    const forceRecalculation = isManualCalculation || hasNewItems;
    
    // Only block recalculation if we're loading from DB AND not forcing recalculation
    if (formData.sourceType === 'DATABASE_VALUES' && !forceRecalculation) {
      console.log('🛑 BLOCKED AUTOMATIC RECALCULATION: Payment data came from DATABASE_VALUES');
      console.log('Current preserved values:', {
        payment: formData.payment,
        advance: formData.advance,
        balance: formData.balance
      });
      return; // Exit immediately - do not recalculate or update state
    }
    
    // If we have new items or manual calculation, we need to update payment
    if (forceRecalculation) {
      console.log('⚠️ ALLOWING RECALCULATION: Manual update or new items added');
      // When adding new items with database values loaded, we switch to user input mode
      if (formData.sourceType === 'DATABASE_VALUES') {
        setFormData(prev => ({
          ...prev,
          sourceType: 'USER_INPUT' as 'USER_INPUT'
        }));
      }
    }
    
    // If we're loading from DB, NEVER calculate regardless of other conditions
    if (isLoadingFromDB) {
      console.log('BLOCKED: Currently loading from DB - all calculations blocked');
      return; // Block ALL calculations during DB load
    }
    
    // Skip calculations entirely if they are not manual and we already have data
    // IMPORTANT: This is the main guard that prevents recalculation on data load
    if (!isManualCalculation && formData.payment && parseFloat(formData.payment) > 0) {
      console.log('SKIPPING calculation completely - using existing DB values:', {
        payment: formData.payment,
        advance: formData.advance,
        balance: formData.balance
      });
      return; // Exit early - do not calculate or update state
    }
    
    console.log(`Calculating totals - isManualCalculation: ${isManualCalculation}`);
    
    // Calculate base total (before discount)
    const baseTotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.qty?.toString() || '1');
      const rate = parseFloat(item.rate?.toString() || '0');
      return sum + (qty * rate);
    }, 0);
    
    // Calculate total after discounts (final amount)
    const finalTotal = items.reduce((sum, item) => {
      // Make sure we're using the amount field which is the final amount after discount
      const itemAmount = parseFloat(item.amount?.toString() || '0');
      return sum + itemAmount;
    }, 0);
    
    // Calculate total discount amount
    const totalDiscount = items.reduce((sum, item) => {
      const discountAmount = parseFloat(item.discountAmount?.toString() || '0');
      return sum + discountAmount;
    }, 0);
    
    // Calculate advance amount
    const cashAdv = parseFloat(formData.cashAdv || '0');
    const ccUpiAdv = parseFloat(formData.ccUpiAdv || '0');
    const chequeAdv = parseFloat(formData.chequeAdv || '0');
    const totalAdvance = cashAdv + ccUpiAdv + chequeAdv;
    
    // Format values with 2 decimal places
    const formattedBaseTotal = baseTotal.toFixed(2);
    const formattedFinalTotal = finalTotal.toFixed(2);
    const formattedDiscount = totalDiscount.toFixed(2);
    const formattedAdvance = totalAdvance.toFixed(2);
    
    // Calculate balance (final amount - advances) 
    const balance = Math.max(0, finalTotal - totalAdvance);
    const formattedBalance = balance.toFixed(2);
    
    console.log('Payment calculation results:', {
      baseTotal,
      finalTotal,
      totalDiscount,
      totalAdvance,
      balance,
      isManualCalculation
    });

    // Update form state with calculated values
    setFormData(prev => {
      // If this is not a manual calculation (e.g., loading from DB)
      // and we already have values, don't override them
      if (!isManualCalculation) {
        const hasExistingValues = prev.payment && parseFloat(prev.payment) > 0;
        if (hasExistingValues) {
          console.log('Preserving existing payment fields from database:', {
            payment: prev.payment,
            schAmt: prev.schAmt,
            estimate: prev.estimate,
            advance: prev.advance,
            balance: prev.balance
          });
          return prev; // Keep existing values
        }
      }
      
      console.log('Setting payment fields:', {
        payment: formattedFinalTotal,     // This is after discount (e.g. 900)
        schAmt: formattedDiscount,        // Total discount amount (e.g. 100)
        estimate: formattedBaseTotal,     // Original total before discount (e.g. 1000)
        advance: formattedAdvance,        // Total advance payments
        balance: formattedBalance         // Payment total minus advances (e.g. 900)
      });
      
      return {
        ...prev,
        payment: formattedFinalTotal,     // Total after discounts
        schAmt: formattedDiscount,        // Total discount amount
        estimate: formattedBaseTotal,     // Total before discounts (ORIGINAL amount)
        advance: formattedAdvance,        // Total advance
        balance: formattedBalance         // Balance after discounts and advance
      };
    });
  };

  const handleApplyDiscount = () => {
    console.log('MANUAL DISCOUNT REQUESTED - User clicked Apply Discount button');
    console.log('Applying discount with percentage:', discountPercentage, 
              'sourceType:', formData.sourceType);
    
    // Validate the discount percentage first
    const discount = parseFloat(discountPercentage);
    if (isNaN(discount) || discount < 0 || discount > 100) {
      // Show error notification for invalid input
      setNotification({ 
        message: 'Please enter a valid discount percentage between 0 and 100.', 
        type: 'error', 
        visible: true 
      });
      return;
    }
    
    // CRITICAL PROTECTION: If data was loaded from database, confirm with user before modifying
    if (formData.sourceType === 'DATABASE_VALUES') {
      const proceed = window.confirm(
        'You are about to modify payment values that were loaded from the database. ' +
        'This will recalculate all payment fields. Are you sure you want to proceed?'
      );
      
      if (!proceed) {
        console.log('User canceled discount application to preserve DB values');
        return;
      }
    }
    
    // Get current total amount
    const total = parseFloat(formData.payment) || 0;
    
    // Calculate discount amount
    const discountAmount = (total * discount) / 100;
    
    // Update the form with the discount and mark as user input
    setFormData(prevState => ({
      ...prevState,
      sourceType: 'USER_INPUT' as 'USER_INPUT', // Mark as user modified
      schAmt: discountAmount.toFixed(2)
    }));
    
    // Recalculate totals with the new discount
    if (formData.contactLensItems.length > 0) {
      // This is an explicit user action, so it's safe to recalculate
      calculateTotal(formData.contactLensItems);
    }

    console.log('Applying discount of', discount, '% to all items');
  
    const updatedItems = formData.contactLensItems.map(item => {
      // Calculate base amount without discount
      const baseAmount = item.qty * item.rate;
      // Calculate discount amount (using the same formula as OrderCard system)
      const discountAmt = baseAmount * (discount / 100);
      // Calculate final amount after discount
      const finalAmount = baseAmount - discountAmt;
      
      console.log('Item discount calculation:', {
        baseAmount,
        discount, 
        discountAmt,
        finalAmount
      });
      
      return {
        ...item,
        discountPercent: discount,
        discountAmount: parseFloat(discountAmt.toFixed(2)), // Format to 2 decimal places for consistency
        amount: parseFloat(finalAmount.toFixed(2)) // Format to 2 decimal places for consistency
      };
    });

    setFormData(prev => ({
      ...prev,
      contactLensItems: updatedItems
    }));
  
    // Explicitly mark that this is a manual calculation, not from loading
    console.log('MANUAL DISCOUNT - Recalculating totals after user applied discount');
    calculateTotal(updatedItems, true); // true = manual calculation

    // Add success notification
    setNotification({ message: 'Discount applied successfully!', type: 'success', visible: true });
  };

  // Update totals when any relevant payment fields change - BUT CAREFULLY
  useEffect(() => {
    // CRITICAL: Check if we have database values that need to be preserved
    if (formData.sourceType === 'DATABASE_VALUES') {
      console.log('PRESERVING DATABASE VALUES - SKIPPING AUTO RECALCULATION');
      console.log('Current preserved values:', {
        payment: formData.payment,
        advance: formData.advance,
        balance: formData.balance
      });
      return; // Exit early to protect DB values
    }
    
    // Only for user input or new items, recalculate
    if (formData.sourceType === 'USER_INPUT' || formData.contactLensItems.length > 0) {
      console.log('Auto-recalculating due to payment field or item changes');
      calculateTotal(formData.contactLensItems, true); // Force as manual calculation
    }
  }, [
    formData.contactLensItems, 
    formData.cashAdv, 
    formData.ccUpiAdv, 
    formData.chequeAdv, 
    formData.schAmt,
    formData.sourceType // Add sourceType to dependencies to react to changes
  ]);

  // Effect to calculate IPD from RPD and LPD
  useEffect(() => {
    const rpd = formData.rightEye.dv.rpd;
    const lpd = formData.leftEye.dv.lpd;
    
    if (rpd && lpd) {
      const rpdValue = parseFloat(rpd);
      const lpdValue = parseFloat(lpd);
      
      if (!isNaN(rpdValue) && !isNaN(lpdValue)) {
        const calculatedIPD = (rpdValue + lpdValue).toFixed(1);
        setFormData(prev => ({
          ...prev,
          ipd: calculatedIPD
        }));
      }
    } else if (!rpd && !lpd) {
         setFormData(prev => ({
          ...prev,
          ipd: '' // Clear IPD if both RPD and LPD are empty
        }));
    }
  }, [formData.rightEye.dv.rpd, formData.leftEye.dv.lpd, setFormData]);

  // Helper function to convert database eye side values (lowercase) to UI values (titlecase)
  const convertEyeSideToUIFormat = (eyeSide: string): 'Right' | 'Left' | 'Both' => {
    // Log the raw input for debugging
    console.log('convertEyeSideToUIFormat - raw input:', eyeSide);
    
    if (!eyeSide) {
      console.log('No eye side provided, defaulting to Both');
      return 'Both';
    }
    
    // Trim whitespace and convert to lowercase for comparison
    const normalized = eyeSide.toString().trim().toLowerCase();
    
    // Log the normalized value for debugging
    console.log('Normalized eye side:', normalized);
    
    // Check for variations of 'right'
    if (['right', 'r', 're', 'od'].includes(normalized)) {
      return 'Right';
    }
    
    // Check for variations of 'left'
    if (['left', 'l', 'le', 'os'].includes(normalized)) {
      return 'Left';
    }
    
    // Default to 'Both' for any other case
    console.log('No matching eye side found, defaulting to Both');
    return 'Both';
  };

  const handleAddContactLens = (item: ContactLensItem) => {
    console.log('Adding new contact lens item:', item);
    
    // Check if we need to apply global discount to this item
    const globalDiscount = parseFloat(discountPercentage) || 0;
    let processedItem = { ...item };
    
    // Make sure the item has an amount field
    if (!processedItem.amount) {
      processedItem.amount = processedItem.qty * processedItem.rate;
    }
    
    // Calculate and apply discount to the item if global discount exists
    if (globalDiscount > 0) {
      // Calculate base amount (qty * rate)
      const baseAmount = processedItem.qty * processedItem.rate;
      
      // Calculate discount amount based on global discount percentage
      const discountAmount = baseAmount * (globalDiscount / 100);
      
      // Calculate final amount after discount
      const finalAmount = baseAmount - discountAmount;
      
      // Update the item with discount values
      processedItem = {
        ...processedItem,
        discountPercent: globalDiscount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        amount: parseFloat(finalAmount.toFixed(2))
      };
      
      console.log('Applied global discount to new item:', {
        item: processedItem.side || 'Both',
        baseAmount,
        globalDiscount,
        discountAmount: processedItem.discountAmount,
        finalAmount: processedItem.amount
      });
    } else {
      // If no global discount, ensure the amount is calculated correctly
      processedItem.amount = processedItem.qty * processedItem.rate;
      processedItem.discountPercent = 0;
      processedItem.discountAmount = 0;
    }
    
    // Force recalculation regardless of source type when adding new items
    const updatedItems = [...formData.contactLensItems, processedItem];
    
    // Calculate new payment total from all items
    const totalPayment = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount?.toString()) || 0);
    }, 0);
    
    // Calculate new estimate total from all items
    const totalEstimate = updatedItems.reduce((sum, item) => {
      const qty = parseFloat(item.qty?.toString() || '1');
      const rate = parseFloat(item.rate?.toString() || '0');
      return sum + (qty * rate);
    }, 0);
    
    // Calculate total discount
    const totalDiscount = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.discountAmount?.toString()) || 0);
    }, 0);
    
    // Force directly updating payment fields
    setFormData(prevState => {
      // When adding new items, we should always switch to user input mode
      return {
        ...prevState,
        sourceType: 'USER_INPUT' as 'USER_INPUT',
        contactLensItems: updatedItems,
        payment: totalPayment.toFixed(2),
        estimate: totalEstimate.toFixed(2),
        schAmt: totalDiscount.toFixed(2),
        // Recalculate balance based on new payment total
        balance: (totalPayment - parseFloat(prevState.advance)).toFixed(2)
      };
    });
    
    // Close the manual form
    setShowManualForm(false);
  };

// Function to handle patient selection from search results
const handlePatientSelect = (patientData: any) => {
  try {
    // Set flag to BLOCK ALL calculations during data load
    setIsLoadingFromDB(true);
    console.log('DB LOAD STARTED - All calculations blocked until data load completes');
    
    // Log values from database to help debugging
    console.log('DEBUG - Database Values:', {
      prescribed_by: patientData.prescription.prescribed_by,
      class: patientData.prescription.class,
      date: patientData.prescription.date,
      delivery_date: patientData.prescription.delivery_date
    });
    
    // Show a notification that data is being loaded
    setNotification({
      message: 'Loading patient data...',
      type: 'success',
      visible: true
    });
        
    // Create a new form data object based on the patient data
    const newFormData: ContactLensFormData = {
      ...initialContactLensForm,
          
      // Set the prescription fields
      prescriptionNo: patientData.prescription.prescription_no || '',
      reference_no: patientData.prescription.reference_no || patientData.prescription.ref_no || '',
      name: patientData.prescription.name || '',
      gender: patientData.prescription.gender || 'Male',
          
      // Fix for Age field
      age: patientData.prescription.age || '',
          
      address: patientData.prescription.address || '',
      city: patientData.prescription.city || '',
      state: patientData.prescription.state || '',
          
      // Fix for PIN field
      pin: patientData.prescription.pin || '',
          
      // Fix for Phone Landline field
      phoneLandline: patientData.prescription.phone_landline || '',
          
      mobile: patientData.prescription.mobile_no || patientData.prescription.mobile || '',
      email: patientData.prescription.email || '',
      remarks: patientData.prescription.remarks || '',
          
      // Fix for Birth Day field
      birthDay: patientData.prescription.birth_day || '',
          
      // Fix for Marriage Anniversary field
      marriageAnniversary: patientData.prescription.marriage_anniversary || '',
          
      // Fix for Customer Code field
      customerCode: patientData.prescription.customer_code || '',
          
      // Fix for Prescribed By field - ensure correct mapping from database to form field
      prescBy: patientData.prescription.prescribed_by || '',
          
      // Fix for Class field - ensure correct mapping from database to form field
      class: patientData.prescription.class || '',
             
      // Add debug logging outside the form data object
      /* Debug logging */
      // Console log right before this to track values in debug console
      // console.log('Debug - Class:', patientData.prescription.class, 'Prescribed By:', patientData.prescription.prescribed_by);
      
      // Keep existing Booking By functionality
      bookingBy: patientData.contactLensData?.booked_by || 
                patientData.prescription.booked_by || 
                '',
      
      // Keep existing Order Status functionality
      orderStatus: patientData.contactLensData?.status || 'Processing',
      
      // Fix for Date field - directly accessing from prescription.date and formatting as ISO datetime
      date: patientData.prescription.date ? 
            patientData.prescription.date + 'T00:00' : 
            getTodayDate() + 'T00:00',
      
      // Fix for Delivery Date field - directly accessing from prescription.delivery_date and formatting as ISO datetime
      dvDate: patientData.prescription.delivery_date ? 
              patientData.prescription.delivery_date + 'T00:00' : 
              getTodayDate() + 'T00:00',
      dvTime: patientData.prescription.delivery_time || '18:30:00',
      retestAfter: patientData.prescription.retest_date || getTodayDate(),
      expiryDate: patientData.prescription.expiry_date || getTodayDate(),
      };
          
      // If we have eye data, map it to the form structure
      if (patientData.eyes && patientData.eyes.length > 0) {
        // Process right eye data
        const rightEyeData = patientData.eyes.find((eye: any) => eye.eye_side === 'Right');
        if (rightEyeData) {
          newFormData.rightEye = {
            dv: {
              sph: rightEyeData.sph || '',
              cyl: rightEyeData.cyl || '',
              ax: rightEyeData.axis || '',
              add: rightEyeData.add_power || '',
              vn: rightEyeData.vn || '6/',
              rpd: rightEyeData.rpd || ''
            },
            nv: {
              sph: rightEyeData.sph || '',
              cyl: rightEyeData.cyl || '',
              ax: rightEyeData.axis || '',
              add: rightEyeData.add_power || '',
              vn: rightEyeData.vn || '6/',
              rpd: rightEyeData.rpd || ''
            }
          };
        }
        
        // Process left eye data
        const leftEyeData = patientData.eyes.find((eye: any) => eye.eye_side === 'Left');
        if (leftEyeData) {
          newFormData.leftEye = {
            dv: {
              sph: leftEyeData.sph || '',
              cyl: leftEyeData.cyl || '',
              ax: leftEyeData.axis || '',
              add: leftEyeData.add_power || '',
              vn: leftEyeData.vn || '6/',
              lpd: leftEyeData.lpd || ''
            },
            nv: {
              sph: leftEyeData.sph || '',
              cyl: leftEyeData.cyl || '',
              ax: leftEyeData.axis || '',
              add: leftEyeData.add_power || '',
              vn: leftEyeData.vn || '6/',
              lpd: leftEyeData.lpd || ''
            }
          };
        }
        
        // Set IPD by combining RPD and LPD if available
        if (rightEyeData?.rpd && leftEyeData?.lpd) {
          try {
            const rpd = parseFloat(rightEyeData.rpd) || 0;
            const lpd = parseFloat(leftEyeData.lpd) || 0;
            if (rpd > 0 && lpd > 0) {
              const ipd = (rpd + lpd).toFixed(1);
              newFormData.ipd = ipd;
            }
          } catch (e) {
            console.error('Error calculating IPD:', e);
          }
        }
      }
      
      // If we have contact lens items, add them to the form
      if (patientData.items && patientData.items.length > 0) {
        console.log('DETAILED DEBUG - Loading items from database', patientData.items);
        const mappedItems = patientData.items.map((item: any, index: number) => {
          // Parse quantity and rate ensuring they are numbers
          // CRITICAL FIX: Ensure quantity is NEVER zero for existing items (defaults to 1)
          const qty = parseFloat(item.quantity) || 1; // Default to 1 if quantity is missing or zero
          const rate = parseFloat(item.rate) || 0;
          const baseAmount = qty * rate;
          
          console.log(`Item ${index + 1} quantity parsing:`, {
            raw_quantity: item.quantity,
            parsed_qty: qty,
            rate: rate,
            calculated_baseAmount: baseAmount
          });
          
          // CRITICAL DEBUG: Log the exact raw database item to see all available fields
          console.log(`DEBUG RAW DATABASE ITEM ${index + 1}:`, JSON.stringify(item));
          
          // Extract raw values for debugging
          console.log(`RAW B/C VALUE FOR ITEM ${index + 1}:`, {
            raw_bc: item.base_curve,
            type: typeof item.base_curve,
            truthiness: !!item.base_curve
          });
          
          // CRITICAL DEBUGGING: Extract and compare all possible side field values
          console.log(`SIDE FIELD ANALYSIS FOR ITEM ${index + 1}:`, {
            raw_side: item.side,
            raw_side_type: typeof item.side,
            raw_eye_side: item.eye_side,
            raw_eye_side_type: typeof item.eye_side,
            side_truthiness: !!item.side,
            eye_side_truthiness: !!item.eye_side,
            // Examine raw values to identify special characters or whitespace
            side_string_analysis: item.side ? `Length: ${item.side.length}, Raw: "${item.side}"` : 'null/undefined',
            eye_side_string_analysis: item.eye_side ? `Length: ${item.eye_side.length}, Raw: "${item.eye_side}"` : 'null/undefined'
          });
          
          // CRITICAL DEBUG: Log all possible field names to understand database structure
          console.log(`ALL POSSIBLE FIELD NAMES FOR ITEM ${index + 1}:`, {
            side: item.side,
            eye_side: item.eye_side,
            bc: item.bc,
            base_curve: item.base_curve,
            ax: item.ax,
            axis: item.axis,
            lensCode: item.lensCode,
            lens_code: item.lens_code
          });
          
          // Create a helper function to normalize field names from database
          // This helps us handle various naming conventions consistently
          const getNumberValue = (obj: any, ...possibleKeys: string[]) => {
            for (const key of possibleKeys) {
              if (obj[key] !== undefined && obj[key] !== null) {
                const value = parseFloat(obj[key].toString());
                if (!isNaN(value)) return value;
              }
            }
            return 0;
          };
          
          // Use the helper to get consistent values regardless of database field names
          // NOTE: The database field names MUST match exactly what's in the database
          // These are the actual field names used in the database
          let discountPercent = getNumberValue(item, 
            'discount_percent', 'discount_percentage', 'discountPercent', 'disc_percent', 'discPercent');
          
          let discountAmount = getNumberValue(item,
            'discount_amount', 'discountAmount', 'disc_amount', 'discAmount');
          
          let finalAmount = getNumberValue(item,
            'final_amount', 'finalAmount', 'amount', 'final_amt');
            
          // Log extracted values for debugging with exact field names
          console.log(`Item ${index + 1} extracted values from keys:`, { 
            discount_percent: item.discount_percent,
            discountPercent: item.discountPercent,
            discount_amount: item.discount_amount,
            discountAmount: item.discountAmount,
            final_amount: item.final_amount,
            amount: item.amount,
            extracted: { discountPercent, discountAmount, finalAmount }
          });
          
          // CRITICAL FIXES FOR DISCOUNT CALCULATIONS
          
          // Fix quantity issues - if quantity is invalid but we have a discount percentage, we need to fix it
          if (qty === 0 && discountPercent > 0) {
            console.log(`CRITICAL FIX: Item ${index + 1} has discount percent ${discountPercent}% but zero quantity. Fixing quantity to 1.`);
            // Force quantity to 1 if it's zero but we have a discount percentage
            const fixedQty = 1;
            const fixedBaseAmount = fixedQty * rate;
            
            // Update variables for subsequent calculations
            // We need to recalculate everything with the fixed quantity
            finalAmount = parseFloat((fixedBaseAmount * (1 - discountPercent/100)).toFixed(2));
            discountAmount = parseFloat((fixedBaseAmount * discountPercent/100).toFixed(2));
            
            console.log(`Recalculated values with fixed quantity:`, {
              fixedQty,
              fixedBaseAmount,
              discountPercent,
              discountAmount,
              finalAmount
            });
          }
          // Normal case handling - calculate missing values if needed
          else {
            // If discount percentage is available but amount is not, calculate it
            if (discountPercent > 0 && discountAmount === 0) {
              discountAmount = parseFloat((baseAmount * discountPercent / 100).toFixed(2));
              console.log(`Calculated missing discount amount for item ${index + 1}:`, discountAmount);
            }
            
            // If discount amount is available but percentage is not, calculate it
            if (discountAmount > 0 && discountPercent === 0 && baseAmount > 0) {
              discountPercent = parseFloat(((discountAmount / baseAmount) * 100).toFixed(2));
              console.log(`Calculated missing discount percent for item ${index + 1}:`, discountPercent);
            }
            
            // If final amount is not available but we have discount, calculate it
            if (finalAmount === 0 && (discountAmount > 0 || discountPercent > 0)) {
              finalAmount = parseFloat((baseAmount - discountAmount).toFixed(2));
              console.log(`Calculated missing final amount for item ${index + 1}:`, finalAmount);
            }
          }
          
          // CRITICAL: Add detailed logging of all original item properties to find database fields
          console.log(`Item ${index + 1} RAW DATABASE FIELDS:`, {
            // List all possible field names to identify which ones exist in the data
            orig_discount_percent: item.discount_percent,
            orig_discountPercent: item.discountPercent,
            orig_disc_percent: item.disc_percent,
            orig_discount_amount: item.discount_amount,
            orig_discountAmount: item.discountAmount,
            orig_disc_amount: item.disc_amount,
            // Show the normalized values we extracted
            normalized: {
              discountPercent,
              discountAmount,
              finalAmount,
              qty,
              rate,
              baseAmount
            }
          });
          
          // IMPORTANT: Create a single consistent object with all fields mapped correctly
          const mappedItem = {
            // Basic identification and details
            si: index + 1,
            // FIXED: Map database 'Both' to UI 'BOTH' instead of empty string
            // CRITICAL FIX: Check for both possible field names in the database (side AND eye_side)
            // The database is storing lowercase values but UI expects titlecase
            // Convert 'right' → 'Right', 'left' → 'Left', 'both' → 'Both'
            side: convertEyeSideToUIFormat(item.side || item.eye_side || 'both'),
            
            // Debug the exact fields coming from database to understand the structure
            raw_side_fields: {
              side_field: item.side,
              eye_side_field: item.eye_side
            },
            // CRITICAL DEBUGGING OF RAW VALUES
            // Before mapping: Print raw database values for this item
            // This will help identify why B/C might not be loading correctly
            /* bc_debug: {
              raw_value: item.base_curve,
              type: typeof item.base_curve,
              coerced: String(item.base_curve)
            }, */
            
            // CRITICAL FIX: Get B/C value directly from database schema - use 'bc' field if it exists
            // Database is using 'bc' instead of 'base_curve' for some records
            bc: item.bc || item.base_curve || '',
            power: item.power || '',              // Power
            material: item.material || '',        // Material
            dispose: item.dispose || '',          // Dispose method
            brand: item.brand || '',              // Brand
            diameter: item.diameter || '',        // Diameter
            qty: qty,                             // Quantity
            rate: rate,                           // Rate
            
            // CRITICAL FIX: Ensure discount values are properly copied from database
            // and consistently available under all field names the UI might use
            discountPercent: discountPercent,      // Primary UI field
            discountAmount: discountAmount,        // Primary UI field
            discount_percent: discountPercent,     // Preserve database format
            discount_amount: discountAmount,       // Preserve database format
            disc_percent: discountPercent,         // Alternative format
            disc_amount: discountAmount,           // Alternative format
            
            // Final amount and measurement details
            amount: finalAmount,                  // Final Amount after discount
            
            // FIXED: NEVER modify values loaded from database - preserve them exactly as stored
            sph: item.sph || '',                  // SPH
            cyl: item.cyl || '',                  // CYL
            // Get axis directly from 'ax' field if it exists (this matches the UI field name)
            ax: item.ax || item.axis || '',       // Try both field names
            
            // Get lens code directly from database field names
            lensCode: item.lensCode || item.lens_code || ''
          };
          
          // Log the final mapped item for verification - include ALL discount fields
          console.log(`Final mapped item ${index + 1} COMPLETE:`, {
            base: {
              qty: mappedItem.qty,
              rate: mappedItem.rate,
              baseAmount: mappedItem.qty * mappedItem.rate,
            },
            discount: {
              discountPercent: mappedItem.discountPercent,
              discountAmount: mappedItem.discountAmount,
              calculatedDiscountAmount: (mappedItem.qty * mappedItem.rate * mappedItem.discountPercent / 100).toFixed(2),
              amount: mappedItem.amount
            },
            allFields: {
              discountPercent: mappedItem.discountPercent, 
              discount_percent: mappedItem.discount_percent,
              disc_percent: mappedItem.disc_percent,
              discountAmount: mappedItem.discountAmount,
              discount_amount: mappedItem.discount_amount,
              disc_amount: mappedItem.disc_amount
            }
          });
          
          return mappedItem;
        });
        
        newFormData.contactLensItems = mappedItems;
      }
      
      // We're in DB load mode - values should be preserved
      // isLoadingFromDB flag is already set at the start of handlePatientSelect
      
      // If we have payment data, map it to the form
      if (patientData.payment) {
        // CRITICAL: Set sourceType to DATABASE_VALUES to prevent recalculation
        // This will ensure payment values from DB are preserved exactly as loaded
        newFormData.sourceType = 'DATABASE_VALUES' as 'DATABASE_VALUES';
        
        // Initialize payment fields directly from database without any calculations
        if (patientData.payment) {
          console.log('DEBUG - Using payment data directly from database', patientData.payment);
          
          // CRITICAL: Ensure we're using the exact values from the database
          // Convert all values to strings to match the form data type
          newFormData.payment = patientData.payment.payment_total?.toString() || '0';
          newFormData.estimate = patientData.payment.estimate_amount?.toString() || '0';
          newFormData.schAmt = patientData.payment.discount_amount?.toString() || '0';
          newFormData.advance = patientData.payment.advance?.toString() || '0';
          newFormData.balance = patientData.payment.balance?.toString() || '0';
          
          // Also set the individual advance fields if they exist
          if (patientData.payment.cash_advance) {
            newFormData.cashAdv = patientData.payment.cash_advance.toString();
          }
          if (patientData.payment.card_upi_advance) {
            newFormData.ccUpiAdv = patientData.payment.card_upi_advance.toString();
          }
          if (patientData.payment.cheque_advance) {
            newFormData.chequeAdv = patientData.payment.cheque_advance.toString();
          }
          
          console.log('PAYMENT VALUES SET DIRECTLY FROM DATABASE (NO CALCULATIONS):', {
            payment: newFormData.payment,
            estimate: newFormData.estimate,
            schAmt: newFormData.schAmt,
            advance: newFormData.advance,
            balance: newFormData.balance
          });
          
          console.log('PAYMENT VALUES FROM DATABASE (NO RECALCULATIONS):', {
            payment: newFormData.payment,
            advance: newFormData.advance,
            balance: newFormData.balance
          });
        }
        
        // Map payment fields from database to UI
        console.log('DETAILED DEBUG - Payment data from database:', {
          database_values: {
            payment_total: patientData.payment.payment_total,
            estimate: patientData.payment.estimate,
            discount_amount: patientData.payment.discount_amount,
            discount_percent: patientData.payment.discount_percent,
            advance: patientData.payment.advance,
            balance: patientData.payment.balance,
            cash_advance: patientData.payment.cash_advance,
            card_upi_advance: patientData.payment.card_upi_advance,
            cheque_advance: patientData.payment.cheque_advance
          },
          sourceType: 'DATABASE_VALUES'
        });
        
        // CRITICAL: Make sure we're using proper string conversion for numeric fields
        // NEVER assign boolean values to numeric fields to avoid browser errors
        
        // For the UI's Total field, use payment_total if available, otherwise fallback to estimate
        // Ensure we're converting to string numbers properly
        let paymentTotalValue = '0.00';
        if (typeof patientData.payment.payment_total === 'boolean') {
          paymentTotalValue = patientData.payment.payment_total ? '1' : '0';
        } else {
          paymentTotalValue = (patientData.payment.payment_total || patientData.payment.final_amount)?.toString() || '0.00';
        }
        newFormData.payment = paymentTotalValue;
        
        // Other payment fields - ensure proper type conversion
        newFormData.estimate = typeof patientData.payment.estimate === 'boolean' ? 
                              (patientData.payment.estimate ? '1' : '0') : 
                              patientData.payment.estimate?.toString() || '0.00';
                              
        newFormData.schAmt = typeof patientData.payment.discount_amount === 'boolean' ? 
                            (patientData.payment.discount_amount ? '1' : '0') : 
                            patientData.payment.discount_amount?.toString() || '0.00';
                            
        newFormData.advance = typeof patientData.payment.advance === 'boolean' ? 
                             (patientData.payment.advance ? '1' : '0') : 
                             patientData.payment.advance?.toString() || '0.00';
        
        // CRITICAL FIX: Use the database balance value directly without recalculation
        // We want to preserve the database balance value exactly as stored
        if (patientData.payment.balance !== undefined && patientData.payment.balance !== null) {
          // Use the database balance value directly
          newFormData.balance = patientData.payment.balance.toString();
          console.log('🔵 USING EXACT DATABASE BALANCE:', patientData.payment.balance);
        } else {
          // Only if balance is not in database, calculate it
          const paymentTotal = parseFloat(paymentTotalValue);
          const advance = parseFloat(newFormData.advance);
          newFormData.balance = Math.max(0, paymentTotal - advance).toFixed(2);
          console.log('⚠️ DATABASE BALANCE NOT FOUND - Using calculated balance:', newFormData.balance);
        }
        
        // Individual advance fields - ensure proper type conversion
        newFormData.cashAdv = typeof patientData.payment.cash_advance === 'boolean' ? 
                              (patientData.payment.cash_advance ? '1' : '0') : 
                              patientData.payment.cash_advance?.toString() || '0.00';
                              
        newFormData.cashAdv2 = '0.00'; // This field isn't in the database, but exists in UI
        
        newFormData.ccUpiAdv = typeof patientData.payment.card_upi_advance === 'boolean' ? 
                               (patientData.payment.card_upi_advance ? '1' : '0') : 
                               patientData.payment.card_upi_advance?.toString() || '0.00';
                               
        newFormData.chequeAdv = typeof patientData.payment.cheque_advance === 'boolean' ? 
                                (patientData.payment.cheque_advance ? '1' : '0') : 
                                patientData.payment.cheque_advance?.toString() || '0.00';
        
        // Do NOT recalculate when loading - display database values directly
        console.log('Using database values directly without recalculation');
        
        // Payment method and date
        newFormData.paymentMethod = patientData.payment.payment_mode || 'Cash';
        newFormData.advDate = patientData.payment.payment_date || getTodayDate();
        
        // IMPORTANT DEBUG: Log the final values after type conversion
        console.log('AFTER CONVERSION - Final payment values:', {
          payment: newFormData.payment,
          estimate: newFormData.estimate,
          schAmt: newFormData.schAmt,
          advance: newFormData.advance,
          balance: newFormData.balance,
          cashAdv: newFormData.cashAdv,
          ccUpiAdv: newFormData.ccUpiAdv,
          chequeAdv: newFormData.chequeAdv
        });
      }
      
      // Add extra debug to check contact lens items
      if (newFormData.contactLensItems && newFormData.contactLensItems.length > 0) {
        console.log('DETAILED ITEM DEBUG - Final mapped items with discount values:', 
          newFormData.contactLensItems.map(item => ({
            qty: item.qty,
            rate: item.rate, 
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            amount: item.amount
          }))
        );
        
        // CRITICAL FIX: Ensure the payment data from database includes the discount values
        // This is needed because sometimes the database returns payment totals but not item discounts
        if (patientData.payment) {
          const discountPercent = parseFloat(patientData.payment.discount_percent || '0');
          const discountAmount = parseFloat(patientData.payment.discount_amount || patientData.payment.scheme_discount || '0');
          
          console.log('FOUND PAYMENT DISCOUNT VALUES FROM DB:', { discountPercent, discountAmount });
          
          // If we have any discount values in the payment but not in the items, apply them to all items
          if ((discountPercent > 0 || discountAmount > 0) && 
              newFormData.contactLensItems.every(item => !item.discountPercent && !item.discountAmount)) {
            
            console.log('APPLYING PAYMENT DISCOUNT TO ITEMS - Items had no discount values but payment did');
            
            // Calculate correct discount values for each item based on payment totals
            newFormData.contactLensItems = newFormData.contactLensItems.map(item => {
              const baseAmount = item.qty * item.rate;
              let itemDiscountPercent = discountPercent;
              let itemDiscountAmount = 0;
              
              if (discountPercent > 0) {
                // Calculate discount amount based on percentage
                const calculatedAmount = baseAmount * discountPercent / 100;
                itemDiscountAmount = parseFloat(calculatedAmount.toFixed(2));
                
                // Debug calculation
                console.log('Calculating discount amount:', { 
                  baseAmount, 
                  discountPercent, 
                  calculatedAmount,
                  itemDiscountAmount
                });
              } else if (discountAmount > 0) {
                // Calculate percentage based on total discount amount and item proportion
                const totalBeforeDiscount = newFormData.contactLensItems.reduce(
                  (sum, i) => sum + (i.qty * i.rate), 0
                );
                const itemProportion = baseAmount / totalBeforeDiscount;
                itemDiscountAmount = parseFloat((discountAmount * itemProportion).toFixed(2));
                itemDiscountPercent = parseFloat(((itemDiscountAmount / baseAmount) * 100).toFixed(2));
              }
              
              // Calculate final amount after discount
              // CRITICAL: Handle the zero quantity edge case
              const finalAmount = baseAmount > 0 ? 
                parseFloat((baseAmount - itemDiscountAmount).toFixed(2)) : 
                parseFloat((item.rate - (item.rate * itemDiscountPercent / 100)).toFixed(2)); // Use item.rate directly if qty is 0
              
              console.log(`Applied discount to item: Base=${baseAmount}, DiscPercent=${itemDiscountPercent}, DiscAmt=${itemDiscountAmount}, Final=${finalAmount}`);
              
              return {
                ...item,
                discountPercent: itemDiscountPercent,
                discountAmount: itemDiscountAmount,
                discount_percent: itemDiscountPercent,
                discount_amount: itemDiscountAmount,
                disc_percent: itemDiscountPercent,
                disc_amount: itemDiscountAmount,
                amount: finalAmount
              };
            });
          }
        }
      }
      
      // Update the form with the new data - SINGLE SOURCE OF TRUTH for payment data
      // We'll use ONLY the newFormData we've already prepared to avoid recalculations
      setFormData(prevState => {
        // Keep a record of the loaded database values for debugging
        console.log('FINAL DB LOAD - Payment data from database:', {
          payment_total: patientData.payment?.payment_total || 0,
          scheme_discount: patientData.payment?.scheme_discount || 0,
          estimate_amount: patientData.payment?.estimate_amount || 0,
          advance: patientData.payment?.advance || 0,
          balance: patientData.payment?.balance || 0,
          newFormData_payment: newFormData.payment,
          newFormData_advance: newFormData.advance,
          newFormData_balance: newFormData.balance
        });
        
        // IMPORTANT: We're NOT recalculating anything here - just using the values
        // that were already converted and prepared in the previous step
        return {
          ...prevState,
          ...newFormData  // Use the newFormData object exactly as prepared above
        };
      });
      
      // CRITICAL: With DB values loaded, we should NEVER recalculate totals
      // Only in the rare case of no payment data at all, we might need initial calculation
      if (!patientData.payment && newFormData.contactLensItems && newFormData.contactLensItems.length > 0) {
        console.log('No payment data from database, calculating initial totals from items');
        // Specify this is NOT a manual calculation (loading from DB)
        calculateTotal(newFormData.contactLensItems, false); 
      } else {
        console.log('SKIPPING CALCULATION - Using exact database values without any recalculation');
        // Explicit log to confirm we're NOT calling calculateTotal() here
        console.log('DB LOAD: Payment values preserved exactly as loaded from database');
      }
      
      // Set flag to indicate DB loading is complete - this allows future UI interactions
      // to calculate values as needed
      setTimeout(() => {
        console.log('DB LOAD COMPLETED - Calculations no longer blocked');
        setIsLoadingFromDB(false);
        
        // FINAL VALIDATION: Verify the discount values are properly loaded in the UI
        console.log('VALIDATION CHECK - Final state of contact lens items:', 
          newFormData.contactLensItems.map(item => ({
            qty: item.qty,
            rate: item.rate,
            baseAmount: item.qty * item.rate,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            calculatedDiscountAmount: (item.qty * item.rate * item.discountPercent / 100).toFixed(2),
            amount: item.amount
          }))
        );
      }, 500);
      
      // Hide the search section to give more focus to the populated form
      setShowSearchSection(false);
      
      // Show success notification
      setNotification({
        message: 'Patient data loaded successfully!',
        type: 'success',
        visible: true
      });
      
      // IMPORTANT: Reset the loading flag now that all data is loaded successfully
      setIsLoadingFromDB(false);
      console.log('DB LOAD COMPLETED - Calculations no longer blocked');
      
    } catch (error) {
      console.error('Error mapping patient data to form:', error);
      setNotification({
        message: 'Error loading patient data',
        type: 'error',
        visible: true
      });
      
      // IMPORTANT: Reset the loading flag in case of error too
      setIsLoadingFromDB(false);
      console.log('DB LOAD FAILED - Calculations no longer blocked');
    }
  };  

  return (
    <div className="p-4">
      <Card>
        <div className="border-b pb-2 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Contact Lens</h1>
            <div className="flex space-x-2">
              <button className="text-blue-600 hover:underline">&lt;&lt; First</button>
              <button className="text-blue-600 hover:underline">&lt; Prev</button>
              <button className="text-blue-600 hover:underline">Next &gt;</button>
              <button className="text-blue-600 hover:underline">Last &gt;&gt;</button>
              <button className="ml-8 text-blue-600 hover:underline">&lt;&lt; Display Prescription History &gt;&gt;</button>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Contact Lens Card</h2>
          
          {/* Search Section */}
          {showSearchSection && (
            <div className="mb-6 pb-4 border-b border-gray-200">
              <ContactLensSearch onSelectPatient={handlePatientSelect} />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div>
            {/* Header Fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Prescription No."
                name="prescriptionNo"
                value={formData.prescriptionNo}
                onChange={handleChange}
              />
              <Input
                label="Ref No."
                name="reference_no"
                value={formData.reference_no}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Input
                  type="datetime-local"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  type="time"
                  label="Time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Input
                  type="datetime-local"
                  label="Dlv. Date"
                  name="dvDate"
                  value={formData.dvDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Input
                  type="time"
                  label="Dlv. Time"
                  name="dvTime"
                  value={formData.dvTime}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select
                label="Class"
                name="class"
                value={formData.class}
                onChange={handleChange}
                options={[
                  { label: 'Select Class', value: '' },
                  { label: 'Business', value: 'Business' },
                  { label: 'Class 1', value: 'Class 1' },
                  { label: 'Class 2', value: 'Class 2' }
                ]}
              />
              <Select
                label="Booking By"
                name="bookingBy"
                value={formData.bookingBy}
                onChange={handleChange}
                options={[
                  { label: 'Select Booking By', value: '' },
                  { label: 'Staff 1', value: 'Staff 1' },
                  { label: 'Staff 2', value: 'Staff 2' }
                ]}
              />
            </div>
            
            {/* Eye Prescription Section */}
            <ContactLensPrescriptionSection 
              formData={formData}
              handleChange={handleChange}
              handleNumericInputChange={handleNumericInputChange}
              handleCheckboxChange={handleCheckboxChange}
            />
          </div>
          
          {/* Right Column - Personal Information */}
          <ContactLensPersonalInfo
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
          />
        </div>
        
        {/* Contact Lens Details Table */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium">Selected Contact Lens Details</h2>
            <button 
              onClick={() => setShowManualForm(true)}
              className="text-blue-600 hover:underline"
            >
              &lt;&lt; Add Contact Lens Manually &gt;&gt;
            </button>
          </div>
          
          <ContactLensItemTable 
            items={formData.contactLensItems}
            setItems={(items) => {
              setFormData({ ...formData, contactLensItems: items });
              calculateTotal(items);
            }}
          />
        </div>
        
        {/* Bottom Section */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Remarks and Order Status */}
          <ContactLensOrderStatus
            formData={formData}
            handleChange={handleChange}
          />
          
          {/* Payment Section */}
          <ContactLensPayment
            formData={formData}
            handleChange={handleChange}
            handleNumericInputChange={handleNumericInputChange}
            discountPercentage={discountPercentage}
            setDiscountPercentage={setDiscountPercentage}
            handleApplyDiscount={handleApplyDiscount}
          />
        </div>
        
        {/* SAVE DATA Button - Prominent Placement */}
        <div className="my-8 flex justify-center">
          <button 
            onClick={() => {
              console.log('SAVE DATA button clicked at ' + new Date().toISOString());
              
              // Basic validation
              if (!formData.prescriptionNo) {
                alert('❌ Prescription number is required');
                setNotification({
                  message: 'Prescription number is required',
                  type: 'error',
                  visible: true
                });
                return;
              }

              if (!formData.bookingBy) {
                alert('❌ Booking by is required');
                setNotification({
                  message: 'Booking by is required',
                  type: 'error',
                  visible: true
                });
                return;
              }

              if (formData.contactLensItems.length === 0) {
                alert('❌ Please add at least one contact lens item');
                setNotification({
                  message: 'Please add at least one contact lens item',
                  type: 'error',
                  visible: true
                });
                return;
              }
              
              // Set saving state
              setIsSaving(true);
              
              try {
                // Prepare data for saving
                // DEBUG: Log the exact values from UI before saving to database
                console.log('DEBUG: Contact lens items being saved to DB:', 
                  formData.contactLensItems.map(item => ({
                    discountPercent: item.discountPercent,
                    discountAmount: item.discountAmount,
                    amount: item.amount
                  }))
                );
                
                // Map contact lens items from UI format to DB format
                const items = formData.contactLensItems.map((item, itemIndex) => {
                  // CRITICAL FIX: No mapping needed now - using consistent values
                  // UI values and DB values are both: 'Right', 'Left', 'Both'
                  const eyeSide = item.side || 'Both'; // Default to 'Both' if undefined
                  
                  // IMPORTANT: Log the selected eye side for verification
                  console.log(`EYE SIDE VALUE for item ${itemIndex}`, { 
                    value: item.side,
                    defaulted: !item.side,
                    finalValue: eyeSide
                  });
                  
                  // Print debug information about the eye side value
                  console.log(`EYE SIDE VALUE FOR ITEM (save):`, {
                    value: eyeSide,
                    // No mapping needed as we're using consistent values
                  });
                  
                  // Specific debug for eye side verification
                  console.log(`DEBUG - Eye side verification:`, {
                    side: item.side,
                    eye_side: eyeSide,
                    areEqual: item.side === eyeSide
                  });
                  
                  // Create a new object with database field names
                  // FIXED: Ensure material, dispose, brand are never empty strings to prevent NULL in database
                  // Add default values if they're empty strings or undefined
                  const materialValue = item.material?.trim() || 'Not specified';
                  const disposeValue = item.dispose?.trim() || 'Not specified';
                  const brandValue = item.brand?.trim() || 'Not specified';
                  
                  console.log('DEBUG - Saving item fields:', {
                    eye_side: eyeSide,
                    material: materialValue, 
                    dispose: disposeValue, 
                    brand: brandValue
                  });
                  
                  // CRITICAL FIX: Preserve exact original values - never apply defaults that could override actual values
                  // Don't substitute '0' for missing values as that causes real values to be lost
                  const bcValue = item.bc || ''; // Never change the original value
                  const powerValue = item.power || ''; 
                  const lensCodeValue = item.lensCode || ''; // Preserve exact lens code
                  const sphValue = item.sph || '';
                  const cylValue = item.cyl || '';
                  const axisValue = item.ax || ''; // Preserve exact axis value
                  
                  // Log complete details of the item being saved
                  console.log('SAVING COMPLETE ITEM DETAILS:', {
                    bc: bcValue,
                    power: powerValue,
                    material: materialValue,
                    dispose: disposeValue,
                    brand: brandValue,
                    lens_code: lensCodeValue,
                    sph: sphValue,
                    cyl: cylValue,
                    axis: axisValue
                  });
                  
                  // IMPORTANT: Convert eye side value to lowercase for database compatibility
                  // Database constraint check_item_eye_side likely expects lowercase values
                  const dbEyeSide = eyeSide.toLowerCase();
                  
                  // Include key debug info about the item being saved
                  console.log(`FULL SAVING DETAILS FOR ITEM ${itemIndex + 1}:`, {
                    original_bc: item.bc,
                    sanitized_bc: bcValue,
                    side: item.side || 'Both', // UI value: 'Right', 'Left', or 'Both'
                    eye_side: eyeSide, // Same as side - no mapping needed
                    db_eye_side: dbEyeSide // Lowercase for database constraint compatibility
                  });
                  
                  return {
                    // CRITICAL FIX: Database constraint requires lowercase values for eye_side
                    // Use dbEyeSide (lowercase version) for database compatibility
                    eye_side: dbEyeSide, // Convert to lowercase to satisfy database constraint
                    base_curve: bcValue,
                    power: powerValue,
                    material: materialValue,
                    dispose: disposeValue,
                    brand: brandValue,
                    diameter: item.diameter,
                    quantity: item.qty,
                    rate: item.rate,
                    // CRITICAL FIX: Ensure discount values are properly saved to database
                    // These field names MUST match what the backend expects
                    discount_percent: parseFloat(item.discountPercent?.toString() || '0') || 0,
                    discount_amount: parseFloat(item.discountAmount?.toString() || '0') || 0,
                    final_amount: parseFloat(item.amount?.toString() || '0') || 0,
                    
                    // For debugging: Log which discount values are being saved
                    discountPercent: parseFloat(item.discountPercent?.toString() || '0') || 0,
                    discountAmount: parseFloat(item.discountAmount?.toString() || '0') || 0,
                    sph: sphValue,
                    cyl: cylValue,
                    axis: axisValue,  // FIXED: Store axis value properly
                    lens_code: lensCodeValue  // FIXED: Store lens code with default value if empty
                  };
                });

                // Map eye data for both eyes
                const eyes = [
                  // Right eye data
                  {
                    eye_side: 'Right',
                    sph: formData.rightEye.dv.sph,
                    cyl: formData.rightEye.dv.cyl,
                    axis: formData.rightEye.dv.ax,
                    add_power: formData.rightEye.dv.add,
                    vn: formData.rightEye.dv.vn,
                    rpd: formData.rightEye.dv.rpd // Add RPD for right eye
                  },
                  // Left eye data
                  {
                    eye_side: 'Left',
                    sph: formData.leftEye.dv.sph,
                    cyl: formData.leftEye.dv.cyl,
                    axis: formData.leftEye.dv.ax,
                    add_power: formData.leftEye.dv.add,
                    vn: formData.leftEye.dv.vn,
                    lpd: formData.leftEye.dv.lpd // Add LPD for left eye
                  }
                ];
                
                // Add IPD to the right eye record if available
                if (formData.ipd) {
                  // Use type assertion to add IPD to the first eye object
                  (eyes[0] as any).ipd = formData.ipd;
                }

                // Calculate total discount amount from items to ensure consistency between items and payment
                const totalItemDiscounts = formData.contactLensItems.reduce((sum, item) => {
                  return sum + (parseFloat(item.discountAmount?.toString() || '0'));
                }, 0);
                
                // Get max discount percentage from items if any
                const maxDiscountPercent = formData.contactLensItems.reduce((max, item) => {
                  const itemPercent = parseFloat(item.discountPercent?.toString() || '0');
                  return itemPercent > max ? itemPercent : max;
                }, 0);
                
                // Parse the schAmt from form data
                const schAmtValue = parseFloat(formData.schAmt || '0');
                
                // If the discount amount in payment section doesn't match total item discounts,
                // use the higher value to ensure all discounts are accounted for
                const finalDiscountAmount = Math.max(schAmtValue, totalItemDiscounts);
                
                // Make sure we calculate the correct payment totals for the database
                const totalAfterDiscount = parseFloat(formData.payment || '0'); // This is already the discounted total
                const totalBeforeDiscount = totalAfterDiscount + finalDiscountAmount; // Add discount back to get original total
                
                // Calculate actual advance payments
                const cashAdvance = parseFloat(formData.cashAdv || '0');
                const cardUpiAdvance = parseFloat(formData.ccUpiAdv || '0');
                const chequeAdvance = parseFloat(formData.chequeAdv || '0');
                const totalAdvance = cashAdvance + cardUpiAdvance + chequeAdvance;
                
                // Calculate balance correctly (total after discount - advances)
                const actualBalance = totalAfterDiscount - totalAdvance;
                
                console.log('Payment values being saved to database:', {
                  payment_total: totalAfterDiscount,
                  estimate: totalBeforeDiscount, // Original total before discount
                  discount_amount: finalDiscountAmount,
                  discount_percent: maxDiscountPercent > 0 ? maxDiscountPercent : parseFloat(discountPercentage || '0'),
                  totalAdvance,
                  actualBalance
                });
                
                // Payment data - mapping UI fields to database fields
                const payment = {
                  // Store discounted total as payment_total
                  payment_total: totalAfterDiscount,
                  
                  // Estimate should be total BEFORE discount
                  estimate: totalBeforeDiscount,
                  
                  // Total of all advances
                  advance: totalAdvance,
                  
                  // Balance can be included now (some databases calculate it, others don't)
                  balance: actualBalance,
                  
                  // Individual advance fields
                  payment_mode: formData.paymentMethod || 'Cash',
                  cash_advance: cashAdvance,
                  card_upi_advance: cardUpiAdvance,
                  cheque_advance: chequeAdvance,
                  
                  // Discount information
                  discount_amount: finalDiscountAmount,
                  discount_percent: maxDiscountPercent > 0 ? maxDiscountPercent : parseFloat(discountPercentage || '0'),
                  scheme_discount: Boolean(finalDiscountAmount > 0),
                  payment_date: formData.advDate || getTodayDate()
                };
                
                // Note: Balance will be calculated in the database as (estimate - advance)

                // Main prescription object
                const prescription = {
                  prescription_id: formData.prescriptionNo,
                  reference_no: formData.reference_no, // Add reference number
                  customer_code: formData.customerCode, // Add customer code
                  birth_day: formData.birthDay, // Add birth day
                  marriage_anniversary: formData.marriageAnniversary, // Add marriage anniversary
                  phone_landline: formData.phoneLandline, // Add phone landline
                  prescribed_by: formData.prescBy, // Add prescribed by
                  booked_by: formData.bookingBy,
                  delivery_date: formData.dvDate,
                  delivery_time: formData.dvTime,
                  status: formData.orderStatus || 'Processing',
                  retest_date: formData.retestAfter,
                  expiry_date: formData.expiryDate,
                  remarks: formData.remarks,
                  name: formData.name,
                  gender: formData.gender,
                  age: formData.age,
                  mobile: formData.mobile,
                  email: formData.email,
                  address: formData.address,
                  city: formData.city,
                  state: formData.state,
                  pin: formData.pin
                };
                
                console.log('Saving data to database using contactLensService:', { prescription, eyes, items, payment });
                
                // Use the contactLensService to save the data
                const contactLensData = {
                  prescription,
                  eyes,
                  items,
                  payment
                };
                
                // Call the service to save data
                contactLensService.saveContactLensPrescription(contactLensData)
                  .then(result => {
                    if (result.success) {
                      console.log('Contact lens data saved successfully!', result);
                      alert('✅ Contact lenses saved successfully!');
                      setNotification({
                        message: 'Contact lenses saved successfully to database!',
                        type: 'success',
                        visible: true
                      });
                      
                      // Update form data with new ID if returned
                      if (result.id) {
                        setFormData(prev => ({ ...prev, id: result.id }));
                      }
                    } else {
                      console.error('Failed to save contact lens data:', result.message);
                      alert('❌ Save failed: ' + (result.message || 'Unknown error'));
                      setNotification({
                        message: `Failed to save contact lens data: ${result.message || 'Unknown error'}`,
                        type: 'error',
                        visible: true
                      });
                    }
                  })
                  .catch(error => {
                    console.error('Error saving data:', error);
                    alert('❌ Error: ' + (error.message || 'Unknown error saving data'));
                    setNotification({
                      message: `Error saving contact lens data: ${error.message || 'Unknown error'}`,
                      type: 'error',
                      visible: true
                    });
                  })
                  .finally(() => {
                    setIsSaving(false);
                  });
              } catch (error) {
                console.error('Error preparing data:', error);
                alert('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error preparing data'));
                setNotification({
                  message: `Error preparing data: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  type: 'error',
                  visible: true
                });
                setIsSaving(false);
              }
            }}
            className={`bg-green-600 ${!isSaving ? 'hover:bg-green-700' : 'opacity-75 cursor-wait'} text-white font-bold py-4 px-8 rounded-lg text-xl shadow-lg transform transition ${!isSaving ? 'hover:scale-105' : ''}`}
            style={{minWidth: '300px', border: '3px solid yellow'}}
            type="button"
            disabled={isSaving}
          >
            {isSaving ? '⏳ SAVING...' : '💾 SAVE DATA 💾'}
          </button>
        </div>
        
        {/* Bottom Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <Button>&lt;&lt; Add Contact Lenses &gt;&gt;</Button>
          <Button 
            onClick={() => setShowSearchSection(!showSearchSection)}
          >
            {showSearchSection ? '« Hide Search »' : '« Show Search »'}
          </Button>
          <Button>&lt;&lt; Print Contact Lenses &gt;&gt;</Button>
          <Button 
            onClick={() => {
              if (confirm('Are you sure you want to clear all data?')) {
                setFormData(initialContactLensForm);
                setShowSearchSection(true);
              }
            }}
          >
            &lt;&lt; Clear All &gt;&gt;
          </Button>
          <Button>&lt;&lt; Exit &gt;&gt;</Button>
        </div>
      </Card>
      
      {/* Render the Toast Notification */}
      {notification.visible && (
        <ToastNotification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, visible: false })}
        />
      )}
      
      {/* Manual Entry Form Popup */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <ContactLensManualForm 
            onAdd={handleAddContactLens}
            onClose={() => setShowManualForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default ContactLensPage;
