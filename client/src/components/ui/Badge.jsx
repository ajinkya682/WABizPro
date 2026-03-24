import React from 'react';
import { clsx } from 'clsx';
const variants = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-gray-100 text-gray-600',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
};
const Badge = ({ children, variant = 'secondary', className }) => (
  <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
    {children}
  </span>
);
export default Badge;
