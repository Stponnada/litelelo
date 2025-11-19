// src/components/Spinner.tsx

import React from 'react';

interface SpinnerProps {
  isRed?: boolean;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ isRed = false, className = 'h-16 w-16' }) => {
  const primaryColor = isRed ? 'border-red-500' : 'border-brand-green';
  const secondaryColor = isRed ? 'border-red-500/30' : 'border-brand-green/30';
  const glowColor = isRed ? 'bg-red-500' : 'bg-brand-green';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer Ring - Slow Spin */}
      <div className={`absolute inset-0 rounded-full border-4 border-t-transparent border-b-transparent ${secondaryColor} animate-spin-slow`}></div>

      {/* Inner Ring - Fast Reverse Spin */}
      <div className={`absolute inset-2 rounded-full border-4 border-l-transparent border-r-transparent ${primaryColor} animate-spin-reverse`}></div>

      {/* Core - Pulse */}
      <div className={`absolute w-3 h-3 rounded-full ${glowColor} animate-pulse-glow shadow-[0_0_15px_currentColor]`}></div>
    </div>
  );
};

export default Spinner;