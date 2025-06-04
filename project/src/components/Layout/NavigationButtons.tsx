import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const NavigationButtons: React.FC = () => {
  const navigate = useNavigate();
  
  const navigationButtons = [
    { name: 'Prescription', path: '/prescription' },
    { name: 'Order Card', path: '/order-card' },
    { name: 'Contact Lens Card', path: '/contact-lens-card' },
    { name: 'Billing', path: '/billing' },
    { name: 'Customer History', path: '/customer-history' },
    { name: 'Database Backup', path: '/database-backup' },
  ];
  
  return (
    <div className="flex px-4 py-2 space-x-2 bg-gray-50 border-b border-gray-300">
      {navigationButtons.map((button) => (
        <Button
          key={button.name}
          variant="nav"
          size="md"
          onClick={() => navigate(button.path)}
        >
          {button.name}
        </Button>
      ))}
    </div>
  );
};

export default NavigationButtons;