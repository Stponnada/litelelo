// src/components/Skeleton.tsx

import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-tertiary-light/50 dark:bg-tertiary/50 rounded-md animate-pulse ${className}`} />
);

export default Skeleton;