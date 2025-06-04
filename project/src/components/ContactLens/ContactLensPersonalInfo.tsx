import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import RadioGroup from '../ui/RadioGroup';
import { ContactLensFormData } from './ContactLensTypes';

interface ContactLensPersonalInfoProps {
  formData: ContactLensFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContactLensPersonalInfo: React.FC<ContactLensPersonalInfoProps> = ({
  formData,
  handleChange,
  handleCheckboxChange,
}) => {
  const titleOptions = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Ms.", value: "Ms." },
    { label: "Dr.", value: "Dr." }
  ];

  const prescribedByOptions = [
    { label: "Select Doctor", value: "" },
    { label: "Optometrist", value: "Optometrist" },
    { label: "Dr. Smith", value: "Dr. Smith" },
    { label: "Dr. Johnson", value: "Dr. Johnson" },
    { label: "Dr. Williams", value: "Dr. Williams" }
  ];

  return (
    <div className="border p-3 rounded bg-blue-50">
      <h3 className="font-medium mb-3">Personal Information (Customer's Personal Information Can Only Be Edited Through Customer Master Form)</h3>
      
      {/* Name Section */}
      <div className="grid grid-cols-12 gap-2 mb-2">
        <div className="col-span-2">
          <Select
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            options={titleOptions}
            className="h-10"
          />
        </div>
        <div className="col-span-7">
          <Input
            label="Name*"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-span-3 flex items-end">
          <Input
            label="Age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            type="number"
          />
        </div>
      </div>
      
      {/* Gender Section */}
      <div className="grid grid-cols-12 gap-2 mb-2">
        <div className="col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="male"
                name="gender"
                value="Male"
                checked={formData.gender === 'Male'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="male" className="ml-2 text-sm text-gray-700">Male</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="female"
                name="gender"
                value="Female"
                checked={formData.gender === 'Female'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="female" className="ml-2 text-sm text-gray-700">Female</label>
            </div>
          </div>
        </div>
        <div className="col-span-7 flex items-end">
          <Input
            label="Customer Code"
            name="customerCode"
            value={formData.customerCode}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      
      {/* Birth Date & Marriage Anniversary */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <Input
            type="date"
            label="Birth Day"
            name="birthDay"
            value={formData.birthDay}
            onChange={handleChange}
          />
        </div>
        <div>
          <div className="flex items-end">
            <Input
              type="date"
              label="Marg Anniv"
              name="marriageAnniversary"
              value={formData.marriageAnniversary}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
      
      {/* Address */}
      <div className="mb-2">
        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="bg-blue-100"
        />
      </div>
      
      {/* City & State */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="col-span-2">
          <Input
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="bg-blue-100"
          />
        </div>
        <div>
          <Input
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="bg-blue-100"
          />
        </div>
      </div>
      
      {/* Pin & Phone */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <Input
            label="Pin"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            className="bg-blue-100"
          />
        </div>
        <div className="col-span-2">
          <Input
            label="Phone (L.L)"
            name="phoneLandline"
            value={formData.phoneLandline}
            onChange={handleChange}
            className="bg-blue-100"
          />
        </div>
      </div>
      
      {/* Mobile * & Email */}
      <div className="grid grid-cols-2 gap-2 mb-2">
         <div>
           <Input
            label="Mobile *"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            required
            className="bg-teal-100"
          />
         </div>
         <div>
           <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-blue-100"
          />
         </div>
      </div>
      
      {/* IPD Field */}
      <div className="mb-2">
        <Input
          label="IPD:"
          name="ipd"
          value={formData.ipd}
          readOnly // IPD is calculated, not manually entered
          className="text-center bg-blue-100"
        />
      </div>
      
      {/* Prescribed By & Billing Info */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-6">
          <Select
            label="Presc. By"
            name="prescBy"
            value={formData.prescBy}
            onChange={handleChange}
            options={prescribedByOptions}
          />
        </div>
        <div className="col-span-6 flex items-end">
          <div className="flex items-center h-10 space-x-2">
            <div>
              <Checkbox
                id="billed"
                name="billed"
                checked={formData.billed}
                label="Billed"
                onChange={handleCheckboxChange}
              />
              <label htmlFor="billed" className="text-sm ml-1 text-red-600 font-medium">BILLED</label>
            </div>
            <div className="flex-grow">
              <Input
                name="billNumber"
                value={formData.billNumber}
                onChange={handleChange}
                placeholder="BILL NUMBER"
                className="text-blue-600 bg-blue-100 h-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLensPersonalInfo;
