import React from 'react';

const BrandIcon = ({ className = '', dark = true }) => {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DeVolt">
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0%" stopColor="#FF9933" />
          <stop offset="100%" stopColor="#FF5D5D" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#g)" />
      <path d="M30 60 L45 35 L60 60 Z" fill="#fff" />
    </svg>
  );
};

export default BrandIcon;
