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
    {/* Glass vessel as straight‑edged trapezoid (shortened) */}
    <polygon points="9,3 15,3 18,18 6,18" />

    {/* Fluid line halfway up with increased amplitude */}
    <path
      d="M7.5 10.5 C9 13, 10.5 8, 12 10.5 C13.5 13, 15 8, 16.5 10.5"
      fill="none"
    />

    {/* Top cap from y=1.5 to y=3 */}
    <rect x={10} y={1.5} width={4} height={1.5} rx={0.3} />

    {/* Base tier 1 (y=21–22): extended horizontally */}
    <path d="M8 21 L16 21 L17 22 L7 22 Z" />

    {/* Base tier 2 (y=22–24): extended horizontally */}
    <path d="M7 22 L17 22 L18 24 L6 24 Z" />
  </svg>
);

export default LavaLampIcon;