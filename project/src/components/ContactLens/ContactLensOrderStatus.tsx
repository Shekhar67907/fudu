import React from 'react';
import Input from '../ui/Input';
import RadioGroup from '../ui/RadioGroup';
import { ContactLensFormData } from './ContactLensTypes';

interface ContactLensOrderStatusProps {
  formData: ContactLensFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const ContactLensOrderStatus: React.FC<ContactLensOrderStatusProps> = ({
  formData,
  handleChange,
}) => {
  const orderStatusOptions = [
    { label: 'Processing', value: 'Processing' },
    { label: 'Ready', value: 'Ready' },
    { label: 'Hand Over', value: 'Hand Over' },
  ];

  return (
    <div className="border rounded p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks:</label>
        <textarea
          name="remarks"
          value={formData.remarks}
          onChange={handleChange}
          className="w-full h-24 border border-gray-300 rounded p-2 text-sm"
          placeholder="Enter remarks here..."
        />
      </div>
      
      <div className="flex flex-wrap">
        <div className="w-full md:w-1/2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status:</label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="processing"
                  name="orderStatus"
                  value="Processing"
                  checked={formData.orderStatus === 'Processing'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="processing" className="ml-1 text-sm text-gray-700">Processing</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="ready"
                  name="orderStatus"
                  value="Ready"
                  checked={formData.orderStatus === 'Ready'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="ready" className="ml-1 text-sm text-gray-700">Ready</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="handOver"
                  name="orderStatus"
                  value="Hand Over"
                  checked={formData.orderStatus === 'Hand Over'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
                />
                <label htmlFor="handOver" className="ml-1 text-sm text-gray-700">Hand Over</label>
              </div>
            </div>
          </div>
          <Input
            type="date"
            className="mt-2 w-32 inline-block"
            name="orderStatusDate"
            value={formData.orderStatusDate}
            onChange={handleChange}
          />
        </div>
        
        <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retest After</label>
            <Input
              type="date"
              name="retestAfter"
              value={formData.retestAfter}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <div className="flex items-center">
              <Input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLensOrderStatus;
