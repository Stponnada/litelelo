// src/components/BentoSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

interface BentoSkeletonProps {
    className?: string;
}

const BentoSkeleton: React.FC<BentoSkeletonProps> = ({ className = "" }) => {
    return (
        <Skeleton className={`rounded-[2rem] ${className}`} />
    );
};

export default BentoSkeleton;
