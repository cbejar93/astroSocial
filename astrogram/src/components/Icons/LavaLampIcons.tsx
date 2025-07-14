import React from 'react';

interface LavaLampIconProps {
  className?: string;
}

const LavaLampIcon: React.FC<LavaLampIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Lamp body */}
    <path d="M10 2 C6 2 5 6 5 11 C5 17 7 20 12 20 C17 20 19 17 19 11 C19 6 18 2 14 2 Z" />
    {/* Base */}
    <path d="M7 21 H17" />
    {/* Wax blobs */}
    <circle   cx="12" cy="7"  r="1.5" fill="currentColor" />
    <ellipse  cx="11" cy="13" rx="1.4" ry="1"   fill="currentColor" />
    <ellipse  cx="13" cy="16.5" rx="1"   ry="0.8" fill="currentColor" />
  </svg>
);

export default LavaLampIcon;