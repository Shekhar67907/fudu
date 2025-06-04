import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import { titleOptions, classOptions, prescribedByOptions } from '../../utils/helpers';
import { PrescriptionFormData } from '../types';

interface CustomerInfoSectionProps {
  formData: PrescriptionFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNumericInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // TODO: Add error handling props if needed
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  formData,
  handleChange,
  handleCheckboxChange,
  handleNumericInputChange,
}) => {
  return (
    <div className="md:col-span-2 border p-4 rounded bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2 text-blue-700">
        Customer Information <span className="font-normal text-gray-500">(Can Only Be Edited Through Customer Master Form)</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-gray-700">
        <div className="flex items-center space-x-2 col-span-full sm:col-span-1">
          <Select
            label="Title"
            options={titleOptions}
            value={formData.namePrefix}
            name="namePrefix"
            onChange={handleChange}
            className="w-20 text-xs"
            fullWidth={false}
          />
          <Input label="Name" value={formData.name} name="name" onChange={handleChange} />
        </div>
        <div>
          <RadioGroup
            label="Gender"
            name="gender"
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
            value={formData.gender}
            onChange={handleChange}
          />
        </div>
        <Input label="Age:" value={formData.age} name="age" onChange={handleChange} type="number" />
        <Input label="Customer Code:" value={formData.customerCode} name="customerCode" onChange={handleChange} />
        <Input label="Birth Day:" value={formData.birthDay} name="birthDay" onChange={handleChange} type="date" />
        <Input
          label="Marr Anniv:"
          value={formData.marriageAnniversary}
          name="marriageAnniversary"
          onChange={handleChange}
          type="date"
        />
        <Input 
          label="IPD:" 
          value={formData.ipd} 
          name="ipd"
          onChange={handleNumericInputChange}
          className="text-center"
          readOnly
        />

        <div className="col-span-full">
          <Input label="Address:" value={formData.address} name="address" onChange={handleChange} />
        </div>
        <Input label="City:" value={formData.city} name="city" onChange={handleChange} />
        <Input label="State:" value={formData.state} name="state" onChange={handleChange} />
        <Input label="Pin Code:" value={formData.pinCode} name="pinCode" onChange={handleChange} />
        <Input
          label="Phone (L.L.):"
          value={formData.phoneLandline}
          name="phoneLandline"
          onChange={handleChange}
        />
        <Input
          label="Mobile No.:"
          value={formData.mobileNo}
          name="mobileNo"
          onChange={handleChange}
          required
        />
        <Input label="Email:" value={formData.email} name="email" onChange={handleChange} type="email" />

        <div className="col-span-full sm:col-span-2 flex items-end pb-2 justify-between">
          <div className="w-1/2">
            <Select
              label="Prescribed By:"
              options={prescribedByOptions}
              value={formData.prescribedBy}
              name="prescribedBy"
              onChange={handleChange}
              required
            />
          </div>
          <div className="w-1/2 flex justify-end">
            <Checkbox label="BILLED" checked={formData.billed} onChange={handleCheckboxChange} name="billed" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfoSection; 