import React from 'react';
import Input from '../ui/Input';
import { PrescriptionFormData } from '../types';

interface PaymentSectionProps {
  formData: PrescriptionFormData;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  formData,
  handleNumericInputChange,
}) => {
  // Calculate total amounts from items
  const totalBaseAmount = formData.selectedItems.reduce((sum, item) => {
    const rate = parseFloat(item.rate?.toString() || '0');
    const qty = parseFloat(item.qty?.toString() || '1');
    return sum + (rate * qty);
  }, 0);

  // Calculate total tax amount
  const totalTaxAmount = parseFloat(formData.taxAmount || '0');
  
  // Calculate total discount amount
  const totalDiscountAmount = parseFloat(formData.schAmt || '0');
  
  // Extract values from form data
  const cashAdv1 = parseFloat(formData.cashAdv1 || '0') || 0;
  const ccUpiAdv = parseFloat(formData.ccUpiAdv || '0') || 0;
  const advanceOther = parseFloat(formData.advanceOther || '0') || 0;
  
  // Calculate values for new users or as fallbacks
  const totalAdvance = cashAdv1 + ccUpiAdv + advanceOther;
  const finalAmount = totalBaseAmount + totalTaxAmount - totalDiscountAmount;
  const calculatedBalance = Math.max(0, finalAmount - totalAdvance).toFixed(2);
  const calculatedTotalAdvance = totalAdvance.toFixed(2);
  
  // For existing users (being repopulated from database): ALWAYS use the database values directly
  // For new users: Use the calculated values
  // First check for the explicit isFromDatabase flag
  // This is the most reliable way to detect records from database
  const isExistingDatabaseRecord = 
    // First priority: explicit flag set during data loading
    formData.isFromDatabase === true || 
    // Second priority: has prescription number and reference number
    ((formData.prescriptionNo && formData.prescriptionNo !== '') && 
     (formData.referenceNo && formData.referenceNo !== '')) || 
    // Third priority: has database-populated payment values
    (formData.advance && formData.advance !== '0' && formData.advance !== '0.00');
  
  // RULE: For existing database records, NEVER recalculate - always use stored database values
  // For new users, always use calculated values to allow real-time updates
  
  // Since UI should always reflect the actual input fields, for new users we need to calculate
  // totalAdvance and balance from the raw input fields to avoid double-counting issues
  const displayTotalAdvance = isExistingDatabaseRecord ? formData.advance : calculatedTotalAdvance;
  const displayBalance = isExistingDatabaseRecord ? formData.balance : calculatedBalance;
  
  // Enhanced debugging to show clear decision paths
  console.log('PaymentSection - DEBUG INFO:', {
    // Source of data
    sourceType: isExistingDatabaseRecord ? 'DATABASE VALUES' : 'CALCULATED VALUES',
    
    // Raw form data
    formData: {
      advance: formData.advance,
      balance: formData.balance,
      advanceInputs: {
        cashAdv1: formData.cashAdv1,
        ccUpiAdv: formData.ccUpiAdv,
        advanceOther: formData.advanceOther
      }
    },
    
    // Calculated values (what would be shown if not using database)
    calculatedValues: {
      totalAdvance: calculatedTotalAdvance,
      balance: calculatedBalance,
      rawInputs: {
        totalAdvance,
        finalAmount
      }
    },
    
    // What's actually being displayed
    displayed: {
      totalAdvance: displayTotalAdvance,
      balance: displayBalance
    }
  });

  return (
    <div className="mb-6 border p-4 rounded bg-white shadow-sm text-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 text-blue-700">Payment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded border">
          <div className="text-sm font-medium text-gray-500">Payment Estimate</div>
          <div className="text-lg font-semibold">₹{formData.paymentEstimate || '0.00'}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border">
          <div className="text-sm font-medium text-gray-500">Tax Added</div>
          <div className="text-lg">₹{formData.taxAmount || '0.00'}</div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded border border-blue-100">
          <div className="text-sm font-medium text-blue-600">Total Advance</div>
          <div className="text-lg font-semibold text-blue-700">
            {/* Show calculated total advance */}
            ₹{displayTotalAdvance}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded border border-green-100">
          <div className="text-sm font-medium text-green-600">Balance</div>
          <div className="text-lg font-semibold text-green-700">
            {/* Show calculated balance */}
            ₹{displayBalance}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
        <Input
          label="Advance Cash"
          value={formData.cashAdv1 === '0.00' ? '' : formData.cashAdv1}
          name="cashAdv1"
          onChange={handleNumericInputChange}
          type="number"
          min="0"
          step="0.01"
          placeholder=""
          className="bg-white"
        />
        
        <Input
          label="Advance Card/UPI"
          value={formData.ccUpiAdv === '0.00' ? '' : formData.ccUpiAdv}
          name="ccUpiAdv"
          onChange={handleNumericInputChange}
          type="number"
          min="0"
          step="0.01"
          placeholder=""
          className="bg-white"
        />
        
        <Input
          label="Advance Other"
          value={formData.advanceOther === '0.00' ? '' : formData.advanceOther}
          name="advanceOther"
          onChange={e => {
            console.log('Advance Other changed:', e.target.value);
            handleNumericInputChange(e);
          }}
          type="number"
          min="0"
          step="0.01"
          placeholder=""
          className="bg-white"
        />
        
        <Input
          label="Sch. Amt"
          value={formData.schAmt}
          name="schAmt"
          onChange={handleNumericInputChange}
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="bg-white"
        />
      </div>
    </div>
  );
};

export default PaymentSection; 