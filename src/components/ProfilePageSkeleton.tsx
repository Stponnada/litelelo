// src/components/ProfilePageSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';
import PostSkeleton from './PostSkeleton';

const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      {/* Header Section */}
      <div className="relative mb-6">
        <Skeleton className="h-44 sm:h-64 w-full rounded-b-3xl" />
        <div className="px-4 sm:px-8">
          <div className="relative -mt-20 sm:-mt-28 flex flex-col sm:flex-row items-end gap-6">
            <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-secondary-light dark:border-secondary" />
            <div className="flex-1 space-y-3 pb-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
            <div className="flex gap-2 pb-2">
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
