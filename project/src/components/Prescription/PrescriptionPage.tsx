import React, { useState, useRef, useEffect } from 'react';
import PrescriptionForm from './PrescriptionForm';
import { PrescriptionData } from '../../types';
import ToastNotification from '../ui/ToastNotification';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { supabase } from '../../Services/supabaseService';
import { prescriptionService } from '../../Services/supabaseService';

// Interface for search suggestions based on API response
interface SearchSuggestion extends PrescriptionData {
  id: string;
}

const PrescriptionPage: React.FC = () => {
  // Reference for search timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [formData, setFormData] = useState<PrescriptionData>({
    prescriptionNo: '',
    referenceNo: '',
    class: '',
    prescribedBy: '',
    date: new Date().toISOString().split('T')[0],
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
    retestAfter: '',
    others: '',
    balanceLens: false
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Use callback handler for showing error toast
  const showErrorToast = (error: string) => {
    setToastMessage(`Error saving prescription: ${error}`);
    setToastType('error');
    setShowToast(true);
  };
  
  // Auto-suggestion search function
  const searchPrescriptions = (query: string, field: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout if it exists
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Define the column to search based on the field
        let column = '';
        switch (field) {
          case 'prescriptionNo': column = 'prescription_no'; break;
          case 'referenceNo': column = 'reference_no'; break;
          case 'name': column = 'name'; break;
          case 'mobileNo': column = 'mobile_no'; break;
          default: return; // Don't search for other fields
        }

        console.log(`[PrescriptionPage] Searching for ${column} containing: ${query}`);
        
        // Simplify query to match the pattern used in OrderCardForm
        console.log(`[PrescriptionPage] Executing query for ${column}=${query}`);
        
        // Create a simpler selection string to avoid formatting issues
        const selectString = '*,eye_prescriptions(id,prescription_id,eye_type,vision_type,sph,cyl,ax,add_power,vn,rpd,lpd),prescription_remarks(*)'; 
        
        // Try exact match first
        let { data, error } = await supabase
          .from('prescriptions')
          .select(selectString)
          .eq(column, query)
          .limit(5);
          
        // If no exact matches, try partial match for name/mobile
        if ((!data || data.length === 0) && (column === 'name' || column === 'mobile_no')) {
          console.log(`[PrescriptionPage] No exact matches, trying partial match for: ${query}`);
          const result = await supabase
            .from('prescriptions')
            .select(selectString)
            .ilike(column, `%${query}%`)
            .limit(5);
            
          data = result.data;
          error = result.error;
        }
          
        if (error) {
          console.error('[PrescriptionPage] Supabase search error:', error);
          setToastMessage(`Search failed: ${error.message}`);
          setToastType('error');
          setShowToast(true);
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        
        console.log('[PrescriptionPage] Raw search results from Supabase:', JSON.stringify(data, null, 2));

        if (!data || data.length === 0) {
          console.log('[PrescriptionPage] No search results found');
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
          
        console.log('[PrescriptionPage] Search results:', data);
      
        // Transformation of database results to match your interface including eye prescriptions
        const transformedData: SearchSuggestion[] = data.map((item: any) => {
          console.log('[PrescriptionPage] Transforming item:', item);
          // Check if eye_prescriptions and prescription_remarks arrays exist
          const eyePrescriptions = item.eye_prescriptions || [];
          const prescriptionRemarks = item.prescription_remarks || [];

          console.log('[PrescriptionPage] Raw remarks data for transformation:', prescriptionRemarks);

          // Find DV and NV for both eyes from the fetched eye_prescriptions
          const rightDv = eyePrescriptions.find((ep: any) => ep.eye_type === 'right' && ep.vision_type === 'dv');
          const rightNv = eyePrescriptions.find((ep: any) => ep.eye_type === 'right' && ep.vision_type === 'nv');
          const leftDv = eyePrescriptions.find((ep: any) => ep.eye_type === 'left' && ep.vision_type === 'dv');
          const leftNv = eyePrescriptions.find((ep: any) => ep.eye_type === 'left' && ep.vision_type === 'nv');
          
          // Extract and map remarks data, ensuring it's the first element if it's an array
          const remarksData = Array.isArray(prescriptionRemarks) && prescriptionRemarks.length > 0 
            ? prescriptionRemarks[0] 
            : {}; // Default to empty object if no remarks

          console.log('[PrescriptionPage] Processed remarks data for mapping:', remarksData);

          const transformedItem: SearchSuggestion = {
            id: item.id,
            prescriptionNo: item.prescription_no || '',
            referenceNo: item.reference_no || '',
            class: item.class || '',
            prescribedBy: item.prescribed_by || '',
            date: item.date || '',
            name: item.name || '',
            title: item.title || '',
            age: String(item.age || ''),
            gender: item.gender || 'Male',
            customerCode: item.customer_code || '',
            birthDay: item.birth_day || '',
            marriageAnniversary: item.marriage_anniversary || '',
            address: item.address || '',
            city: item.city || '',
            state: item.state || '',
            pinCode: item.pin_code || '',
            phoneLandline: item.phone_landline || '',
            mobileNo: item.mobile_no || '',
            email: item.email || '',
            ipd: String(item.ipd || ''),
            rightEye: {
              dv: {
                sph: String(rightDv?.sph || ''),
                cyl: String(rightDv?.cyl || ''),
                ax: String(rightDv?.ax || ''),
                add: String(rightDv?.add_power || ''),
                vn: rightDv?.vn || '',
                rpd: String(rightDv?.rpd || ''),
              },
              nv: {
                sph: String(rightNv?.sph || ''),
                cyl: String(rightNv?.cyl || ''),
                ax: String(rightNv?.ax || ''),
                add: String(rightNv?.add_power || ''),
                vn: rightNv?.vn || '',
              }
            },
            leftEye: {
              dv: {
                sph: String(leftDv?.sph || ''),
                cyl: String(leftDv?.cyl || ''),
                ax: String(leftDv?.ax || ''),
                add: String(leftDv?.add_power || ''),
                vn: leftDv?.vn || '',
                lpd: String(leftDv?.lpd || ''),
              },
              nv: {
                sph: String(leftNv?.sph || ''),
                cyl: String(leftNv?.cyl || ''),
                ax: String(leftNv?.ax || ''),
                add: String(leftNv?.add_power || ''),
                vn: leftNv?.vn || '',
              }
            },
            // Map database remarks (snake_case) to form state (camelCase)
            remarks: {
              forConstantUse: Boolean(remarksData.for_constant_use),
              forDistanceVisionOnly: Boolean(remarksData.for_distance_vision_only),
              forNearVisionOnly: Boolean(remarksData.for_near_vision_only),
              separateGlasses: Boolean(remarksData.separate_glasses),
              biFocalLenses: Boolean(remarksData.bi_focal_lenses),
              progressiveLenses: Boolean(remarksData.progressive_lenses),
              antiReflectionLenses: Boolean(remarksData.anti_reflection_lenses),
              antiRadiationLenses: Boolean(remarksData.anti_radiation_lenses),
              underCorrected: Boolean(remarksData.under_corrected)
            },
            retestAfter: item.retest_after || '',
            others: item.others || '',
            balanceLens: item.balance_lens || false,
          };

          console.log('[PrescriptionPage] Transformed item before returning:', transformedItem);
          return transformedItem;
        });

        console.log('[PrescriptionPage] Final transformed suggestions:', transformedData);
        setSuggestions(transformedData);
        setShowSuggestions(transformedData.length > 0);
      } catch (error) {
        console.error('[PrescriptionPage] Error during search and transformation:', error);
        setToastMessage(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setToastType('error');
        setShowToast(true);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // Debounce search
  };

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchTerm(value);
    setActiveField(name);
    searchPrescriptions(value, name);
  };

  // Handle selection of a search suggestion
  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    console.log('[PrescriptionPage] Selected suggestion raw data:', suggestion);
    // Fetch the full prescription data by ID when a suggestion is selected
    // This ensures we have all related data (eye_prescriptions, remarks, etc.)
    try {
      // Although the search query in searchPrescriptions includes remarks,
      // calling getPrescription here ensures we have the most complete and consistently structured data
      const fullPrescriptionData = await prescriptionService.getPrescription(suggestion.id);
      
      console.log('[PrescriptionPage] Fetched full prescription data:', fullPrescriptionData);

      if (fullPrescriptionData) {
        // Use the fetched full data to populate the form
        setFormData(fullPrescriptionData);
        console.log('[PrescriptionPage] Updating form with initialData from full fetch:', fullPrescriptionData);
      } else {
        console.warn('[PrescriptionPage] Failed to fetch full prescription data for ID:', suggestion.id);
        // Fallback to populating form with basic suggestion data if full fetch fails
        // remarks mapping is already handled in the searchPrescriptions transformation
        setFormData(suggestion);
        console.log('[PrescriptionPage] Updating form with initialData from suggestion fallback:', suggestion);
        // Optionally show an error message
        setToastMessage('Could not load full prescription details.');
        setToastType('error');
        setShowToast(true);
      }

    } catch (error) {
      console.error('[PrescriptionPage] Error fetching full prescription data:', error);
      // Fallback to populating form with basic suggestion data if fetch fails
      // remarks mapping is already handled in the searchPrescriptions transformation
      setFormData(suggestion);
      console.log('[PrescriptionPage] Updating form with initialData from suggestion fallback due to error:', suggestion);
      // Show an error message
      setToastMessage(`Error loading prescription details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setToastType('error');
      setShowToast(true);
    }

    setSearchTerm(''); // Clear search term on selection
    setShowSuggestions(false); // Hide suggestions
    // Clear the specific search input field that was used
    setActiveField('');
  };

  // Track saving state
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual save function - now accepts an optional prescriptionId parameter
  const savePrescription = async (data: PrescriptionData, prescriptionId?: string) => {
    setIsSaving(true);
    try {
      // Pass the prescription ID to ensure we update instead of creating a new record
      const result = await prescriptionService.autoSavePrescription(data, prescriptionId);
      if (result.success) {
        const actionType = prescriptionId ? 'updated' : 'created';
        setToastMessage(`Prescription ${actionType} successfully`);
        setToastType('success');
        setShowToast(true);
        return result;
      } else {
        showErrorToast(result.error || 'Unknown error');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error saving prescription';
      showErrorToast(errorMessage);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (data: PrescriptionData) => {
    console.log('PrescriptionPage: handleSubmit triggered', data);
    
    // Check if this is an update (data has an ID) or a new prescription
    const isUpdate = !!data.id;
    console.log(`Performing ${isUpdate ? 'UPDATE' : 'CREATE'} operation for prescription`, {
      id: data.id,
      prescriptionNo: data.prescriptionNo
    });
    
    // Update the form data
    setFormData(data);
    
    // Save the prescription manually (only when the Add Prescription button is clicked)
    // Pass the ID if this is an update operation
    const result = await savePrescription(data, data.id);
    
    // If save was successful and we have a new ID (for new prescriptions), update the form data with the returned ID
    if (result?.data?.id && !isUpdate) {
      setFormData(prev => ({
        ...prev,
        id: result.data.id
      }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Prescription Entry Form</h2>
      
      {/* Search Section */}
      <Card className="mb-4">
        <div className="grid grid-cols-4 gap-4 mb-4" ref={searchRef}>
          <div>
            <Input
              label="Search by Prescription No"
              name="prescriptionNo"
              value={activeField === 'prescriptionNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter prescription number"
            />
          </div>
          <div>
            <Input
              label="Search by Reference No"
              name="referenceNo"
              value={activeField === 'referenceNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter reference number"
            />
          </div>
          <div>
            <Input
              label="Search by Name"
              name="name"
              value={activeField === 'name' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter patient name"
            />
          </div>
          <div>
            <Input
              label="Search by Mobile No"
              name="mobileNo"
              value={activeField === 'mobileNo' ? searchTerm : ''}
              onChange={handleSearchInputChange}
              placeholder="Enter mobile number"
            />
          </div>
        </div>
        
        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            className="absolute z-50 w-full md:w-1/2 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
            ref={suggestionRef}
          >
            <ul className="py-1">
              {suggestions.map((suggestion) => (
                <li 
                  key={suggestion.id} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{suggestion.name}</span>
                    <span className="text-sm text-gray-500">{suggestion.prescriptionNo}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.mobileNo && <span className="mr-2">📱 {suggestion.mobileNo}</span>}
                    {suggestion.date && <span>📅 {suggestion.date}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      
      <PrescriptionForm onSubmit={handleSubmit} initialData={formData} />
      {showToast && (
        <ToastNotification
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow">
          Saving...
        </div>
      )}
    </div>
  );
};

export default PrescriptionPage;