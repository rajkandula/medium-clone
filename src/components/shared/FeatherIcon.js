import React from 'react';

export default function FeatherIcon({ size = 24, className = '', ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Quill spine / shaft */}
      <path d="M3 21l18-18" />
      
      {/* Upper/Right Vane - diagonal barbs curving outwards */}
      <path d="M18.5 5.5c-2.5.5-5 2-6.5 4" />
      <path d="M15 9c-2.5.5-5 2-6.5 4" />
      <path d="M11.5 12.5c-2.5.5-5 2-6.5 4" />
      
      {/* Lower/Left Vane - diagonal barbs curving outwards */}
      <path d="M18.5 5.5c-.5 2.5-2 5-4 6.5" />
      <path d="M15 9c-.5 2.5-2 5-4 6.5" />
      <path d="M11.5 12.5c-.5 2.5-2 5-4 6.5" />
      
      {/* Accent barbs at the tip */}
      <path d="M21 3c-1.2.3-2.5 1-3.5 2" />
    </svg>
  );
}
