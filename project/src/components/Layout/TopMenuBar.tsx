import React, { useState } from 'react';

const TopMenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const menuItems = [
    {
      name: 'Transaction',
      subMenuItems: ['Prescription', 'Order Card', 'Contact Lens Card', 'Repairing', 'Billing', 'Petty Cash', 'Sale Return']
    },
    {
      name: 'Customer',
      subMenuItems: ['Customer History', 'Birthday Finder', 'Anniversary Finder']
    },
    {
      name: 'Accounts & Reports',
      subMenuItems: ['Create Ledger', 'Account Reports', 'Pending Orders', 'Hand Over Orders', 'General Reports', 'Supplier Lens Orders']
    },
    {
      name: 'SMS/Mail Configuration',
      subMenuItems: ['Configure SMS', 'Configure Email', 'Send Bulk Messages']
    },
    {
      name: 'Utilities',
      subMenuItems: ['Backup Data', 'Restore Data', 'Settings']
    },
    {
      name: 'Master',
      subMenuItems: ['Brands', 'Products', 'Employees', 'Suppliers']
    },
    {
      name: 'Exit',
      subMenuItems: []
    }
  ];
  
  const handleMenuClick = (name: string) => {
    if (name === 'Exit') {
      // Handle exit action
      alert('Exit application?');
      return;
    }
    
    setActiveMenu(activeMenu === name ? null : name);
  };
  
  return (
    <div className="bg-gray-100 border-b border-gray-300">
      <div className="flex">
        {menuItems.map((item) => (
          <div key={item.name} className="relative">
            <button
              className={`px-4 py-1 text-sm hover:bg-gray-200 transition-colors ${
                activeMenu === item.name ? 'bg-gray-200' : ''
              }`}
              onClick={() => handleMenuClick(item.name)}
            >
              {item.name}
            </button>
            
            {activeMenu === item.name && item.subMenuItems.length > 0 && (
              <div className="absolute left-0 top-full z-10 w-56 bg-white shadow-lg border border-gray-200">
                {item.subMenuItems.map((subItem) => (
                  <button
                    key={subItem}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => setActiveMenu(null)}
                  >
                    {subItem}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMenuBar;