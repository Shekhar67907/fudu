import React, { useState } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';

// Define the ContactLensItem type locally since we're not importing it
interface ContactLensItem {
  si: number;
  amount: number;
  bc: string;
  power: string;
  material: string;
  dispose: string;
  brand: string;
  qty: number;
  diameter: string;
  rate: number;
  lensCode: string;
  side: 'Left' | 'Right' | 'Both';
  sph: string;
  cyl: string;
  ax: string;
  discountPercent: number;
  discountAmount: number;
  [key: string]: any; // For any additional properties
}

interface ContactLensManualFormProps {
  onAdd: (item: ContactLensItem) => void;
  onClose: () => void;
}

const ContactLensManualForm: React.FC<ContactLensManualFormProps> = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState<Omit<ContactLensItem, 'si' | 'amount'>>({
    bc: '',
    power: '',
    material: '',
    dispose: '',
    brand: '',
    qty: 1,
    diameter: '',
    rate: 0,
    lensCode: '',
    side: 'Both',
    sph: '',
    cyl: '',
    ax: '',
    discountPercent: 0,
    discountAmount: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/[^0-9.-]/g, '');
    
    if (name === 'qty' || name === 'rate' || name === 'discountPercent' || name === 'discountAmount') {
      // Ensure numeric values are parsed as numbers
      const parsedValue = numericValue === '' ? 0 : parseFloat(numericValue);
      setFormData(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure side is properly capitalized (Left, Right, or Both)
    const formattedSide = formData.side 
      ? formData.side.charAt(0).toUpperCase() + formData.side.slice(1).toLowerCase()
      : 'Both';
    
    // Ensure formattedSide is one of the allowed values
    const validSides = ['Left', 'Right', 'Both'] as const;
    const side = validSides.includes(formattedSide as any) ? formattedSide as 'Left' | 'Right' | 'Both' : 'Both';
    
    // Calculate amount based on quantity and rate
    const baseAmount = formData.qty * formData.rate;
    const discountAmount = (baseAmount * formData.discountPercent) / 100;
    const finalAmount = baseAmount - discountAmount;
    
    // Create the item with all fields
    const newItem: ContactLensItem = {
      // Spread all form data first
      ...formData,
      // Ensure required fields have proper values
      si: 0, // This will be set by the parent component
      amount: finalAmount,
      side, // Use the properly formatted side
      discountAmount: discountAmount,
      // Ensure all required fields are included with proper types
      bc: formData.bc || '',
      power: formData.power || '',
      material: formData.material || '',
      dispose: formData.dispose || '',
      brand: formData.brand || '',
      qty: formData.qty || 0,
      diameter: formData.diameter || '',
      rate: formData.rate || 0,
      lensCode: formData.lensCode || '',
      sph: formData.sph || '',
      cyl: formData.cyl || '',
      ax: formData.ax || '',
      discountPercent: formData.discountPercent || 0
    };
    
    onAdd(newItem);
    onClose();
  };

  // Define side options with proper typing
  const sideOptions: { label: string; value: 'Left' | 'Right' | 'Both' }[] = [
    { label: 'Both', value: 'Both' },
    { label: 'Right', value: 'Right' },
    { label: 'Left', value: 'Left' }
  ];

  return (
    <div className="bg-yellow-50 border rounded-lg shadow-lg p-4 w-3/4 max-w-3xl">
      <h3 className="text-xl font-bold mb-4 text-center">Add Contact Lens Manually</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <Input 
              label="B/C"
              name="bc"
              value={formData.bc}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Power"
              name="power"
              value={formData.power}
              onChange={handleNumericChange}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Material"
              name="material"
              value={formData.material}
              onChange={handleChange}
              placeholder="Enter material"
              required
            />
          </div>
          
          <div>
            <Input 
              label="Dispose"
              name="dispose"
              value={formData.dispose}
              onChange={handleChange}
              placeholder="Enter dispose type"
              required
            />
          </div>
          
          <div>
            <Input 
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Enter brand"
              required
            />
          </div>
          
          <div>
            <Input 
              label="Qty"
              name="qty"
              type="number"
              min="1"
              value={formData.qty.toString()}
              onChange={handleNumericChange}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Diameter"
              name="diameter"
              value={formData.diameter}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Rate"
              name="rate"
              type="number"
              min="0"
              step="0.01"
              value={formData.rate.toString()}
              onChange={handleNumericChange}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Discount %"
              name="discountPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discountPercent?.toString() || '0'}
              onChange={handleNumericChange}
              className="text-right"
            />
          </div>
          
          <div>
            <Input 
              label="Amount"
              value={(formData.qty * formData.rate * (1 - (formData.discountPercent || 0) / 100)).toFixed(2)}
              readOnly
              disabled
            />
          </div>
          
          <div>
            <Input 
              label="Lens Code"
              name="lensCode"
              value={formData.lensCode}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Select 
              label="Side"
              name="side"
              value={formData.side}
              onChange={handleChange as any}
              options={sideOptions}
              required
            />
          </div>
          
          <div>
            <Input 
              label="Sph"
              name="sph"
              value={formData.sph}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Input 
              label="Cyl"
              name="cyl"
              value={formData.cyl}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Input 
              label="Ax"
              name="ax"
              value={formData.ax}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="flex justify-center mt-4 space-x-4">
          <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white">
            Add Contact Lenses
          </Button>
          <Button 
            type="button" 
            onClick={onClose} 
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Close
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactLensManualForm;