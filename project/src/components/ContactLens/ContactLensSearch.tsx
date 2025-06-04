import React, { useState, useEffect, useRef } from 'react';
import { contactLensService } from '../../Services/contactLensService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

interface SearchResult {
  id: string;
  prescription_no: string;
  name: string;
  gender?: string;
  age?: string;
  mobile_no?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  date?: string;
  prescribed_by?: string;
  contactLensData: any | null;
}

interface ContactLensSearchProps {
  onSelectPatient: (patientData: any) => void;
}

const ContactLensSearch: React.FC<ContactLensSearchProps> = ({ onSelectPatient }) => {
  const [searchField, setSearchField] = useState<string>('prescription_no');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  
  // Reference to the search container to handle clicks outside
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Debounce timer reference
  const debounceTimerRef = useRef<number | null>(null);

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Effect to perform search when searchValue changes
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Don't search if input is empty
    if (!searchValue.trim()) {
      setSearchResults([]);
      setDropdownOpen(false);
      setError('');
      return;
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = window.setTimeout(async () => {
      await performSearch();
    }, 300); // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue, searchField]);
  
  const performSearch = async () => {
    if (!searchValue.trim()) {
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const result = await contactLensService.searchContactLensPatients(searchField, searchValue);
      
      if (result.success && result.data.length > 0) {
        setSearchResults(result.data);
        setDropdownOpen(true);
      } else if (result.success && result.data.length === 0) {
        setSearchResults([]);
        setError('No matching records found');
      } else {
        setError(result.message || 'Search failed');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearch = async () => {
    await performSearch();
    if (searchResults.length > 0) {
      setShowResults(true);
      setDropdownOpen(false);
    }
  };

  const handleSelectPatient = async (patient: SearchResult) => {
    // If the patient has contact lens data, fetch the detailed prescription
    if (patient.contactLensData) {
      try {
        const detailedData = await contactLensService.getDetailedContactLensData(patient.contactLensData.id);
        
        if (detailedData.success && detailedData.data) {
          onSelectPatient(detailedData.data);
        } else {
          setError('Failed to fetch detailed patient data');
        }
      } catch (error) {
        console.error('Error fetching detailed data:', error);
        setError('Error retrieving patient details');
      }
    } else {
      // If no contact lens data, just pass the basic patient info
      onSelectPatient({
        prescription: {
          prescription_id: patient.id,
          name: patient.name,
          gender: patient.gender,
          age: patient.age,
          mobile: patient.mobile_no,
          email: patient.email,
          address: patient.address,
          city: patient.city,
          state: patient.state,
          pin: patient.pin_code
        },
        eyes: [],
        items: [],
        payment: {}
      });
    }
    
    // Close the results modal
    setShowResults(false);
  };

  return (
    <div className="mb-4" ref={searchContainerRef}>
      <div className="flex items-center space-x-2">
        <div className="w-40">
          <Select
            name="searchField"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="w-full"
            options={[
              { label: 'Prescription No', value: 'prescription_no' },
              { label: 'Reference No', value: 'ref_no' },
              { label: 'Name', value: 'name' },
              { label: 'Mobile Number', value: 'mobile' }
            ]}
          >
            <option value="prescription_no">Prescription No</option>
            <option value="ref_no">Reference No</option>
            <option value="name">Name</option>
            <option value="mobile">Mobile Number</option>
          </Select>
        </div>
        
        <div className="flex-1 relative">
          <Input
            type="text"
            name="searchValue"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`Search by ${searchField === 'prescription_no' ? 'Prescription No' : 
                          searchField === 'ref_no' ? 'Reference No' : 
                          searchField === 'name' ? 'Name' : 'Mobile Number'}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            onFocus={() => {
              if (searchResults.length > 0) {
                setDropdownOpen(true);
              }
            }}
          />
          
          {/* Typeahead Dropdown */}
          {dropdownOpen && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((patient) => (
                <div 
                  key={patient.id} 
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                  onClick={() => {
                    handleSelectPatient(patient);
                    setDropdownOpen(false);
                    setSearchValue(''); // Clear search after selection
                  }}
                >
                  <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-sm text-gray-600">
                      {patient.prescription_no} • {patient.mobile_no || 'No mobile'}
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Select</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
      
      {/* Search Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-4/5 max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Search Results</h2>
              <button 
                onClick={() => setShowResults(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescription No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.prescription_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{patient.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.mobile_no || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.date || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleSelectPatient(patient)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">No results found</div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowResults(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactLensSearch;
