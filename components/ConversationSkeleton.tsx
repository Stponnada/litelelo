// src/components/ConversationSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';
import { BackIcon } from './icons'; // We can reuse the BackIcon from Conversation.tsx

interface ConversationSkeletonProps {
  onBack?: () => void;
}

const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({ onBack }) => {
  return (
    <>
      {/* Header Skeleton */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white dark:bg-gray-900 shadow-sm flex-shrink-0">
        {onBack && (
          <div className="md:hidden p-2 rounded-full flex-shrink-0">
            <BackIcon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 overflow-hidden px-4 md:px-6 py-4 space-y-6">
        {/* Received Message */}
        <div className="flex items-end gap-2 w-full justify-start">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-10 w-48 rounded-2xl" />
          </div>
        </div>

        {/* Sent Message */}
        <div className="flex items-end gap-2 w-full justify-end">
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-12 w-64 rounded-2xl" />
            <Skeleton className="h-8 w-40 rounded-2xl ml-auto" />
          </div>
        </div>

        {/* Received Message */}
        <div className="flex items-end gap-2 w-full justify-start">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-8 w-56 rounded-2xl" />
          </div>
        </div>
        
        {/* Sent Message */}
        <div className="flex items-end gap-2 w-full justify-end">
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-10 w-32 rounded-2xl ml-auto" />
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="px-4 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="flex-1 h-12 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
    </>
  );
};

export default ConversationSkeleton;