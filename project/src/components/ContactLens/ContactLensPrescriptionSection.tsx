import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import { ContactLensFormData } from './ContactLensTypes';
import { 
  calculateNearVisionSph,
  validateVnValue,
  formatVnValue,
  validatePrescriptionData,
  calculateSphericalEquivalent,
  formatPrescriptionNumber
} from '../../utils/prescriptionUtils';

interface ContactLensPrescriptionSectionProps {
  formData: ContactLensFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ContactLensPrescriptionSection: React.FC<ContactLensPrescriptionSectionProps> = ({
  formData,
  handleChange,
  handleNumericInputChange,
  handleCheckboxChange,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate Near Vision values based on D.V values
  const calculateNearVision = (eye: 'rightEye' | 'leftEye', e: React.FocusEvent<HTMLInputElement>) => {
    const dvData = formData[eye].dv;

    // Only calculate if Add field is being blurred
    if (e.target.name === `${eye}.dv.add` && dvData.add) {
      const nearVisionSph = calculateNearVisionSph(dvData.sph, dvData.add);
      
      const syntheticEvent = {
        target: {
          name: `${eye}.nv.sph`,
          value: nearVisionSph
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (syntheticEvent.target && syntheticEvent.target.name) {
        handleChange(syntheticEvent);
      }
      
      // Copy cyl and ax from DV to NV
      if (dvData.cyl) {
        const cylEvent = {
          target: {
            name: `${eye}.nv.cyl`,
            value: dvData.cyl
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        if (cylEvent.target && cylEvent.target.name) {
          handleChange(cylEvent);
        }
      }
      
      if (dvData.ax) {
        const axEvent = {
          target: {
            name: `${eye}.nv.ax`,
            value: dvData.ax
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        if (axEvent.target && axEvent.target.name) {
          handleChange(axEvent);
        }
      }
      
      // Set NV visual acuity to 'N'
      const vnEvent = {
        target: {
          name: `${eye}.nv.vn`,
          value: 'N'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (vnEvent.target && vnEvent.target.name) {
        handleChange(vnEvent);
      }
    }
  };

  // Handle Vn field changes and formatting
  const handleVnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    
    if (!name) {
      console.error('[handleVnChange] Missing name on event target:', e.target, e);
      console.trace();
      return;
    }

    const eye = name.split('.')[0];
    const isNearVision = name.includes('.nv.vn');

    // Handle N.V row
    if (isNearVision) {
      const validatedValue = validateVnValue(value, true);
      if (validatedValue !== null) {
        handleChange({
          target: {
            name: name,
            value: validatedValue
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }
      return;
    }

    // Handle D.V row
    if (name.includes('.dv.vn')) {
      // Always format the value to ensure proper structure
      const formattedValue = formatVnValue(value, false);
      
      // Allow editing by accepting any valid format
      if (formattedValue.startsWith('6/')) {
        handleChange({
          target: {
            name: name,
            value: formattedValue
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  // Effect to initialize Vn fields with default values
  useEffect(() => {
    // Initialize D.V Vn fields with "6/" if empty
    if (!formData.rightEye.dv.vn) {
      const rightEyeEvent = {
        target: {
          name: 'rightEye.dv.vn',
          value: '6/'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (rightEyeEvent.target && rightEyeEvent.target.name) {
        handleChange(rightEyeEvent);
      }
    }
    
    if (!formData.leftEye.dv.vn) {
      const leftEyeEvent = {
        target: {
          name: 'leftEye.dv.vn',
          value: '6/'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (leftEyeEvent.target && leftEyeEvent.target.name) {
        handleChange(leftEyeEvent);
      }
    }
    
    // Initialize N.V Vn fields with "N" if empty
    if (!formData.rightEye.nv.vn) {
      const rightNvEvent = {
        target: {
          name: 'rightEye.nv.vn',
          value: 'N'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (rightNvEvent.target && rightNvEvent.target.name) {
        handleChange(rightNvEvent);
      }
    }
    
    if (!formData.leftEye.nv.vn) {
      const leftNvEvent = {
        target: {
          name: 'leftEye.nv.vn',
          value: 'N'
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (leftNvEvent.target && leftNvEvent.target.name) {
        handleChange(leftNvEvent);
      }
    }
  }, []);

  // Effect to handle balance lens behavior
  useEffect(() => {
    if (formData.balanceLens) {
      // Copy right eye values to left eye
      const newLeftEyeDv = { ...formData.rightEye.dv, lpd: formData.leftEye.dv.lpd }; // Keep original LPD
      const newLeftEyeNv = { ...formData.rightEye.nv };

      // Update DV fields individually
      (['sph', 'cyl', 'ax', 'add', 'vn'] as const).forEach(field => {
        handleChange({
          target: {
            name: `leftEye.dv.${field}`,
            value: newLeftEyeDv[field]?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });
      
      // Update LPD field separately
       handleChange({
          target: {
            name: `leftEye.dv.lpd`,
            value: newLeftEyeDv.lpd?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);

      // Update NV fields individually
      (['sph', 'cyl', 'ax', 'add', 'vn'] as const).forEach(field => {
        handleChange({
          target: {
            name: `leftEye.nv.${field}`,
            value: newLeftEyeNv[field]?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });
    }
  }, [formData.balanceLens, formData.rightEye, formData.leftEye.dv.lpd]); // Add formData.rightEye to dependencies to update when right eye changes

  return (
    <div className="mt-4 overflow-x-auto pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[700px]">
        {/* Right Eye Section */}
        <div className="border border-gray-200 rounded">
          <div className="bg-gray-50 py-2 px-3 text-center border-b border-gray-200">
            <h3 className="font-medium text-gray-700">Right</h3>
          </div>
          
          <div className="p-2">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-gray-600">
              <div></div>
              <div>Sph</div>
              <div>Cyl</div>
              <div>Ax</div>
              <div>Add</div>
              <div>Vn</div>
              <div>RPD</div>
              <div>SE</div>
            </div>
            
            {/* D.V. Row */}
            <div className="grid grid-cols-7 gap-2 mb-2 items-center">
              <div className="text-xs font-medium text-gray-700">D.V</div>
              <Input
                name="rightEye.dv.sph"
                value={formData.rightEye.dv.sph}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.dv.cyl"
                value={formData.rightEye.dv.cyl}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.dv.ax"
                value={formData.rightEye.dv.ax}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.dv.add"
                value={formData.rightEye.dv.add}
                onChange={handleNumericInputChange}
                onBlur={(e) => calculateNearVision('rightEye', e)}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.dv.vn"
                value={formData.rightEye.dv.vn}
                onChange={handleVnChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                title="Enter distance vision (e.g., 6/6, 6/9, 6/12, 6/18, 6/24, 6/36, 6/60)"
placeholder="6/"
              />
              <Input
                name="rightEye.dv.rpd"
                value={formData.rightEye.dv.rpd || ''}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <div className="text-xs text-center text-gray-500">-</div>
            </div>
            
            {/* N.V. Row */}
            <div className="grid grid-cols-7 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">N.V</div>
              <Input
                name="rightEye.nv.sph"
                value={formData.rightEye.nv.sph}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.nv.cyl"
                value={formData.rightEye.nv.cyl}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.nv.ax"
                value={formData.rightEye.nv.ax}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
              />
              <Input
                name="rightEye.nv.add"
                value={formData.rightEye.nv.add}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="rightEye.nv.vn"
                value={formData.rightEye.nv.vn}
                onChange={handleVnChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                title="Enter near vision (e.g., N5, N6, N8, N10, N12, N18, N24)"
placeholder="N"
              />
              <div></div>
              <div className="text-xs text-center text-gray-500">-</div>
            </div>
          </div>
        </div>
        
        {/* Left Eye Section */}
        <div className="border border-gray-200 rounded">
          <div className="bg-gray-50 py-2 px-3 text-center border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-700">Left</h3>
            <div className="flex items-center">
              <Checkbox
                id="balanceLens"
                name="balanceLens"
                checked={formData.balanceLens}
                onChange={handleCheckboxChange}
                label="BALANCE LENS"
              />
            </div>
          </div>
          
          <div className="p-2">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-gray-600">
              <div></div>
              <div>Sph</div>
              <div>Cyl</div>
              <div>Ax</div>
              <div>Add</div>
              <div>Vn</div>
              <div>LPD</div>
              <div>SE</div>
            </div>
            
            {/* D.V. Row */}
            <div className="grid grid-cols-7 gap-2 mb-2 items-center">
              <div className="text-xs font-medium text-gray-700">D.V</div>
              <Input
                name="leftEye.dv.sph"
                value={formData.leftEye.dv.sph}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.dv.cyl"
                value={formData.leftEye.dv.cyl}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.dv.ax"
                value={formData.leftEye.dv.ax}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.dv.add"
                value={formData.leftEye.dv.add}
                onChange={handleNumericInputChange}
                onBlur={(e) => calculateNearVision('leftEye', e)}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.dv.vn"
                value={formData.leftEye.dv.vn}
                onChange={handleVnChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
                title="Enter distance vision (e.g., 6/6, 6/9, 6/12, 6/18, 6/24, 6/36, 6/60)"
placeholder="6/"
              />
              <Input
                name="leftEye.dv.lpd"
                value={formData.leftEye.dv.lpd || ''}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <div className="text-xs text-center text-gray-500">-</div>
            </div>
            
            {/* N.V. Row */}
            <div className="grid grid-cols-7 gap-2 items-center">
              <div className="text-xs font-medium text-gray-700">N.V</div>
              <Input
                name="leftEye.nv.sph"
                value={formData.leftEye.nv.sph}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.nv.cyl"
                value={formData.leftEye.nv.cyl}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.nv.ax"
                value={formData.leftEye.nv.ax}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.nv.add"
                value={formData.leftEye.nv.add}
                onChange={handleNumericInputChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
              />
              <Input
                name="leftEye.nv.vn"
                value={formData.leftEye.nv.vn}
                onChange={handleVnChange}
                className="h-8 text-sm text-center text-gray-900 min-w-[60px] w-full"
                disabled={formData.balanceLens}
                title="Enter near vision (e.g., N5, N6, N8, N10, N12, N18, N24)"
placeholder="N"
              />
              <div></div>
              <div className="text-xs text-center text-gray-500">-</div>
            </div>
          </div>
        </div>
      </div>

      {/* K-Reading Button */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => {
            console.log('K-Reading button pressed');
            alert('K-Reading functionality will be implemented here');
          }}
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm py-1 px-2 rounded"
        >
          Press For K- Reading
        </button>
      </div>
    </div>
  );
};

export default ContactLensPrescriptionSection;
