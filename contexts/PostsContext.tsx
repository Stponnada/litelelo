// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import { useAuth } from '../hooks/useAuth';

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
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

  const fetchPosts = useCallback(async () => {
    // --- THIS IS THE FIX: The hook now depends on the stable user ID ---
    if (!user?.id) {
      setPosts([]);
      setLoading(false);
      return;
    }
    // Only set loading on the initial fetch
    if (posts.length === 0) {
        setLoading(true);
    }
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_feed_posts');
      if (fetchError) throw fetchError;
      
      // --- THIS IS THE RESTORED MAPPING LOGIC ---
      // The RPC returns flat data, so we need to nest the author object
      // to match our PostType interface.
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
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // --- THE FIX IS HERE ---

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPostToContext = (newPost: any) => {
    // Also format the new post from the RPC call
    const formattedNewPost: PostType = {
      ...newPost,
      author: {
        author_id: newPost.author_id,
        author_type: newPost.author_type,
        author_name: newPost.author_name,
        author_username: newPost.author_username,
        author_avatar_url: newPost.author_avatar_url,
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

  const value = { posts, loading, error, addPostToContext, updatePostInContext, fetchPosts };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};