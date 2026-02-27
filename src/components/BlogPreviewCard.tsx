import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Post as PostType } from '@/types';

const BlogPreviewCard: React.FC<{ post: PostType }> = ({ post }) => {
    // Handle both RPC style and joined profile style
    const authorName = post.author?.author_name || (post.author as any)?.full_name || (post.author as any)?.username || 'Anonymous';
    const authorAvatar = post.author?.author_avatar_url || (post.author as any)?.avatar_url;
    const thumbImage = post.image_url;

    return (
        <Link
            href={`/blog/${post.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
        >
            {thumbImage && (
                <div className="relative h-44 overflow-hidden">
                    <Image
                        src={thumbImage}
                        alt={post.title || 'Blog post'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black/60 to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
                </div>
            )}
            <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-2">
                    Blog
                </span>
                <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-100 line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
                    {post.title}
                </h3>
                {post.content && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                )}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {authorAvatar ? (
                            <Image
                                src={authorAvatar}
                                alt={authorName}
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                <span className="text-[10px] text-zinc-500">{authorName[0]}</span>
                            </div>
                        )}
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {authorName}
                        </span>
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default BlogPreviewCard;
