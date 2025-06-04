import React from 'react';
import Input from '../ui/Input';
import { PrescriptionFormData } from '../types';

interface RemarksAndStatusSectionProps {
  formData: PrescriptionFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const RemarksAndStatusSection: React.FC<RemarksAndStatusSectionProps> = ({
  formData,
  handleChange,
}) => {
  return (
    <div className="mb-6 border p-4 rounded bg-white shadow-sm text-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 text-blue-700">Remarks / Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            value={formData.others}
            onChange={handleChange}
            name="others"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-blue-50"
          />
        </div>
        <div>
          <Input label="Status:" value={formData.status} name="status" onChange={handleChange} />
          {/* TODO: Add Status dropdown or suggestions */}
        </div>
      </div>
    </div>
  );
};

export default RemarksAndStatusSection; 