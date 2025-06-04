import React from 'react';
import Button from '../ui/Button';
// TODO: Import ManualEntryModal component

interface Item {
  itemCode: string;
  itemName: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
}

interface SpectaclesSectionProps {
  items: Item[]; // TODO: Define specific item interface
  onAddItem: () => void; // Function to open manual entry modal
  // TODO: Add prop for handle delete item
}

const SpectaclesSection: React.FC<SpectaclesSectionProps> = ({
  items,
  onAddItem,
}) => {
  return (
    <div className="mb-6 border p-4 rounded bg-white shadow-sm text-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 text-blue-700">Spectacles (Selected Items)</h3>

      {/* Items Table */}
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-blue-50">
              <th className="border border-gray-300 px-2 py-1 text-sm text-left">Item Code</th>
              <th className="border border-gray-300 px-2 py-1 text-sm text-left">Item Name</th>
              <th className="border border-gray-300 px-2 py-1 text-sm text-left">Unit</th>
              <th className="border border-gray-300 px-2 py-1 text-sm text-right">Qty</th>
              <th className="border border-gray-300 px-2 py-1 text-sm text-right">Rate</th>
              <th className="border border-gray-300 px-2 py-1 text-sm text-right">Amount</th>
              <th className="border border-gray-300 px-2 py-1 text-sm"></th>{/* Action column */}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-2 py-2 text-center text-sm text-gray-500">
                  No items added yet.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-2 py-1 text-sm">{item.itemCode}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm">{item.itemName}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm">{item.unit}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-right">{item.qty}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-right">{item.rate.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-right">{item.amount.toFixed(2)}</td>
                  <td className="border border-gray-300 px-2 py-1 text-sm text-center">
                    {/* TODO: Add Delete Button */}
                    <Button variant="danger" size="sm">Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Entry Button */}
      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={onAddItem}>
          Manual Entry
        </Button>
      </div>

      {/* TODO: Manual Entry Modal Component */}
    </div>
  );
};

export default SpectaclesSection; 