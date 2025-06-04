import React, { useState } from 'react';
import { X, Minus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTodayDate } from '../../utils/helpers';

// Define the interface for billing items
interface BillingItem {
  id: number;
  selected: boolean;
  itemCode: string;
  rate: string;
  taxPercent: string;
  quantity: string;
  amount: string;
  itemName: string;
  orderNo: string;
  discount: string;
  discountPercent: string;
}

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const [cashMemo, setCashMemo] = useState('B1920-030');
  const [referenceNo, setReferenceNo] = useState('B1920-030');
  const [currentDate, setCurrentDate] = useState(getTodayDate());
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  );
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
  
  // Billing table state
  const [billingItems, setBillingItems] = useState<BillingItem[]>([
    { id: 1, selected: false, itemCode: '', rate: '', taxPercent: '', quantity: '', amount: '', itemName: '', orderNo: '', discount: '', discountPercent: '' },
    { id: 2, selected: false, itemCode: '', rate: '', taxPercent: '', quantity: '', amount: '', itemName: '', orderNo: '', discount: '', discountPercent: '' },
    { id: 3, selected: false, itemCode: '', rate: '', taxPercent: '', quantity: '', amount: '', itemName: '', orderNo: '', discount: '', discountPercent: '' }
  ]);
  const [discountToApply, setDiscountToApply] = useState('');
  
  const jobTypes = ['OrderCard', 'Contact lens', 'Repairing', 'Others'];
  const namePrefixOptions = ['Mr.', 'Mrs.', 'Ms.'];
  
  // Handle checkbox selection change
  const handleSelectionChange = (id: number) => {
    setBillingItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Handle item field changes
  const handleItemChange = (id: number, field: keyof BillingItem, value: string) => {
    setBillingItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    
    // If quantity or rate changes, calculate amount
    if (field === 'quantity' || field === 'rate') {
      const itemToUpdate = billingItems.find(item => item.id === id);
      if (itemToUpdate) {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(itemToUpdate.quantity) || 0;
        const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(itemToUpdate.rate) || 0;
        const amount = (quantity * rate).toFixed(2);
        
        setBillingItems(prevItems => 
          prevItems.map(item => 
            item.id === id ? { ...item, amount } : item
          )
        );
      }
    }
  };

  // Delete selected items
  const handleDeleteSelected = () => {
    const hasSelectedItems = billingItems.some(item => item.selected);
    
    if (hasSelectedItems) {
      setBillingItems(prevItems => {
        const remainingItems = prevItems.filter(item => !item.selected);
        // Always keep at least one empty row
        if (remainingItems.length === 0) {
          return [{ id: Date.now(), selected: false, itemCode: '', rate: '', taxPercent: '', quantity: '', amount: '', itemName: '', orderNo: '', discount: '', discountPercent: '' }];
        }
        return remainingItems;
      });
    }
  };

  // Add new empty row
  const handleAddRow = () => {
    setBillingItems(prevItems => [
      ...prevItems,
      { id: Date.now(), selected: false, itemCode: '', rate: '', taxPercent: '', quantity: '', amount: '', itemName: '', orderNo: '', discount: '', discountPercent: '' }
    ]);
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
