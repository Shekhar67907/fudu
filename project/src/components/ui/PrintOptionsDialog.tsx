import React, { useState } from 'react';
import Dialog from './Dialog';
import DialogActions, { ActionButton } from './DialogActions';
import { printService } from '../../utils/printService';
import { PrescriptionData } from '../../types';

interface PrintOptionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintOptionSelected?: (option: 'normal' | 'card') => void;
  prescriptionData: PrescriptionData;
}

const PrintOptionsDialog: React.FC<PrintOptionsDialogProps> = ({
  isOpen,
  onClose,
  onPrintOptionSelected,
  prescriptionData
}) => {
  const [selectedOption, setSelectedOption] = useState<'normal' | 'card'>('normal');

  const handlePrint = () => {
    // Generate a filename based on customer name and prescription number
    const customerName = (prescriptionData.name || '').replace(/[^a-zA-Z0-9]/g, '_');
    const prescriptionNo = (prescriptionData.prescriptionNo || '').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${customerName}${prescriptionNo}.pdf`;
    
    // Call the appropriate print function based on the selected option
    if (selectedOption === 'normal') {
      printService.printNormalSize(prescriptionData, { filename });
    } else if (selectedOption === 'card') {
      printService.printCardSize(prescriptionData, { filename });
    }
    
    // Call the callback if provided
    if (onPrintOptionSelected) {
      onPrintOptionSelected(selectedOption);
    }
    
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Prescription Print">
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="normalSize"
              name="printOption"
              className="mr-2"
              checked={selectedOption === 'normal'}
              onChange={() => setSelectedOption('normal')}
            />
            <label htmlFor="normalSize">Print Normal Size</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="cardSize"
              name="printOption"
              className="mr-2"
              checked={selectedOption === 'card'}
              onChange={() => setSelectedOption('card')}
            />
            <label htmlFor="cardSize">Print Card Size</label>
          </div>
        </div>
        
        <DialogActions className="mt-6">
          <ActionButton onClick={handlePrint} variant="primary">
            Print
          </ActionButton>
          <ActionButton onClick={onClose} variant="outline" className="ml-2">
            Cancel
          </ActionButton>
        </DialogActions>
      </div>
    </Dialog>
  );
};

export default PrintOptionsDialog;
