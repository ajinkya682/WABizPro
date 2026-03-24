import React from 'react';
import { clsx } from 'clsx';
const Card = ({ children, className, ...props }) => (
  <div className={clsx('bg-white rounded-xl border border-border shadow-sm', className)} {...props}>
    {children}
  </div>
);
export default Card;
