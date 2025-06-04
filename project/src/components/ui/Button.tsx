import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'nav' | 'action';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = "flex items-center justify-center rounded font-medium transition-colors focus:outline-none";
  
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400",
    outline: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
    nav: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-300",
    action: "bg-gray-200 text-gray-800 hover:bg-gray-300 active:bg-gray-400 border border-gray-400"
  };
  
  const sizeStyles = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3"
  };
  
  const widthStyle = fullWidth ? "w-full" : "";
  
  return (
    <button 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;