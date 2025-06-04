import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { ContactLensFormData } from './ContactLensTypes';

interface ContactLensPaymentProps {
  formData: ContactLensFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  discountPercentage: string;
  setDiscountPercentage: (value: string) => void;
  handleApplyDiscount: () => void;
}

const ContactLensPayment: React.FC<ContactLensPaymentProps> = ({
  formData,
  handleChange,
  handleNumericInputChange,
  discountPercentage,
  setDiscountPercentage,
  handleApplyDiscount,
}) => {
  const paymentMethods = [
    { label: 'Select Payment Method', value: '' },
    { label: 'Cash', value: 'Cash' },
    { label: 'Credit Card', value: 'CreditCard' },
    { label: 'Debit Card', value: 'DebitCard' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Cheque', value: 'Cheque' },
  ];

  // Define calculation functions first to fix reference errors
  const isDatabaseSource = formData.sourceType === 'DATABASE_VALUES';
  
  // Calculate total advance - respect database values when loading
  const calculateTotalAdvance = () => {
    if (isDatabaseSource && formData.advance) {
      return parseFloat(formData.advance);
    }
    const cashAdv = parseFloat(formData.cashAdv) || 0;
    const ccUpiAdv = parseFloat(formData.ccUpiAdv) || 0;
    const chequeAdv = parseFloat(formData.chequeAdv) || 0;
    return cashAdv + ccUpiAdv + chequeAdv;
  };
  
  // Total amount - use payment value directly when loading from database
  const totalAmount = isDatabaseSource 
    ? parseFloat(formData.payment || '0')
    : parseFloat(formData.payment) || formData.contactLensItems.reduce((sum, item) => {
        return sum + (parseFloat(item.amount?.toString()) || 0);
      }, 0);

  // Balance calculation - use database value directly when available
  const calculateBalance = () => {
    if (isDatabaseSource && formData.balance) {
      return formData.balance;
    }
    
    // For non-database sources, calculate as before
    const total = totalAmount;
    const advance = calculateTotalAdvance();
    return Math.max(0, total - advance).toFixed(2);
  };
  
  // Original amount - use estimate from database when available
  const originalAmount = isDatabaseSource && formData.estimate
    ? parseFloat(formData.estimate)
    : parseFloat(formData.estimate) || formData.contactLensItems.reduce((sum, item) => {
        const qty = parseFloat(item.qty?.toString() || '1');
        const rate = parseFloat(item.rate?.toString() || '0');
        return sum + (qty * rate);
      }, 0);

  // Log debugging info AFTER functions are defined
  console.log('PaymentSection - DEBUG INFO:', {
    sourceType: formData.sourceType || 'UNKNOWN',
    formData: {
      advance: formData.advance,
      balance: formData.balance,
      advanceInputs: {
        cashAdv: formData.cashAdv,
        ccUpiAdv: formData.ccUpiAdv,
        chequeAdv: formData.chequeAdv
      }
    },
    calculatedValues: {
      totalAdvance: calculateTotalAdvance().toFixed(2),
      balance: calculateBalance(),
      rawInputs: {
        payment: formData.payment,
        estimate: formData.estimate,
        schAmt: formData.schAmt
      }
    },
    displayed: {
      totalAdvance: calculateTotalAdvance().toFixed(2),
      balance: calculateBalance()
    }
  });

  // Handle advance changes
  const handleAdvanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the specific advance field
    handleNumericInputChange(e);

    // Calculate new totals after the state has been updated
    setTimeout(() => {
      const totalAdvance = calculateTotalAdvance();
      const schAmt = parseFloat(formData.schAmt) || 0;
      const balance = Math.max(0, totalAmount - schAmt - totalAdvance);

      // Update advance field
      handleChange({
        target: {
          name: 'advance',
          value: totalAdvance.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>);

      // Update balance field
      handleChange({
        target: {
          name: 'balance',
          value: balance.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }, 0);
  };

  return (
    <div className="border rounded p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Payment</span>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-700">Apply discount:</span>
            <Input
              type="number"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              className="w-16 h-7 text-xs text-center"
              placeholder="0"
              min="0"
              max="100"
            />
            <span className="text-sm">%</span>
            <button 
              onClick={handleApplyDiscount}
              className="bg-green-500 text-white text-xs px-2 py-1 rounded"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column - Payment Details */}
        <div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs text-gray-700">Total</label>
              <Input
                name="payment"
                value={totalAmount.toFixed(2)}
                readOnly
                className="bg-blue-50 h-8"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700">Estimate</label>
              <Input
                name="estimate"
                value={originalAmount.toFixed(2)}
                readOnly
                className="bg-blue-50 h-8"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs text-gray-700 text-red-600">Sch Amt</label>
              <Input
                name="schAmt"
                value={formData.schAmt}
                onChange={handleNumericInputChange}
                className="bg-blue-50 h-8"
                type="number"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700">Advance</label>
              <Input
                name="advance"
                value={calculateTotalAdvance().toFixed(2)}
                readOnly
                className="bg-blue-50 h-8"
              />
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-xs text-gray-700 text-red-600">Balance</label>
            <Input
              name="balance"
              value={calculateBalance()}
              readOnly
              className="bg-blue-50 h-8"
            />
          </div>
        </div>
        
        {/* Right Column - Payment Methods */}
        <div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-2">
              <label className="block text-xs text-gray-700">Cash Adv:</label>
              <Input
                name="cashAdv"
                value={formData.cashAdv}
                onChange={handleAdvanceChange}
                type="number"
                min="0"
                step="0.01"
                className="bg-gray-50 h-8"
              />
            </div>
            <div className="flex justify-end items-end">
              <Input
                name="cashAdv2"
                value={formData.cashAdv2}
                onChange={handleNumericInputChange}
                type="number"
                min="0"
                step="0.01"
                className="bg-gray-50 h-8"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-2">
              <label className="block text-xs text-gray-700">CC / UPI Adv:</label>
              <Input
                name="ccUpiAdv"
                value={formData.ccUpiAdv}
                onChange={handleAdvanceChange}
                type="number"
                min="0"
                step="0.01"
                className="bg-gray-50 h-8"
              />
            </div>
            <div>
              <Select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                options={paymentMethods}
                className="mt-auto"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-gray-700">Cheque Adv:</label>
              <Input
                name="chequeAdv"
                value={formData.chequeAdv}
                onChange={handleAdvanceChange}
                type="number"
                min="0"
                step="0.01"
                className="bg-gray-50 h-8"
              />
            </div>
            <div>
              <Input
                type="date"
                name="advDate"
                value={formData.advDate}
                onChange={handleChange}
                className="h-8 mt-auto"
              />
            </div>
          </div>
          
          <div className="text-right text-xs text-red-600 font-medium mt-1">
            SCHEME DISCOUNT (IF ANY)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLensPayment;