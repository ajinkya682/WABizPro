import React from 'react';
const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${s[size]} animate-spin rounded-full border-2 border-border border-t-primary`} />
  );
};
export default Spinner;
