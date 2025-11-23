// src/components/ProfilePageSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';
import PostSkeleton from './PostSkeleton';

const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      {/* Header Section */}
      <div className="relative mb-6">
        <Skeleton className="h-56 sm:h-72 w-full" />
        <div className="px-4 sm:px-6">
          <div className="relative -mt-20 sm:-mt-24">
            <Skeleton className="w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-primary-light dark:border-primary" />
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
                <div className="flex items-center gap-6 mt-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-11 w-32 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-secondary-light dark:bg-secondary rounded-2xl p-6 space-y-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <hr className="border-tertiary-light dark:border-tertiary" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          
          {/* Right Content */}
          <div className="lg:col-span-2 space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;