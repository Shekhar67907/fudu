import React from 'react';
import { ContactLensItem } from './ContactLensTypes';
import Input from '../ui/Input';

interface ContactLensItemTableProps {
  items: ContactLensItem[];
  setItems: (items: ContactLensItem[]) => void;
}

const ContactLensItemTable: React.FC<ContactLensItemTableProps> = ({
  items,
  setItems
}) => {
  // Handle individual discount percentage change
  const handleDiscountPercentChange = (index: number, value: string) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // Parse discount percentage
    const discountPercent = parseFloat(value) || 0;
    
    // Calculate base amount and discount amount
    const baseAmount = item.qty * item.rate;
    const discountAmount = (baseAmount * discountPercent) / 100;
    
    // Format values to 2 decimal places
    const formattedDiscountAmount = parseFloat(discountAmount.toFixed(2));
    const formattedAmount = parseFloat((baseAmount - discountAmount).toFixed(2));
    
    // Update the item with new values - IMPORTANT: update ALL field variants
    // to ensure consistency across the application
    newItems[index] = {
      ...item,
      // Primary fields used by UI
      discountPercent,
      discountAmount: formattedDiscountAmount,
      // Database format variants
      discount_percent: discountPercent,
      discount_amount: formattedDiscountAmount,
      // Alternative format variants
      disc_percent: discountPercent,
      disc_amount: formattedDiscountAmount,
      // Final amount
      amount: formattedAmount
    };
    
    console.log('Updated discount percent:', {
      index,
      discountPercent,
      discountAmount: newItems[index].discountAmount,
      amount: newItems[index].amount,
      allFields: {
        discountPercent: newItems[index].discountPercent,
        discount_percent: newItems[index].discount_percent,
        disc_percent: newItems[index].disc_percent
      }
    });
    
    setItems(newItems);
  };
  
  // Handle individual discount amount change
  const handleDiscountAmountChange = (index: number, value: string) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // Parse discount amount
    const discountAmount = parseFloat(value) || 0;
    
    // Calculate base amount and discount percentage
    const baseAmount = item.qty * item.rate;
    const discountPercent = baseAmount > 0 ? (discountAmount / baseAmount) * 100 : 0;
    
    // Format values to 2 decimal places
    const formattedDiscountPercent = parseFloat(discountPercent.toFixed(2));
    const formattedAmount = parseFloat((baseAmount - discountAmount).toFixed(2));
    
    // Update the item with new values - IMPORTANT: update ALL field variants
    // to ensure consistency across the application
    newItems[index] = {
      ...item,
      // Primary fields used by UI
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      discountPercent: formattedDiscountPercent,
      // Database format variants
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      discount_percent: formattedDiscountPercent,
      // Alternative format variants
      disc_amount: parseFloat(discountAmount.toFixed(2)),
      disc_percent: formattedDiscountPercent,
      // Final amount
      amount: formattedAmount
    };
    
    console.log('Updated discount amount:', {
      index,
      discountAmount: newItems[index].discountAmount,
      discountPercent: newItems[index].discountPercent,
      amount: newItems[index].amount,
      allFields: {
        discountAmount: newItems[index].discountAmount,
        discount_amount: newItems[index].discount_amount,
        disc_amount: newItems[index].disc_amount
      }
    });
    
    setItems(newItems);
  };
  const handleDelete = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    
    // Reassign SI numbers
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      si: idx + 1
    }));
    
    setItems(updatedItems);
  };

  return (
    <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
      <table className="min-w-full bg-white border rounded sticky top-0">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1 text-xs text-gray-700">S.I.</th>
            <th className="border px-2 py-1 text-xs text-gray-700">B/C</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Power</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Material</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Dispose</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Brand</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Qty</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Diameter</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Rate</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Disc %</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Disc Amt</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Amt</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Lens Code</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Side</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Sph</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Cyl</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Ax</th>
            <th className="border px-2 py-1 text-xs text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border px-2 py-1 text-xs">{item.si}</td>
                <td className="border px-2 py-1 text-xs">{item.bc}</td>
                <td className="border px-2 py-1 text-xs">{item.power}</td>
                <td className="border px-2 py-1 text-xs">{item.material}</td>
                <td className="border px-2 py-1 text-xs">{item.dispose}</td>
                <td className="border px-2 py-1 text-xs">{item.brand}</td>
                <td className="border px-2 py-1 text-xs">{item.qty}</td>
                <td className="border px-2 py-1 text-xs">{item.diameter}</td>
                <td className="border px-2 py-1 text-xs">{item.rate ? parseFloat(item.rate.toString()).toFixed(2) : '0.00'}</td>
                <td className="border px-2 py-1 text-xs">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.discountPercent?.toString() || '0'}
                    onChange={(e) => handleDiscountPercentChange(index, e.target.value)}
                    className="w-16 h-7 text-xs text-center"
                    onFocus={() => console.log('Focus on discount percent field:', item.discountPercent)}
                  />
                </td>
                <td className="border px-2 py-1 text-xs">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.discountAmount?.toString() || '0'}
                    onChange={(e) => handleDiscountAmountChange(index, e.target.value)}
                    className="w-16 h-7 text-xs text-center"
                    onFocus={() => console.log('Focus on discount amount field:', item.discountAmount)}
                  />
                </td>
                <td className="border px-2 py-1 text-xs">{item.amount ? parseFloat(item.amount.toString()).toFixed(2) : '0.00'}</td>
                <td className="border px-2 py-1 text-xs">{item.lensCode}</td>
                <td className="border px-2 py-1 text-xs">{item.side}</td>
                <td className="border px-2 py-1 text-xs">{item.sph}</td>
                <td className="border px-2 py-1 text-xs">{item.cyl}</td>
                <td className="border px-2 py-1 text-xs">{item.ax}</td>
                <td className="border px-2 py-1 text-xs">
                  <button 
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={18} className="border px-2 py-4 text-center text-gray-500">
                No contact lens items added yet
              </td>
            </tr>
          )}
        </tbody>
        {items.length > 0 && (
          <tfoot className="bg-gray-100">
            <tr>
              <td colSpan={11} className="border px-2 py-1 text-right font-medium text-xs">Total:</td>
              <td className="border px-2 py-1 text-xs font-bold">
                {items.reduce((total, item) => {
                  // Safely handle amount which might be undefined or non-numeric
                  const itemAmount = item.amount ? parseFloat(item.amount.toString()) : 0;
                  return total + itemAmount;
                }, 0).toFixed(2)}
              </td>
              <td colSpan={6} className="border"></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default ContactLensItemTable;
