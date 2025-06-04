import React from 'react';
import Button from './Button';

interface DialogActionsProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const DialogActions: React.FC<DialogActionsProps> = ({
  children,
  className = '',
  align = 'center',
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`flex mt-5 sm:mt-6 ${alignmentClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

interface ActionButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  variant = 'primary',
  children,
  className = '',
}) => {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  return (
    <button
      type="button"
      className={`inline-flex justify-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default DialogActions;
