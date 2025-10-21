// src/components/QuotePostDisplay.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QuotedPost } from '../types';
import { formatTimestamp } from '../utils/timeUtils';
import { renderContentWithEmbeds } from '../utils/renderEmbeds';

const QuotePostDisplay: React.FC<{ post: QuotedPost }> = ({ post }) => {
    const navigate = useNavigate();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/post/${post.id}`);
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
                <img src={post.author_avatar_url || ''} alt={post.author_username || ''} className="w-5 h-5 rounded-full object-cover"/>
                <span className="font-semibold text-sm">{post.author_name}</span>
                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{post.author_username} &middot; {formatTimestamp(post.created_at)}</span>
            </div>
            <div className="text-sm text-text-secondary-light dark:text-text-secondary space-y-2">
                {renderContentWithEmbeds(post.content)}
            </div>
            {post.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden border border-tertiary-light dark:border-tertiary">
                    <img src={post.image_url} alt="Quoted post content" className="w-full h-auto max-h-48 object-cover" />
                </div>
            )}
        </div>
    );
};

export default QuotePostDisplay;