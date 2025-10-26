// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import { useAuth } from '../hooks/useAuth';

export type FeedType = 'foryou' | 'following';

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
  feedType: FeedType;
  setFeedType: (type: FeedType) => void;
  fetchPosts: () => void;
  addPostToContext: (newPost: any) => void;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

export const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>('foryou');

  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setPosts([]);
      setLoading(false);
      return;
    }
    // --- THIS IS THE FIX ---
    // Only set loading to true on the initial fetch when the posts array is empty.
    // This prevents the spinner from showing every time the user switches tabs.
    if (posts.length === 0) {
        setLoading(true);
    }
    setError(null);
    try {
      const rpcToCall = feedType === 'foryou' ? 'get_public_feed_posts' : 'get_feed_posts';
      const { data, error: fetchError } = await supabase.rpc(rpcToCall);
      
      if (fetchError) throw fetchError;
      
      const formattedPosts = (data as any[]).map(p => ({
        ...p,
        author: {
          author_id: p.author_id,
          author_type: p.author_type,
          author_name: p.author_name,
          author_username: p.author_username,
          author_avatar_url: p.author_avatar_url,
          author_flair_details: p.author_flair_details, 
        }
      }));

      setPosts(formattedPosts || []);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, feedType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPostToContext = (newPost: any) => {
    const formattedNewPost: PostType = {
      ...newPost,
      author: {
        author_id: newPost.author_id,
        author_type: newPost.author_type,
        author_name: newPost.author_name,
        author_username: newPost.author_username,
        author_avatar_url: newPost.author_avatar_url,
        author_flair_details: newPost.author_flair_details,
      }
    };
    
    setPosts(currentPosts => [formattedNewPost, ...currentPosts]);
  };

  const updatePostInContext = useCallback((updatedPost: Partial<PostType> & { id: string }) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const value = { posts, loading, error, feedType, setFeedType, addPostToContext, updatePostInContext, fetchPosts };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};