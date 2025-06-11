import React, { useState, useEffect, useRef, useCallback } from 'react';
import { unifiedSearch, UnifiedSearchResult } from '../../Services/billingService';

interface CustomerSearchResult {
  id: string;
  source: string;
  prescription_no?: string;
  reference_no?: string;
  name: string;
  displayName?: string;
  mobile_no?: string;
  mobile?: string;
  jobType?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  date?: string;
  originalData?: any;
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

  // Handle customer selection
  const handleSelectCustomer = useCallback((customer: CustomerSearchResult) => {
    onSelectCustomer(customer);
    setSearchValue(`${customer.name} (${customer.mobile || customer.mobile_no || ''})`);
    setShowResults(false);
  }, [onSelectCustomer]);

  // Handle clicks outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showResults && searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [showResults]);

  // Process search results and map to CustomerSearchResult
  const processSearchResults = useCallback((results: UnifiedSearchResult[]): CustomerSearchResult[] => {
    const uniqueResults = new Map<string, CustomerSearchResult>();

    results.forEach(result => {
      const key = `${result.mobile || ''}-${result.name}`.toLowerCase();
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, {
          id: result.id,
          source: result.sourceType || 'unknown',
          jobType: result.jobType || (result.sourceType === 'contact_lens' ? 'CL' : 'P'),
          prescription_no: result.sourceType === 'prescription' ? result.referenceNo : undefined,
          reference_no: result.referenceNo,
          name: result.name,
          displayName: result.name,
          mobile_no: result.mobile,
          mobile: result.mobile,
          email: result.email,
          address: result.address,
          city: result.city,
          state: result.state,
          pin_code: result.pinCode,
          date: result.date,
          originalData: result.originalData || result
        });
      }
    });

    return Array.from(uniqueResults.values());
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
        const results = await unifiedSearch(searchValue);
        const processedResults = processSearchResults(results);
        setSearchResults(processedResults);
        setShowResults(processedResults.length > 0);
      } catch (err) {
        console.error('Error searching customers:', err);
        setError('Failed to search customers. Please try again.');
        setShowResults(false);
      } finally {
        setIsSearching(false);
      }
    };

    // Add debounce to prevent too many API calls
    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchValue, processSearchResults]);

  return (
    <div className="relative w-full" ref={searchContainerRef}>
      <div className="flex flex-col">
        <div className="relative">
          <div className="flex border border-gray-300 rounded">
            <select
              className="bg-gray-100 text-gray-700 border-r border-gray-300 px-2 py-1 text-xs"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="mobile">Mobile</option>
              <option value="reference">Reference No</option>
            </select>
            <input
              type="text"
              className="flex-1 px-2 py-1 text-sm focus:outline-none"
              placeholder={`Search by ${searchField}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {isSearching && (
              <div className="flex items-center px-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              </div>
            )}
          </div>

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
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{customer.name}</span>
                    <div className="flex space-x-1">
                      {customer.jobType?.includes('P') && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">P</span>
                      )}
                      {customer.jobType?.includes('CL') && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">CL</span>
                      )}
                      {customer.jobType?.includes('Order') && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Order</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="mr-1">📱</span>
                      {customer.mobile || customer.mobile_no || 'No phone'}
                    </span>
                    {customer.reference_no && (
                      <div className="flex items-center mt-1">
                        <span className="mr-1">🔖</span>
                        <span className="truncate">{customer.reference_no}</span>
                      </div>
                    )}
                    {customer.prescription_no && customer.prescription_no !== customer.reference_no && (
                      <div className="flex items-center mt-1">
                        <span className="mr-1">📝</span>
                        <span className="truncate">{customer.prescription_no}</span>
                      </div>
                    )}
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
