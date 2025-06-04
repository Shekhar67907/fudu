import React, { useEffect, useState } from 'react';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import { EyeData, VisualAcuity } from '../types';
import { 
  calculateNearVisionSph, 
  validateAndFormatVn,
  checkHighPrescription,
  validateVnValue,
  formatVnValue,
  calculateSphericalEquivalent,
  validatePrescriptionData
} from '../../utils/prescriptionUtils';

interface PrescriptionSectionProps {
  formData: { 
    rightEye: EyeData;
    leftEye: EyeData;
    balanceLens: boolean;
    age: number;
    ipd?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleNumericInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  formData,
  handleChange,
  handleNumericInputChange,
  handleCheckboxChange,
}) => {
  const [warnings, setWarnings] = useState<{
    rightEye: string[],
    leftEye: string[]
  }>({
    rightEye: [],
    leftEye: []
  });

  const [vaStatus, setVaStatus] = useState<{
    rightEye: VisualAcuity | null,
    leftEye: VisualAcuity | null
  }>({
    rightEye: null,
    leftEye: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate Near Vision values based on D.V values
  const calculateNearVision = (eye: 'rightEye' | 'leftEye', e: React.FocusEvent<HTMLInputElement>) => {
    const dvData = formData[eye].dv;
    const nvData = formData[eye].nv;

    // Only calculate if Add field is being blurred
    if (e.target.name === `${eye}.dv.add` && dvData.add) {
      const newFormData = { ...formData };
      
      // Case 1: All fields are filled
      if (dvData.sph && dvData.cyl && dvData.ax && dvData.add) {
        newFormData[eye].nv = {
          ...nvData,
          sph: calculateNearVisionSph(dvData.sph, dvData.add),
          cyl: dvData.cyl,
          ax: dvData.ax,
          vn: 'N',
          add: ''
        };
      }
      // Case 2: Cyl is zero or empty
      else if (!dvData.cyl || dvData.cyl === '0' || dvData.cyl === '0.00') {
        newFormData[eye].nv = {
          ...nvData,
          sph: calculateNearVisionSph(dvData.sph, dvData.add),
          cyl: '',
          ax: '',
          vn: 'N',
          add: ''
        };
      }
      // Case 3: Ax is missing (even if Cyl is present)
      else if (!dvData.ax) {
        newFormData[eye].nv = {
          ...nvData,
          sph: calculateNearVisionSph(dvData.sph, dvData.add),
          cyl: dvData.cyl,
          ax: '',
          vn: 'N',
          add: ''
        };
      }

      // Update each field individually
      Object.entries(newFormData[eye].nv).forEach(([key, value]) => {
        handleChange({
          target: {
            name: `${eye}.nv.${key}`,
            value: value?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });
    }
  };

  // Effect to handle prescription logic - using a ref to prevent infinite loops
  const prevRpdRef = React.useRef(formData.rightEye.dv.rpd);
  const prevLpdRef = React.useRef(formData.leftEye.dv.lpd);
  
  useEffect(() => {
    // Only run if RPD or LPD has actually changed
    const rpdChanged = prevRpdRef.current !== formData.rightEye.dv.rpd;
    const lpdChanged = prevLpdRef.current !== formData.leftEye.dv.lpd;
    
    // Update refs
    prevRpdRef.current = formData.rightEye.dv.rpd;
    prevLpdRef.current = formData.leftEye.dv.lpd;
    
    // Skip calculation if nothing changed to prevent infinite loops
    if (!rpdChanged && !lpdChanged) return;
    
    // Calculate IPD from RPD and LPD
    if (formData.rightEye.dv.rpd && formData.leftEye.dv.lpd) {
      const rpdValue = parseFloat(formData.rightEye.dv.rpd);
      const lpdValue = parseFloat(formData.leftEye.dv.lpd);
      if (!isNaN(rpdValue) && !isNaN(lpdValue)) {
        const calculatedIPD = (rpdValue + lpdValue).toFixed(1);
        // Avoid unnecessary updates
        if (formData.ipd !== calculatedIPD) {
          // Use setTimeout to break the render cycle
          setTimeout(() => {
            handleChange({
              target: {
                name: 'ipd',
                value: calculatedIPD
              }
            } as React.ChangeEvent<HTMLInputElement>);
          }, 0);
        }
      }
    }
  }, [formData.rightEye.dv.rpd, formData.leftEye.dv.lpd, formData.ipd, handleChange]);

  // Effect to initialize Vn fields - only runs on component mount
  useEffect(() => {
    // Create a temporary object to store all changes
    const updates: Record<string, string> = {};
    
    // Check all fields and build updates object
    (['rightEye', 'leftEye'] as const).forEach(eyeKey => {
      if (!formData[eyeKey].dv.vn) {
        updates[`${eyeKey}.dv.vn`] = '6/';
      }
      if (!formData[eyeKey].nv.vn) {
        updates[`${eyeKey}.nv.vn`] = 'N';
      }
    });
    
    // Only apply changes if there are any updates to make
    if (Object.keys(updates).length > 0) {
      // Apply all changes at once
      const updatedFormData = {...formData};
      
      // Update the formData with all changes
      Object.entries(updates).forEach(([path, value]) => {
        const parts = path.split('.');
        const eyeKey = parts[0] as 'rightEye' | 'leftEye';
        const visionType = parts[1] as 'dv' | 'nv';
        const field = parts[2];
        
        // Type-safe assignment
        if (eyeKey && visionType && field) {
          // Add type safety for field access
          if (field === 'sph' || field === 'cyl' || field === 'ax' || 
              field === 'add' || field === 'vn' || field === 'rpd' || 
              field === 'lpd' || field === 'sphericalEquivalent') {
            updatedFormData[eyeKey][visionType][field] = value;
          }
        }
      });
      
      // Send the updated form data in a single update event
      // Create a custom event structure instead of trying to cast to React.ChangeEvent
      const customEvent = {
        target: {
          name: 'formData',
          value: updatedFormData
        }
      };
      
      // Use setTimeout to break the render cycle
      setTimeout(() => {
        // Use type assertion to unknown first, then to the expected event type
        handleChange(customEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      }, 0);
    }
  }, []);

  // Check for high prescription values when SPH or CYL changes
  // Using refs to track previous values and prevent infinite loops
  const prevRightSphRef = React.useRef(formData.rightEye.dv.sph);
  const prevRightCylRef = React.useRef(formData.rightEye.dv.cyl);
  const prevLeftSphRef = React.useRef(formData.leftEye.dv.sph);
  const prevLeftCylRef = React.useRef(formData.leftEye.dv.cyl);
  
  useEffect(() => {
    // Only run if SPH or CYL values actually changed
    const rightSphChanged = prevRightSphRef.current !== formData.rightEye.dv.sph;
    const rightCylChanged = prevRightCylRef.current !== formData.rightEye.dv.cyl;
    const leftSphChanged = prevLeftSphRef.current !== formData.leftEye.dv.sph;
    const leftCylChanged = prevLeftCylRef.current !== formData.leftEye.dv.cyl;
    
    // Update refs
    prevRightSphRef.current = formData.rightEye.dv.sph;
    prevRightCylRef.current = formData.rightEye.dv.cyl;
    prevLeftSphRef.current = formData.leftEye.dv.sph;
    prevLeftCylRef.current = formData.leftEye.dv.cyl;
    
    // Skip if nothing changed to prevent infinite loops
    if (!rightSphChanged && !rightCylChanged && !leftSphChanged && !leftCylChanged) return;
    
    const rightEyeWarnings = checkHighPrescription(
      formData.rightEye.dv.sph,
      formData.rightEye.dv.cyl
    ).warnings;

    const leftEyeWarnings = checkHighPrescription(
      formData.leftEye.dv.sph,
      formData.leftEye.dv.cyl
    ).warnings;

    // Only update if warnings actually changed
    const rightWarningsChanged = JSON.stringify(rightEyeWarnings) !== JSON.stringify(warnings.rightEye);
    const leftWarningsChanged = JSON.stringify(leftEyeWarnings) !== JSON.stringify(warnings.leftEye);
    
    if (rightWarningsChanged || leftWarningsChanged) {
      setWarnings({
        rightEye: rightEyeWarnings,
        leftEye: leftEyeWarnings
      });
    }
  }, [
    formData.rightEye.dv.sph,
    formData.rightEye.dv.cyl,
    formData.leftEye.dv.sph,
    formData.leftEye.dv.cyl,
    warnings
  ]);

  // Update visual acuity status when VN changes
  // Using refs to track previous values and prevent infinite loops
  const prevRightVnRef = React.useRef(formData.rightEye.dv.vn);
  const prevLeftVnRef = React.useRef(formData.leftEye.dv.vn);
  
  useEffect(() => {
    // Only run if VN values actually changed
    const rightVnChanged = prevRightVnRef.current !== formData.rightEye.dv.vn;
    const leftVnChanged = prevLeftVnRef.current !== formData.leftEye.dv.vn;
    
    // Update refs
    prevRightVnRef.current = formData.rightEye.dv.vn;
    prevLeftVnRef.current = formData.leftEye.dv.vn;
    
    // Skip if nothing changed to prevent infinite loops
    if (!rightVnChanged && !leftVnChanged) return;
    
    // Process the visual acuity values
    const rightVa = validateAndFormatVn(formData.rightEye.dv.vn);
    const leftVa = validateAndFormatVn(formData.leftEye.dv.vn);

    // Only update state if values actually changed
    if (rightVa !== vaStatus.rightEye || leftVa !== vaStatus.leftEye) {
      setVaStatus({
        rightEye: rightVa,
        leftEye: leftVa
      });
    }
  }, [formData.rightEye.dv.vn, formData.leftEye.dv.vn, vaStatus]);



  // Handle Vn field changes
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

        // Update VA status if we have a complete value
        if (formattedValue.length > 2) {
          const prescriptionData = {
            sph: formData[eye as 'rightEye' | 'leftEye'].dv.sph,
            cyl: formData[eye as 'rightEye' | 'leftEye'].dv.cyl,
            age: formData.age || 0
          };

          const vaResult = validateAndFormatVn(formattedValue, prescriptionData);
          if (vaResult) {
            setVaStatus(prev => ({
              ...prev,
              [eye]: vaResult
            }));
          }
        }
      }
    }
  };

  // Handle Vn field focus
  const handleVnFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target;
    
    // Handle N.V row
    if (input.name.includes('.nv.vn')) {
      if (!input.value) {
        handleChange({
          ...e,
          target: {
            ...e.target,
            value: 'N'
          }
        });
      }
      return;
    }

    // Handle D.V row
    if (input.name.includes('.dv.vn')) {
      if (!input.value || !input.value.startsWith('6/')) {
        handleChange({
          ...e,
          target: {
            ...e.target,
            value: '6/'
          }
        });
      }
    }
  };

  // Handle Vn field keydown
  const handleVnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    
    // For N.V row, prevent any changes
    if (input.name.includes('.nv.vn')) {
      e.preventDefault();
      return;
    }

    // For D.V row, allow only numbers and control keys
    if (input.name.includes('.dv.vn')) {
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
      }
    }
  };

  // Effect to handle balance lens functionality
  useEffect(() => {
    if (formData.balanceLens) {
      // Copy right eye values to left eye
      const newLeftEye = {
        dv: {
          ...formData.rightEye.dv,
          lpd: formData.leftEye.dv.lpd // Keep original LPD
        },
        nv: { ...formData.rightEye.nv }
      };

      // Update each field individually to ensure proper state updates
      Object.entries(newLeftEye.dv).forEach(([key, value]) => {
        handleChange({
          target: {
            name: `leftEye.dv.${key}`,
            value: value?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });

      Object.entries(newLeftEye.nv).forEach(([key, value]) => {
        handleChange({
          target: {
            name: `leftEye.nv.${key}`,
            value: value?.toString() || ''
          }
        } as React.ChangeEvent<HTMLInputElement>);
      });
    }
  }, [formData.balanceLens, formData.rightEye]);

  // Effect to update spherical equivalent when SPH or CYL changes
  useEffect(() => {
    // Update right eye SE
    const rightDvSe = calculateSphericalEquivalent(formData.rightEye.dv.sph, formData.rightEye.dv.cyl);
    const rightNvSe = calculateSphericalEquivalent(formData.rightEye.nv.sph, formData.rightEye.nv.cyl);
    
    if (rightDvSe !== null) {
      handleChange({
        target: {
          name: 'rightEye.dv.sphericalEquivalent',
          value: rightDvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    
    if (rightNvSe !== null) {
      handleChange({
        target: {
          name: 'rightEye.nv.sphericalEquivalent',
          value: rightNvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }

    // Update left eye SE
    const leftDvSe = calculateSphericalEquivalent(formData.leftEye.dv.sph, formData.leftEye.dv.cyl);
    const leftNvSe = calculateSphericalEquivalent(formData.leftEye.nv.sph, formData.leftEye.nv.cyl);
    
    if (leftDvSe !== null) {
      handleChange({
        target: {
          name: 'leftEye.dv.sphericalEquivalent',
          value: leftDvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
    
    if (leftNvSe !== null) {
      handleChange({
        target: {
          name: 'leftEye.nv.sphericalEquivalent',
          value: leftNvSe.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [
    formData.rightEye.dv.sph,
    formData.rightEye.dv.cyl,
    formData.rightEye.nv.sph,
    formData.rightEye.nv.cyl,
    formData.leftEye.dv.sph,
    formData.leftEye.dv.cyl,
    formData.leftEye.nv.sph,
    formData.leftEye.nv.cyl
  ]);

  // Validate prescription data when values change
  useEffect(() => {
    const rightEyeErrors = validatePrescriptionData(formData.rightEye.dv, false);
    const leftEyeErrors = validatePrescriptionData(formData.leftEye.dv, formData.balanceLens);

    const newErrors: Record<string, string> = {};
    rightEyeErrors.forEach(error => {
      newErrors[`rightEye.dv.${error.field}`] = error.message;
    });
    leftEyeErrors.forEach(error => {
      newErrors[`leftEye.dv.${error.field}`] = error.message;
    });

    setErrors(newErrors);
  }, [formData.rightEye.dv, formData.leftEye.dv, formData.balanceLens]);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 text-blue-700">Lens Prescription</h3>
      {/* Display high prescription warnings if any */}
      {(warnings.rightEye.length > 0 || warnings.leftEye.length > 0) && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">High Prescription Warnings:</h4>
          {warnings.rightEye.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">Right Eye:</span>
              <ul className="list-disc list-inside ml-4">
                {warnings.rightEye.map((warning, i) => (
                  <li key={i} className="text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.leftEye.length > 0 && (
            <div>
              <span className="font-medium">Left Eye:</span>
              <ul className="list-disc list-inside ml-4">
                {warnings.leftEye.map((warning, i) => (
                  <li key={i} className="text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Right Eye */}
        <div className="border p-4 rounded bg-white shadow-sm">
          <h4 className="text-center font-medium mb-2 text-blue-600">
            Right 
            {vaStatus.rightEye && (
              <span className={`ml-2 text-sm ${
                vaStatus.rightEye.status === "Normal" ? 'text-green-600' :
                vaStatus.rightEye.status === "Slightly reduced" ? 'text-yellow-600' :
                vaStatus.rightEye.status === "Reduced" ? 'text-orange-600' :
                'text-red-600'
              }`}>
                ({vaStatus.rightEye.status})
                {vaStatus.rightEye.equivalentValue && 
                  ` - ${vaStatus.rightEye.equivalentValue}`
                }
              </span>
            )}
          </h4>
          <table className="w-full border-collapse text-gray-700">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-1 text-sm"></th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical: Measures nearsightedness (-) or farsightedness (+) in diopters">Sph</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Cylindrical: Corrects astigmatism">Cyl</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Axis: Orientation of astigmatism correction (0-180°)">Ax</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Addition: Extra power for near vision">Add</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Visual Acuity: Expected vision with correction (e.g., 6/6)">Vn</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Right Pupillary Distance in mm">RPD</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical Equivalent">SE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-1 text-sm font-medium text-left">D.V</td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.sph} name="rightEye.dv.sph" onChange={handleNumericInputChange} className="text-center text-sm" error={errors['rightEye.dv.sph']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.cyl} name="rightEye.dv.cyl" onChange={handleNumericInputChange} className="text-center text-sm" error={errors['rightEye.dv.cyl']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.ax} name="rightEye.dv.ax" onChange={handleChange} className="text-center text-sm" error={errors['rightEye.dv.ax']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.add} name="rightEye.dv.add" onChange={handleNumericInputChange} onBlur={(e) => calculateNearVision('rightEye', e)} className="text-center text-sm" error={errors['rightEye.dv.add']} /></td>
                <td className="border border-gray-300 p-1 relative">
                  <Input 
                    value={formData.rightEye.dv.vn} 
                    name="rightEye.dv.vn" 
                    onChange={handleVnChange} 
                    onFocus={handleVnFocus} 
                    onKeyDown={handleVnKeyDown} 
                    className="text-center text-sm"
                    error={errors['rightEye.dv.vn']}
                    placeholder="6/"
                  />
                  {vaStatus.rightEye?.comparisonToExpected && (
                    <div className={`absolute -bottom-6 left-0 right-0 text-xs px-1 ${
                      vaStatus.rightEye.comparisonToExpected.status === 'Better than expected' ? 'text-green-600' :
                      vaStatus.rightEye.comparisonToExpected.status === 'Worse than expected' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {vaStatus.rightEye.comparisonToExpected.status}
                      {vaStatus.rightEye.comparisonToExpected.recommendation && (
                        <span className="block text-xs text-orange-600">
                          {vaStatus.rightEye.comparisonToExpected.recommendation}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.dv.rpd} name="rightEye.dv.rpd" onChange={handleNumericInputChange} className="text-center text-sm" error={errors['rightEye.dv.rpd']} /></td>
                <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.rightEye.dv.sphericalEquivalent || '-'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-1 text-sm font-medium text-left">N.V</td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.sph} name="rightEye.nv.sph" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.cyl} name="rightEye.nv.cyl" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.ax} name="rightEye.nv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.rightEye.nv.add} name="rightEye.nv.add" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    value={formData.rightEye.nv.vn} 
                    name="rightEye.nv.vn" 
                    onChange={handleChange}
                    className="text-center text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1"></td>
                <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.rightEye.nv.sphericalEquivalent || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Left Eye */}
        <div className="border p-4 rounded bg-white shadow-sm">
          <h4 className="text-center font-medium mb-2 text-blue-600">
            Left
            {vaStatus.leftEye && (
              <span className={`ml-2 text-sm ${
                vaStatus.leftEye.status === "Normal" ? 'text-green-600' :
                vaStatus.leftEye.status === "Slightly reduced" ? 'text-yellow-600' :
                vaStatus.leftEye.status === "Reduced" ? 'text-orange-600' :
                'text-red-600'
              }`}>
                ({vaStatus.leftEye.status})
                {vaStatus.leftEye.equivalentValue && 
                  ` - ${vaStatus.leftEye.equivalentValue}`
                }
              </span>
            )}
          </h4>
          <table className="w-full border-collapse text-gray-700">
            <thead>
              <tr className="bg-blue-50">
                <th className="border border-gray-300 px-2 py-1 text-sm"></th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical: Measures nearsightedness (-) or farsightedness (+) in diopters">Sph</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Cylindrical: Corrects astigmatism">Cyl</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Axis: Orientation of astigmatism correction (0-180°)">Ax</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Addition: Extra power for near vision">Add</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Visual Acuity: Expected vision with correction (e.g., 6/6)">Vn</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Left Pupillary Distance in mm">LPD</th>
                <th className="border border-gray-300 px-2 py-1 text-sm" title="Spherical Equivalent">SE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-1 text-sm font-medium text-left">D.V</td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.sph} name="leftEye.dv.sph" onChange={handleNumericInputChange} className="text-center text-sm" disabled={formData.balanceLens} error={errors['leftEye.dv.sph']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.cyl} name="leftEye.dv.cyl" onChange={handleNumericInputChange} className="text-center text-sm" disabled={formData.balanceLens} error={errors['leftEye.dv.cyl']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.ax} name="leftEye.dv.ax" onChange={handleChange} className="text-center text-sm" disabled={formData.balanceLens} error={errors['leftEye.dv.ax']} /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.add} name="leftEye.dv.add" onChange={handleNumericInputChange} onBlur={(e) => calculateNearVision('leftEye', e)} className="text-center text-sm" disabled={formData.balanceLens} error={errors['leftEye.dv.add']} /></td>
                <td className="border border-gray-300 p-1 relative">
                  <Input 
                    value={formData.leftEye.dv.vn} 
                    name="leftEye.dv.vn" 
                    onChange={handleVnChange}
                    onFocus={handleVnFocus}
                    onKeyDown={handleVnKeyDown}
                    className="text-center text-sm"
                    disabled={formData.balanceLens}
                    error={errors['leftEye.dv.vn']}
                    placeholder="6/"
                  />
                  {vaStatus.leftEye?.comparisonToExpected && (
                    <div className={`absolute -bottom-6 left-0 right-0 text-xs px-1 ${
                      vaStatus.leftEye.comparisonToExpected.status === 'Better than expected' ? 'text-green-600' :
                      vaStatus.leftEye.comparisonToExpected.status === 'Worse than expected' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {vaStatus.leftEye.comparisonToExpected.status}
                      {vaStatus.leftEye.comparisonToExpected.recommendation && (
                        <span className="block text-xs text-orange-600">
                          {vaStatus.leftEye.comparisonToExpected.recommendation}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.dv.lpd} name="leftEye.dv.lpd" onChange={handleNumericInputChange} className="text-center text-sm" error={errors['leftEye.dv.lpd']} /></td>
                <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.leftEye.dv.sphericalEquivalent || '-'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-1 text-sm font-medium text-left">N.V</td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.sph} name="leftEye.nv.sph" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.cyl} name="leftEye.nv.cyl" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.ax} name="leftEye.nv.ax" onChange={handleChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1"><Input value={formData.leftEye.nv.add} name="leftEye.nv.add" onChange={handleNumericInputChange} className="text-center text-sm" /></td>
                <td className="border border-gray-300 p-1">
                  <Input 
                    value={formData.leftEye.nv.vn} 
                    name="leftEye.nv.vn" 
                    onChange={handleChange}
                    className="text-center text-sm"
                  />
                </td>
                <td className="border border-gray-300 p-1 text-right">
                  <Checkbox
                    label="BALANCE LENS"
                    checked={formData.balanceLens}
                    onChange={handleCheckboxChange}
                    name="balanceLens"
                  />
                </td>
                <td className="border border-gray-300 p-1 text-sm text-gray-600">{formData.leftEye.nv.sphericalEquivalent || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSection; 