'use client';
// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType, CampusEvent, MarketplaceListing, LostAndFoundItem } from '../types';
import { useAuth } from './AuthContext';

export type FeedType = 'foryou' | 'following' | 'campus';

type FeedItem = PostType | ({ item_type: 'listing', item_data: MarketplaceListing } & { id: string }) | ({ item_type: 'event', item_data: CampusEvent } & { id: string }) | ({ item_type: 'lost_found', item_data: LostAndFoundItem } & { id: string });

interface FeedState {
  posts: FeedItem[];
  page: number;
  hasMore: boolean;
}

interface PostsContextType {
  posts: FeedItem[];
  loading: boolean;
  error: string | null;
  feedType: FeedType;
  setFeedType: (type: FeedType) => void;
  fetchPosts: (loadMore?: boolean) => void;
  hasMore: boolean;
  addPostToContext: (newPost: FeedItem) => void;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

export const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  const [feedData, setFeedData] = useState<Record<FeedType, FeedState>>({
    foryou: { posts: [], page: -1, hasMore: true },
    following: { posts: [], page: -1, hasMore: true },
    campus: { posts: [], page: -1, hasMore: true },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>('foryou');
  const [isFetching, setIsFetching] = useState(false);
  const POSTS_PER_PAGE = 10;

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!user?.id || isFetching) return;

    setIsFetching(true);
    if (!loadMore && feedData[feedType].page === -1) {
      setLoading(true);
    }
    setError(null);

    const currentFeedState = feedData[feedType];
    const currentPage = loadMore ? currentFeedState.page + 1 : 0;

    try {
      let rpcToCall: string;
      let query;

      switch (feedType) {
        case 'following':
          rpcToCall = 'get_feed_posts';
          query = supabase.rpc(rpcToCall);
          break;
        case 'campus':
          rpcToCall = 'get_campus_feed';
          if (!profile?.campus) throw new Error("Campus not defined for user.");
          query = supabase.rpc(rpcToCall, { p_campus: profile.campus });
          break;
        case 'foryou':
        default:
          rpcToCall = 'get_public_feed_posts';
          query = supabase.rpc(rpcToCall);
          break;
      }

      const { data, error: fetchError } = await query
        .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);

      if (fetchError) throw fetchError;

      const formattedPosts = (data || []).map((item: any) => {
        if ('item_type' in item && 'item_data' in item && item.item_data && typeof item.item_data === 'object' && 'id' in item.item_data) {
          return { ...item, id: (item.item_data as { id: string }).id };
        } else {
          // Check if author is already an object or if we need to construct it from flat properties
          const hasNestedAuthor = item.author && typeof item.author === 'object';

          return {
            ...item,
            author: hasNestedAuthor ? item.author : {
              author_id: item.author_id,
              author_type: item.author_type,
              author_name: item.author_name,
              author_username: item.author_username,
              author_avatar_url: item.author_avatar_url,
              author_flair_details: item.author_flair_details,
            }
          };
        }
      });

      setFeedData(prev => ({
        ...prev,
        [feedType]: {
          posts: loadMore ? [...prev[feedType].posts, ...formattedPosts] : formattedPosts,
          page: currentPage,
          hasMore: formattedPosts.length === POSTS_PER_PAGE,
        }
      }));

    } catch (err: unknown) {
      console.error(`Error fetching '${feedType}' feed:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [user?.id, isFetching, profile?.campus, feedType, feedData]);

  useEffect(() => {
    if (user?.id && feedData[feedType].page === -1) {
      fetchPosts(false);
    }
  }, [feedType, user?.id, feedData, fetchPosts]);

  // --- THIS IS THE FIX ---
  // Instead of optimistically adding the post, we now force a clean refetch of the current feed.
  // This is more robust and guarantees no duplicates.
  const addPostToContext = (newPost: FeedItem) => {
    // To give immediate feedback, we can clear the posts for the current feed
    // and reset its page count, which will trigger a fresh load.
    setFeedData(prev => ({
      ...prev,
      foryou: { ...prev.foryou, posts: [], page: -1 },
      following: { ...prev.following, posts: [], page: -1 },
      campus: { ...prev.campus, posts: [], page: -1 },
    }));
    // The useEffect will now automatically trigger fetchPosts(false)
    // because the page for the active feed is -1.
  };

  const updatePostInContext = useCallback((updatedPost: Partial<PostType> & { id: string }) => {
    setFeedData(prev => {
      const newFeedData = { ...prev };
      for (const key in newFeedData) {
        const feedKey = key as FeedType;
        newFeedData[feedKey] = {
          ...newFeedData[feedKey],
          posts: newFeedData[feedKey].posts.map(post =>
            post.id === updatedPost.id ? { ...post, ...updatedPost } : post
          )
        };
      }
      return newFeedData;
    });
  }, []);

  const posts = feedData[feedType].posts;
  const hasMore = feedData[feedType].hasMore;
  // Make sure loading is true if posts are empty and we're fetching
  const isCurrentlyLoading = loading || (isFetching && posts.length === 0);

  const value = { posts, loading: isCurrentlyLoading, error, feedType, setFeedType, addPostToContext, updatePostInContext, fetchPosts, hasMore };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};