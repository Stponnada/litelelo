// src/components/Spinner.tsx

import React from 'react';

interface SpinnerProps {
  isRed?: boolean;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ isRed = false, className = 'h-20 w-20' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 400 400"
    className={`animate-swing mx-auto ${isRed ? 'text-red-500' : 'text-white'} ${className}`}
    stroke="currentColor"
  >
    <g
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity="0.9"
    >
      <path
        strokeWidth="16"
        d="M138.051 150.752c30.977 11.258 7.999 62.071-23.22 49.444-27.913-11.289-28.749-78.638 36.117-55.789M194.279 254c-31.331-4-37.876-47.152-35.979-47 31.481 10.222 62.365 6.416 64.762 6 4.064-.705 82.24-18.107 107.938-42"
      ></path>
      <path
        strokeWidth="16"
        d="M303 217c-.903-1.78-2.268-3.013-4.119-4.445-.706-.548-1.491-1.066-2.247-1.581-1.986-1.349-36.809-22.96-40.924-25.183-1.986-1.084-4.018-1.791-6.71-1.791q-.056.042-.112.078.029-.036.057-.078c-.031.039-27.396 24.314-27.945 26"
      ></path>
      <path
        strokeWidth="6"
        d="M26 152.9q.473.306.932.641c1.668 3.905 93.159 65.243 180.046 63.419C291.383 215.188 364.921 156.553 374 147"
        opacity="0.503"
      ></path>
    </g>
  </svg>
);

export default Spinner;