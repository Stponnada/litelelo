// src/pages/BookmarksPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import PostComponent from '../components/Post';
import { Post as PostType } from '../types';
import Spinner from '../components/Spinner';
import LightBox from '../components/lightbox';
import { BookmarkIcon } from '../components/icons';

const BookmarksPage: React.FC = () => {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchBookmarkedPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase.rpc('get_bookmarked_posts');
                
                if (fetchError) throw fetchError;
                
                // --- THIS IS THE FIX ---
                // The RPC now returns the author details directly, so we just need to map them.
                const formattedPosts = (data as any[]).map(p => ({
                    ...p,
                    author: {
                      author_id: p.author_id,
                      author_type: p.author_type,
                      author_name: p.author_name,
                      author_username: p.author_username,
                      author_avatar_url: p.author_avatar_url,
                    }
                }));

                setPosts(formattedPosts || []);
            } catch (err: any) {
                console.error("Error fetching bookmarked posts:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarkedPosts();
    }, []);

    if (loading) {
        return <div className="text-center p-10"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 flex items-center justify-center">
                    <BookmarkIcon className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main">
                        My Bookmarks
                    </h1>
                    <p className="text-text-secondary-light dark:text-text-secondary">
                        Your saved posts for later viewing.
                    </p>
                </div>
            </div>

            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 px-6 bg-secondary-light dark:bg-secondary rounded-xl border-2 border-dashed border-tertiary-light dark:border-tertiary">
                    <BookmarkIcon className="w-12 h-12 mx-auto text-text-tertiary-light dark:text-text-tertiary mb-4" />
                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">No Bookmarks Yet</h3>
                    <p className="text-text-secondary-light dark:text-text-secondary mt-2">
                        Click the bookmark icon on any post to save it here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default BookmarksPage;