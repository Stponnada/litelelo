// src/components/ChatPageSkeleton.tsx

import React from 'react';
import Skeleton from './Skeleton';

const ChatPageSkeleton: React.FC = () => {
    return (
        <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-96px)] w-full overflow-hidden bg-primary-light dark:bg-primary shadow-2xl flex">
            {/* Sidebar Skeleton */}
            <div className="w-full md:w-[420px] h-full border-r border-tertiary-light/50 dark:border-tertiary/50 flex flex-col p-5 space-y-6">
                {/* Header Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-full" />
                </div>

                {/* List Skeleton */}
                <div className="flex-1 space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            </div>

            {/* Main Area Skeleton (Desktop only) */}
            <div className="hidden md:flex flex-1 h-full bg-secondary-light/30 dark:bg-secondary/30 items-center justify-center">
                <div className="space-y-6 flex flex-col items-center">
                    <Skeleton className="w-24 h-24 rounded-3xl" />
                    <Skeleton className="h-8 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-64 rounded-lg" />
                </div>
            </div>
        </div>
    );
};

export default ChatPageSkeleton;
