// src/components/PostSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

const PostSkeleton: React.FC = () => {
  return (
    <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg border border-tertiary-light dark:border-tertiary p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex justify-around mt-4 pt-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-10" />
      </div>
    </div>
  );
};

export default PostSkeleton;