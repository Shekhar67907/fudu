import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  fullWidth?: boolean;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  fullWidth = true,
  className = '',
  helperText,
  ...props
}) => {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-2`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`
          px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 
          focus:outline-none focus:border-blue-500 focus:ring-blue-500 block rounded-sm sm:text-sm 
          focus:ring-1 ${fullWidth ? 'w-full' : ''} ${error ? 'border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

export default Input;