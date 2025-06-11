import React, { useState, useEffect, useRef } from 'react';
import { unifiedSearch } from '../../Services/billingService';

interface CustomerSearchResult {
  id: string;
  source: string;
  prescription_no?: string;
  reference_no?: string;
  name: string;
  displayName?: string;
  mobile_no?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  date?: string;
}

interface CustomerSearchProps {
  onSelectCustomer: (customer: CustomerSearchResult) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onSelectCustomer }) => {
  const [searchField, setSearchField] = useState<string>('name');
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search when searchValue changes
  useEffect(() => {
    const search = async () => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      setError('');

      try {
        // Use unifiedSearch with the searchValue
        const results = await unifiedSearch(searchValue);
        
        // Map the unified search results to match the CustomerSearchResult interface
        const mappedResults = results.map(result => ({
          id: result.id,
          source: result.sourceType,
          prescription_no: result.sourceType === 'prescription' ? result.referenceNo : undefined,
          reference_no: result.referenceNo,
          name: result.name,
          mobile_no: result.mobile,
          email: result.email,
          address: result.address,
          city: result.city,
          state: result.state,
          pin_code: result.pinCode,
          date: result.date
        }));
        
        setSearchResults(mappedResults);
        setShowResults(mappedResults.length > 0);
      } catch (err) {
        console.error('Error searching customers:', err);
        setError('Failed to search customers. Please try again.');
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchField, searchValue]);

  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    onSelectCustomer(customer);
    setShowResults(false);
  };

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="flex space-x-2 mb-2">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className="w-32 px-2 py-1 border rounded text-sm"
        >
          <option value="name">Name</option>
          <option value="mobile_no">Mobile</option>
          <option value="reference_no">Reference No</option>
          <option value="prescription_no">Prescription No</option>
        </select>
        
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`Search by ${searchField.replace('_', ' ')}...`}
            className="w-full px-3 py-1 border rounded text-sm"
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
          />
          
          {isSearching && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-xs mt-1">{error}</div>
          )}
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((customer, index) => (
                <div
                  key={`${customer.source}-${customer.id}-${index}`}
                  className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="font-medium">{customer.displayName || customer.name}</div>
                  <div className="text-sm text-gray-600">
                    {customer.mobile_no && <span>📱 {customer.mobile_no}</span>}
                    {customer.reference_no && <span className="ml-2">🔖 {customer.reference_no}</span>}
                    {customer.prescription_no && <span className="ml-2">📝 {customer.prescription_no}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSearch;
