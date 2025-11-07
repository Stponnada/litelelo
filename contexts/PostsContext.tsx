// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
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
  fetchPosts: (loadMore?: boolean) => void;
  hasMore: boolean;
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
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const POSTS_PER_PAGE = 10;
  
  // Ref to hold the current feedType to avoid including it in useCallback dependency
  const feedTypeRef = useRef(feedType);
  feedTypeRef.current = feedType;

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!user?.id || isFetching) {
      if (!user?.id) setLoading(false);
      return;
    }

    setIsFetching(true);
    // Only show full-page skeleton on the very first load
    if (!loadMore) {
        setLoading(true);
    }
    setError(null);

    const currentPage = loadMore ? page + 1 : 0;
    
    try {
      // Use the ref here so fetchPosts itself doesn't depend on feedType state
      const rpcToCall = feedTypeRef.current === 'foryou' ? 'get_public_feed_posts' : 'get_feed_posts';
      
      const { data, error: fetchError } = await supabase
        .rpc(rpcToCall)
        .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);
      
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

      if (formattedPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

      if (loadMore) {
        setPosts(prev => [...prev, ...formattedPosts]);
      } else {
        setPosts(formattedPosts || []);
      }
      setPage(currentPage);

    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user?.id, isFetching, page]); // <-- THE FIX: Removed unstable dependencies

  // Effect to reset and fetch when feedType or user changes
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    // We call fetchPosts here, but we don't need it in the dependency array
    // because its own dependency array is stable.
    if(user?.id) {
        // A small timeout to allow state to settle before fetching
        setTimeout(() => fetchPosts(false), 0);
    }
  }, [feedType, user?.id]);


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

  const value = { posts, loading, error, feedType, setFeedType, addPostToContext, updatePostInContext, fetchPosts, hasMore };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};