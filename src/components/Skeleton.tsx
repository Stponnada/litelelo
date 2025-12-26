// src/components/Skeleton.tsx

import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-black/5 dark:bg-white/5 animate-pulse rounded-md ${className}`} />
);

export default Skeleton;