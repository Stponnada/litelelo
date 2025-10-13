// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType, Profile } from '../types';
import { useAuth } from '../hooks/useAuth';

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
  addPostToContext: (newPost: PostType) => void;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

export const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_feed_posts');
      if (fetchError) throw fetchError;
      
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
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPostToContext = (newPost: PostType) => {
    // The incoming newPost from CreatePost.tsx still has a `profiles` property.
    // We need to reshape it into the new `author` structure for consistency.
    const authorProfile = newPost.profiles as Profile | null;
    const formattedNewPost: PostType = {
      ...newPost,
      author: {
        author_id: authorProfile?.user_id || '',
        author_type: 'user', // A new post via CreatePost is always from a user
        author_name: authorProfile?.full_name || '',
        author_username: authorProfile?.username || '',
        author_avatar_url: authorProfile?.avatar_url || '',
      },
      original_poster_username: null,
      profiles: null, // We can nullify the old property
    };
    
    // This is a bit of a trick to satisfy TypeScript since `profiles` is no longer on the final type
    delete (formattedNewPost as any).profiles;

    setPosts(currentPosts => [formattedNewPost, ...currentPosts]);
  };

  const updatePostInContext = useCallback((updatedPost: Partial<PostType> & { id: string }) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const value = { posts, loading, error, addPostToContext, updatePostInContext };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};