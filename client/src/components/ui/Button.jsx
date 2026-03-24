import React from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: 'bg-primary hover:bg-primary-dark text-white',
  outline: 'border border-border text-text-primary hover:bg-gray-50',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-gray-50',
  danger: 'bg-danger hover:bg-red-600 text-white',
  success: 'bg-success hover:bg-green-600 text-white',
};
const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = ({ children, variant = 'primary', size = 'md', className, disabled, onClick, type = 'button', ...props }) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    className={clsx('font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed', variants[variant], sizes[size], className)}
    {...props}
  >
    {children}
  </button>
);

export default Button;
