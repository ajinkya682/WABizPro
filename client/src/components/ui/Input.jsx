import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

const Input = forwardRef(({ className, label, error, ...props }, ref) => (
  <div className="w-full flex flex-col gap-1.5 z-0">
    {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
    <input
      ref={ref}
      className={clsx(
        'w-full px-4 py-2 bg-white border rounded-lg outline-none transition-colors duration-150',
        error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary',
        'disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-danger mt-0.5">{error}</span>}
  </div>
));
Input.displayName = 'Input';
export default Input;
