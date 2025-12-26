// src/components/QuotePostDisplay.tsx

import React from 'react';
// FIXED: Use useRouter
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QuotedPost } from '../types';
import { formatTimestamp } from '../utils/timeUtils';
import { renderContentWithEmbeds } from '../utils/renderEmbeds';
import { getResizedAvatarUrl } from '../utils/imageUtils';

const QuotePostDisplay: React.FC<{ post: QuotedPost }> = ({ post }) => {
    // FIXED: Initialize router
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // FIXED: router.push
        router.push(`/post/${post.id}`);
    };

    if (post.is_deleted) {
        return (
            <div className="mt-2 border border-tertiary-light dark:border-tertiary rounded-xl p-3">
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary italic">
                    This post is no longer available.
                </p>
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className="mt-2 border border-tertiary-light dark:border-tertiary rounded-xl p-3 hover:bg-tertiary-light/20 dark:hover:bg-tertiary/20 transition-colors"
        >
            <div className="flex items-center space-x-2 mb-2">
                <Image
                    src={getResizedAvatarUrl(post.author_avatar_url, 40, 40, post.author_name || post.author_username)}
                    alt={post.author_username || ''}
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                    unoptimized
                />
                <span className="font-semibold text-sm">{post.author_name}</span>
                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{post.author_username} &middot; {formatTimestamp(post.created_at)}</span>
            </div>
            <div className="text-sm text-text-secondary-light dark:text-text-secondary space-y-2">
                {renderContentWithEmbeds(post.content)}
            </div>
            {post.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-tertiary-light dark:border-tertiary">
                    <div className="relative w-full h-48">
                        <Image src={post.image_url} alt="Quoted post content" fill className="object-cover" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotePostDisplay;