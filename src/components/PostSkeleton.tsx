// src/components/PostSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

const PostSkeleton: React.FC = () => {
  return (
    <Skeleton className="h-[180px] w-full rounded-2xl" />
  );
};

export default PostSkeleton;