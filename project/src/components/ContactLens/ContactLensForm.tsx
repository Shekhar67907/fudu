import React, { useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ContactLensFormData } from './ContactLensTypes';

interface ContactLensFormProps {
  initialData?: Partial<ContactLensFormData>;
  onSubmit: (data: ContactLensFormData) => void;
}

const ContactLensForm: React.FC<ContactLensFormProps> = ({ 
  initialData = {}, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState<Partial<ContactLensFormData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titleOptions = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Ms.", value: "Ms." },
    { label: "Dr.", value: "Dr." }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData as ContactLensFormData);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-start space-x-2">
            <Select 
              label="Title"
              options={titleOptions}
              value={formData.title || ''} 
              onChange={handleChange}
              name="title"
              className="w-24"
              fullWidth={false}
            />
            
            <Input 
              label="Name" 
              value={formData.name || ''} 
              onChange={handleChange}
              name="name"
              required
              error={errors.name}
            />
          </div>
          <div>
            <Input 
              label="Age" 
              type="number"
              value={formData.age || ''} 
              onChange={handleChange}
              name="age"
            />
          </div>
        </div>
        
        {/* Add more form fields here as needed */}
        
        <div className="flex justify-end mt-4 space-x-2">
          <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800">
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
            Submit
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ContactLensForm;
