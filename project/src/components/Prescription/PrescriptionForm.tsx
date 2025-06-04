import React, { useState, useEffect } from 'react';
import Dialog from '../ui/Dialog';
import PrintOptionsDialog from '../ui/PrintOptionsDialog';
import ToastNotification from '../ui/ToastNotification';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import Button from '../ui/Button';
import { 
  PrescriptionData
} from '../../types';
import { printOrderCard } from '../../utils/printOrderService';
import { 
  generatePrescriptionNo, 
  calculateIPD, 
  getTodayDate,
  getNextMonthDate,
  titleOptions,
  classOptions,
  prescribedByOptions
} from '../../utils/helpers';
import {
  validatePrescriptionData,
  formatPrescriptionNumber
} from '../../utils/prescriptionUtils';
import LensPrescriptionSection from './LensPrescriptionSection';

interface PrescriptionFormProps {
  onSubmit: (data: PrescriptionData) => void;
  initialData?: PrescriptionData;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ onSubmit, initialData }) => {
  // Use initialData if provided, otherwise use default values
  const [formData, setFormData] = useState<PrescriptionData>(initialData || {
    prescriptionNo: generatePrescriptionNo(),
    referenceNo: '',
    class: '',
    prescribedBy: '',
    date: getTodayDate(),
    name: '',
    title: 'Mr.',
    age: '',
    gender: 'Male',
    customerCode: '',
    birthDay: '',
    marriageAnniversary: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phoneLandline: '',
    mobileNo: '',
    email: '',
    ipd: '',
    rightEye: {
      dv: { sph: '', cyl: '', ax: '', add: '', vn: '', rpd: '' },
      nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
    },
    leftEye: {
      dv: { sph: '', cyl: '', ax: '', add: '', vn: '', lpd: '' },
      nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
    },
    remarks: {
      forConstantUse: false,
      forDistanceVisionOnly: false,
      forNearVisionOnly: false,
      separateGlasses: false,
      biFocalLenses: false,
      progressiveLenses: false,
      antiReflectionLenses: false,
      antiRadiationLenses: false,
      underCorrected: false
    },
    retestAfter: getNextMonthDate(),
    others: '',
    balanceLens: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'; visible: boolean}>({message: '', type: 'error', visible: false});
  const [isSaving] = useState(false);
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showPrintOptionsDialog, setShowPrintOptionsDialog] = useState(false);

  // Update form data when initialData changes (when a search result is selected)
  useEffect(() => {
    if (initialData) {
      console.log('Updating form with initialData:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);
  
  // Force prescription number to be set correctly when component loads
  useEffect(() => {
    // If prescription number is empty, generate a new one
    if (!formData.prescriptionNo) {
      const newPrescriptionNo = generatePrescriptionNo();
      console.log('Setting new prescription number:', newPrescriptionNo);
      setFormData(prev => ({
        ...prev,
        prescriptionNo: newPrescriptionNo,
        // Also set reference number if it's empty
        referenceNo: prev.referenceNo || newPrescriptionNo
      }));
    }
  }, []);

  // Handle initial reference number setting and IPD calculation
  useEffect(() => {
    // Set reference number same as prescription number initially if empty
    if (!formData.referenceNo) {
      setFormData(prev => ({ ...prev, referenceNo: prev.prescriptionNo }));
    }
    
    // Calculate IPD from RPD and LPD
    const calculatedIPD = calculateIPD(formData.rightEye.dv.rpd, formData.leftEye.dv.lpd);
    if (calculatedIPD) {
      setFormData(prev => ({ ...prev, ipd: calculatedIPD }));
    }
  }, [formData.prescriptionNo, formData.rightEye.dv.rpd, formData.leftEye.dv.lpd]);
  
  // Handle copying DV values to NV when DV values change
  useEffect(() => {
    // Copy DV values to NV for right eye if NV values are empty
    if (formData.rightEye.dv.sph && !formData.rightEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        rightEye: {
          ...prev.rightEye,
          nv: { ...prev.rightEye.dv, rpd: prev.rightEye.dv.rpd }
        }
      }));
    }
  }, [formData.rightEye.dv, formData.rightEye.nv.sph]);
  
  // Handle copying DV values to NV for left eye
  useEffect(() => {
    if (formData.leftEye.dv.sph && !formData.leftEye.nv.sph) {
      setFormData(prev => ({
        ...prev,
        leftEye: {
          ...prev.leftEye,
          nv: { ...prev.leftEye.dv, lpd: prev.leftEye.dv.lpd }
        }
      }));
    }
  }, [formData.leftEye.dv, formData.leftEye.nv.sph]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const missingFields: string[] = [];
    
    console.log('validateForm called with state:', { 
      balanceLens: formData.balanceLens, 
      leftEyeDv: formData.leftEye.dv 
    });
    
    if (!formData.prescribedBy) {
      newErrors.prescribedBy = 'Prescribed By is required';
      missingFields.push('Prescribed By');
    }
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
      missingFields.push('Name');
    }

    // Validate right eye prescription
    const rightEyeErrors = validatePrescriptionData(formData.rightEye.dv, false);
    rightEyeErrors.forEach(error => {
      newErrors[`rightEye.dv.${error.field}`] = error.message;
      missingFields.push(`Right Eye ${error.field.toUpperCase()} - ${error.message}`);
    });

    // Validate left eye prescription, considering balance lens
    const leftEyeErrors = validatePrescriptionData(formData.leftEye.dv, formData.balanceLens);
    console.log('Left eye validation:', { 
      isBalanceLens: formData.balanceLens, 
      leftEyeDv: formData.leftEye.dv, 
      errors: leftEyeErrors 
    });
    
    leftEyeErrors.forEach(error => {
      newErrors[`leftEye.dv.${error.field}`] = error.message;
      missingFields.push(`Left Eye ${error.field.toUpperCase()} - ${error.message}`);
    });
    
    setErrors(newErrors);
    console.log('PrescriptionForm: validateForm result', Object.keys(newErrors).length === 0, { newErrors });
    
    // Show toast notification if there are any errors
    if (missingFields.length > 0) {
      const message = missingFields.length === 1
        ? `Please fill the required field: ${missingFields[0]}`
        : `Please fill all required fields (${missingFields.length} missing)`;
        
      setNotification({
        message: message,
        type: 'error',
        visible: true
      });
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!name) {
      console.error('[handleChange] Missing name on event target:', e.target, e);
      console.trace();
      return;
    }

    // Prevent changes to left eye DV fields when balance lens is active
    if (formData.balanceLens && name.startsWith('leftEye.dv.')) {
      const field = name.split('.').pop();
      if (field === 'sph' || field === 'cyl' || field === 'ax') {
        console.log('Preventing change to left eye field when balance lens is active:', name);
        return;
      }
    }

    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PrescriptionData] as object),
          [child]: grandchild 
            ? { 
                ...(prev[parent as keyof PrescriptionData] as any)[child],
                [grandchild]: value 
              }
            : value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when field is filled
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    console.log('handleCheckboxChange called with:', { name, checked });
    
    if (name === 'balanceLens') {
      setFormData(prev => {
        const newState = {
          ...prev,
          balanceLens: checked
        };
        
        // When balance lens is checked, copy right eye values to left eye
        if (checked) {
          newState.leftEye = {
            ...prev.leftEye,
            dv: {
              ...prev.rightEye.dv,
              lpd: prev.leftEye.dv.lpd // Keep original LPD
            },
            nv: { ...prev.rightEye.nv }
          };
        }
        
        return newState;
      });
    } else if (name.includes('.')) {
      // Handle nested checkbox properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PrescriptionData] as object),
          [child]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };
  

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Prevent changes to left eye DV fields when balance lens is active
    if (formData.balanceLens && name.startsWith('leftEye.dv.')) {
      const field = name.split('.').pop();
      if (field === 'sph' || field === 'cyl' || field === 'ax') {
        console.log('Preventing numeric change to left eye field when balance lens is active:', name);
        return;
      }
    }

    // Format the value based on field type
    let formattedValue = value;
    
    // Apply validation and formatting based on field type
    if (name.includes('sph')) {
      formattedValue = formatPrescriptionNumber(value, 'SPH');
    } else if (name.includes('cyl')) {
      formattedValue = formatPrescriptionNumber(value, 'CYL');
    } else if (name.includes('ax')) {
      formattedValue = formatPrescriptionNumber(value, 'AX');
    } else if (name.includes('add')) {
      formattedValue = formatPrescriptionNumber(value, 'ADD');
    } else if (name.includes('rpd') || name.includes('lpd')) {
      // For RPD and LPD, allow direct input without formatting
      formattedValue = value;
    }

    // Call handleChange with a proper event object
    handleChange({
      target: {
        name,
        value: formattedValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  // Helper functions for future implementation
  // Note: This function is kept for future use but marked with a comment to avoid lint warnings
  /* const calculateVnDivision = (value: string): string => {
    if (!value.startsWith('6/')) return value;
    const denominator = value.substring(2);
    if (!denominator || denominator === '0') return value;
    
    const result = 6 / parseInt(denominator, 10);
    // Only show division result if it's a clean number
    if (Number.isInteger(result)) {
      return `6/${denominator} (${result})`;
    }
    return value;
  }; */

  const manualSave = async () => {
    try {
      // Call the onSubmit prop with the form data
      onSubmit(formData);
      return { success: true };
    } catch (error) {
      console.error('Error in manualSave:', error);
      return { success: false };
    }
  };

  // Handler for the first confirmation dialog (Yes button)
  const handleSaveConfirm = async () => {
    setShowSaveConfirmDialog(false);
    
    try {
      const result = await manualSave();
      if (result && result.success) {
        // After saving successfully, show the print dialog
        setShowPrintDialog(true);
      } else {
        alert('Failed to save prescription. Please try again.');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('An error occurred while saving the prescription.');
    }
  };
  
  // Handlers for the print dialog
  const handlePrintConfirm = () => {
    // Close the print confirm dialog and show the print options dialog
    setShowPrintDialog(false);
    setShowPrintOptionsDialog(true);
  };

  // Handler for printing order card
  const handlePrintOrderCard = () => {
    // Format remarks as a string
    const formatRemarks = (remarks: any): string => {
      if (!remarks) return '';
      
      // Convert the remarks object to an array of selected remarks
      const selectedRemarks = Object.entries(remarks)
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          // Convert camelCase to Title Case
          return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
        });
      
      return selectedRemarks.join(', ');
    };

    // Sample order data - replace with actual data from your state/database
    const orderData = {
      orderNumber: formData.prescriptionNo || 'ORD-' + Math.floor(Math.random() * 10000),
      customerName: formData.name,
      bookingDate: new Date(),
      deliveryDate: formData.retestAfter ? new Date(formData.retestAfter) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      estimateAmount: 1000, // Replace with actual amount
      advanceAmount: 500,   // Replace with actual advance
      balanceAmount: 500,   // Replace with actual balance
      items: [
        {
          description: 'Spectacles',
          qty: 1,
          rate: 1000,
          amount: 1000
        }
      ],
      remarks: formatRemarks(formData.remarks)
    };
    
    printOrderCard(orderData);
  };

  // Handler for print options selection
  const handlePrintOptionSelected = (option: 'normal' | 'card') => {
    // Handle the selected print option
    if (option === 'normal') {
      console.log('Print Normal Size');
      // Implement normal size printing logic
    } else if (option === 'card') {
      console.log('Print Card Size');
      // Implement card size printing logic
    }
    
    // After printing, generate new prescription number for next entry
    setFormData(prev => ({
      ...prev,
      prescriptionNo: generatePrescriptionNo(),
      referenceNo: ''
    }));
  };
  
  const handlePrintCancel = () => {
    setShowPrintDialog(false);
    
    // Generate new prescription number for next entry after completion
    setFormData(prev => ({
      ...prev,
      prescriptionNo: generatePrescriptionNo(),
      referenceNo: ''
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('PrescriptionForm: handleFormSubmit triggered');
    
    // If balance lens is checked, copy right eye values to left eye before validation
    if (formData.balanceLens) {
      setFormData(prev => ({
        ...prev,
        leftEye: {
          ...prev.leftEye,
          dv: {
            ...prev.rightEye.dv,
            lpd: prev.leftEye.dv.lpd // Keep original LPD
          },
          nv: { ...prev.rightEye.nv }
        }
      }));
    }
  
    if (validateForm()) {
      // Show the first confirmation dialog instead of saving directly
      setShowSaveConfirmDialog(true);
    }
  };  

  const handleClear = () => {
    const newPrescriptionNo = generatePrescriptionNo();
    
    setFormData({
      prescriptionNo: newPrescriptionNo,
      referenceNo: newPrescriptionNo, // Set to same as prescription number
      class: '',
      prescribedBy: '',
      date: getTodayDate(),
      name: '',
      title: 'Mr.',
      age: '',
      gender: 'Male',
      customerCode: '',
      birthDay: '',
      marriageAnniversary: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      phoneLandline: '',
      mobileNo: '',
      email: '',
      ipd: '',
      rightEye: {
        dv: { sph: '', cyl: '', ax: '', add: '', vn: '', rpd: '' },
        nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
      },
      leftEye: {
        dv: { sph: '', cyl: '', ax: '', add: '', vn: '', lpd: '' },
        nv: { sph: '', cyl: '', ax: '', add: '', vn: '' }
      },
      remarks: {
        forConstantUse: false,
        forDistanceVisionOnly: false,
        forNearVisionOnly: false,
        separateGlasses: false,
        biFocalLenses: false,
        progressiveLenses: false,
        antiReflectionLenses: false,
        antiRadiationLenses: false,
        underCorrected: false
      },
      retestAfter: getNextMonthDate(),
      others: '',
      balanceLens: false
    });
    
    setErrors({});
  };

  return (
    <form onSubmit={handleFormSubmit} className="max-w-7xl mx-auto">
      {notification.visible && (
        <ToastNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({...notification, visible: false})}
        />
      )}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Saving...
        </div>
      )}
      
      {/* First Confirmation Dialog - Save Confirmation */}
      <Dialog isOpen={showSaveConfirmDialog} onClose={() => setShowSaveConfirmDialog(false)}>
        <div className="text-center py-4">
          <p className="text-base mb-6">
            New Prescription For The Customer Will Be Added. Do You Want To Save The Record For This Customer?
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={handleSaveConfirm}
              className="px-6 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200"
            >
              Yes
            </button>
            <button 
              onClick={() => setShowSaveConfirmDialog(false)}
              className="px-6 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200"
            >
              No
            </button>
          </div>
        </div>
      </Dialog>
      
      {/* Second Confirmation Dialog - Print Card Question */}
      <Dialog isOpen={showPrintDialog} onClose={handlePrintCancel}>
        <div className="text-center py-2">
          <p className="font-medium mb-4">Print Prescription Card</p>
          <p className="text-base mb-4">
            Do You Want To Print The Prescription Card
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={handlePrintConfirm}
              className="px-6 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200"
            >
              Yes
            </button>
            <button 
              onClick={handlePrintCancel}
              className="px-6 py-1 border border-gray-300 bg-gray-100 hover:bg-gray-200"
            >
              No
            </button>
          </div>
        </div>
      </Dialog>
      
      {/* Third Dialog - Print Options */}
      <PrintOptionsDialog 
        isOpen={showPrintOptionsDialog} 
        onClose={() => setShowPrintOptionsDialog(false)}
        onPrintOptionSelected={handlePrintOptionSelected}
        prescriptionData={formData}
      />
      
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Button type="button" variant="outline" size="sm">
            &lt;&lt; Consultation Fee &gt;&gt;
          </Button>
          
          <div className="flex space-x-2">
            <Button type="button" variant="outline" size="sm">
              &lt;&lt; First
            </Button>
            <Button type="button" variant="outline" size="sm">
              {"< Prev"}
            </Button>
            <Button type="button" variant="outline" size="sm">
              Next &gt;
            </Button>
            <Button type="button" variant="outline" size="sm">
              Last &gt;&gt;
            </Button>
          </div>
          
          <Button type="button" variant="outline" size="sm">
            &lt;&lt; Display Prescription History &gt;&gt;
          </Button>
        </div>
        
        {/* Header Section */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <Input 
              label="Prescription No.:"
              value={formData.prescriptionNo || 'P2324-' + (Math.floor(Math.random() * 900) + 100)} 
              onChange={handleChange}
              name="prescriptionNo"
            />
          </div>
          <div>
            <Input 
              label="Reference No.:" 
              value={formData.referenceNo} 
              onChange={handleChange}
              name="referenceNo"
            />
          </div>
          <div>
            <Select 
              label="Class:" 
              options={classOptions}
              value={formData.class} 
              onChange={handleChange}
              name="class"
            />
          </div>
          <div>
            <Select 
              label="Prescribed By:" 
              options={prescribedByOptions}
              value={formData.prescribedBy} 
              onChange={handleChange}
              name="prescribedBy"
              required
              error={errors.prescribedBy}
            />
          </div>
          <div>
            <Input 
              label="Date:" 
              type="date"
              value={formData.date} 
              onChange={handleChange}
              name="date"
            />
          </div>
        </div>
        
        {/* Personal Information Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 border-b pb-1">
            Personal Information (Customer's Personal Information Can Only Be Edited Through Customer Master Form)
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Select 
                label="Title"
                options={titleOptions}
                value={formData.title} 
                onChange={handleChange}
                name="title"
                className="w-24"
                fullWidth={false}
              />
              <Input 
                label="Name" 
                value={formData.name} 
                onChange={handleChange}
                name="name"
                required
                error={errors.name}
              />
            </div>
            <div>
              <Input 
                label="Age" 
                type="number"
                value={formData.age} 
                onChange={handleChange}
                name="age"
              />
            </div>
            <div>
              <Input 
                label="Customer Code:" 
                value={formData.customerCode} 
                onChange={handleChange}
                name="customerCode"
              />
            </div>
            
            <div>
              <RadioGroup
                label="Gender"
                name="gender"
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' }
                ]}
                value={formData.gender}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                label="Birth Day:" 
                type="date"
                value={formData.birthDay} 
                onChange={handleChange}
                name="birthDay"
              />
            </div>
            <div>
              <Input 
                label="Marr Anniv:" 
                type="date"
                value={formData.marriageAnniversary} 
                onChange={handleChange}
                name="marriageAnniversary"
              />
            </div>
            
            <div className="col-span-3">
              <Input 
                label="Address" 
                value={formData.address} 
                onChange={handleChange}
                name="address"
              />
            </div>
            
            <div>
              <Input 
                label="City" 
                value={formData.city} 
                onChange={handleChange}
                name="city"
              />
            </div>
            <div>
              <Input 
                label="State" 
                value={formData.state} 
                onChange={handleChange}
                name="state"
              />
            </div>
            <div>
              <Input 
                label="IPD:" 
                value={formData.ipd} 
                onChange={handleNumericInput}
                name="ipd"
                className="text-center"
              />
            </div>
            
            <div>
              <Input 
                label="Phone (L.L.)" 
                value={formData.phoneLandline} 
                onChange={handleChange}
                name="phoneLandline"
              />
            </div>
            <div>
              <Input 
                label="Pin" 
                value={formData.pinCode} 
                onChange={handleChange}
                name="pinCode"
              />
            </div>
            <div className="row-span-2 flex items-center justify-center">
              <div className="bg-gray-200 h-32 w-32 flex items-center justify-center border border-gray-300">
                <span className="text-gray-500 text-sm">Photo</span>
              </div>
            </div>
            
            <div>
              <Input 
                label="Mobile No." 
                value={formData.mobileNo} 
                onChange={handleChange}
                name="mobileNo"
                required
                error={errors.mobileNo}
              />
            </div>
            <div>
              <Input 
                label="Email" 
                type="email"
                value={formData.email} 
                onChange={handleChange}
                name="email"
              />
            </div>
          </div>
        </div>
        
        {/* Prescription Section */}
        <LensPrescriptionSection
          formData={{
            ...formData,
            age: parseInt(formData.age) || 0
          }}
          handleChange={handleChange}
          handleNumericInputChange={handleNumericInput}
          handleCheckboxChange={handleCheckboxChange}
        />
        
        {/* Remarks Section */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Remarks:</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Checkbox 
                label="FOR CONSTANT USE"
                checked={formData.remarks.forConstantUse}
                onChange={handleCheckboxChange}
                name="remarks.forConstantUse"
              />
              <Checkbox 
                label="FOR DISTANCE VISION ONLY"
                checked={formData.remarks.forDistanceVisionOnly}
                onChange={handleCheckboxChange}
                name="remarks.forDistanceVisionOnly"
              />
              <Checkbox 
                label="FOR NEAR VISION ONLY"
                checked={formData.remarks.forNearVisionOnly}
                onChange={handleCheckboxChange}
                name="remarks.forNearVisionOnly"
              />
            </div>
            <div>
              <Checkbox 
                label="SEPARATE GLASSES"
                checked={formData.remarks.separateGlasses}
                onChange={handleCheckboxChange}
                name="remarks.separateGlasses"
              />
              <Checkbox 
                label="BI FOCAL LENSES"
                checked={formData.remarks.biFocalLenses}
                onChange={handleCheckboxChange}
                name="remarks.biFocalLenses"
              />
              <Checkbox 
                label="PROGRESSIVE LENSES"
                checked={formData.remarks.progressiveLenses}
                onChange={handleCheckboxChange}
                name="remarks.progressiveLenses"
              />
            </div>
            <div>
              <Checkbox 
                label="ANTI REFLECTION LENSES"
                checked={formData.remarks.antiReflectionLenses}
                onChange={handleCheckboxChange}
                name="remarks.antiReflectionLenses"
              />
              <Checkbox 
                label="ANTI RADIATION LENSES"
                checked={formData.remarks.antiRadiationLenses}
                onChange={handleCheckboxChange}
                name="remarks.antiRadiationLenses"
              />
              <Checkbox 
                label="UNDERCORRECTED"
                checked={formData.remarks.underCorrected}
                onChange={handleCheckboxChange}
                name="remarks.underCorrected"
              />
            </div>
          </div>
        </div>
        
        {/* Additional Info Section */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <Input 
              label="Retest After" 
              type="date"
              value={formData.retestAfter} 
              onChange={handleChange}
              name="retestAfter"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Others
            </label>
            <textarea
              value={formData.others}
              onChange={handleChange}
              name="others"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button type="submit" variant="action">
            &lt;&lt; Add Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action">
            &lt;&lt; Edit/Search Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action" onClick={handlePrintConfirm}>
            &lt;&lt; Print Prescription &gt;&gt;
          </Button>

          <Button type="button" variant="action" onClick={handleClear}>
            &lt;&lt; Clear Prescription &gt;&gt;
          </Button>
          <Button type="button" variant="action">
            &lt;&lt; Exit &gt;&gt;
          </Button>
        </div>
      </Card>
    </form>
  );
};

export default PrescriptionForm;