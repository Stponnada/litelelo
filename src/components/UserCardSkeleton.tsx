// src/components/UserCardSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

const UserCardSkeleton: React.FC = () => {
    return (
        <Skeleton className="h-[68px] w-full rounded-2xl" />
    );
};

export default UserCardSkeleton;
