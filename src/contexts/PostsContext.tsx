'use client';
// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const fetchingRef = useRef(false);
  const POSTS_PER_PAGE = 10;

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!user?.id || fetchingRef.current) return;

    const currentFeedState = feedData[feedType];

    // If we're already at the end, don't fetch more
    if (loadMore && !currentFeedState.hasMore) return;

    const currentPage = loadMore ? currentFeedState.page + 1 : 0;

    // Prevent double-fetching the same page
    fetchingRef.current = true;
    setIsFetching(true);
    if (!loadMore && currentFeedState.page === -1) {
      setLoading(true);
    }
    setError(null);

    try {
      // Proactively ensure the session is fresh for authenticated feeds
      if (feedType === 'following' || feedType === 'campus') {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
          // If the session is gone, stop and likely let the UI redirect to login
          setIsFetching(false);
          setLoading(false);
          return;
        }
      }

      let finalPosts: any[] = [];
      let isCached = false;

      switch (feedType) {
        case 'following':
          const { data: followData, error: followError } = await supabase.rpc('get_feed_posts')
            .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);
          if (followError) throw followError;
          finalPosts = followData || [];
          break;
        case 'campus':
          if (!profile?.campus) throw new Error("Campus not defined for user.");
          const { data: campusData, error: campusError } = await supabase.rpc('get_campus_feed', { p_campus: profile.campus })
            .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);
          if (campusError) throw campusError;
          finalPosts = campusData || [];
          break;
        case 'foryou':
        default:
          // Use our new Redis-cached API for the public feed
          const response = await fetch(`/api/feed/public?page=${currentPage}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Failed to fetch feed");
          finalPosts = result.posts || [];
          isCached = result.fromCache;

          if (isCached) {
            console.log(`%c[Redis] Feed Cache HIT (Page ${currentPage})`, 'color: #00ff00; font-weight: bold;');
          } else {
            console.log(`%c[Supabase] Feed Cache MISS (Page ${currentPage})`, 'color: #ff9900; font-weight: bold;');
          }
          break;
      }

      const formattedPosts: FeedItem[] = finalPosts.map((item: any) => {
        if ('item_type' in item && 'item_data' in item && item.item_data && typeof item.item_data === 'object' && 'id' in item.item_data) {
          return { ...item, id: (item.item_data as { id: string }).id } as FeedItem;
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
          } as FeedItem;
        }
      });

      setFeedData(prev => {
        const existingPosts = loadMore ? prev[feedType].posts : [];
        const allPosts: FeedItem[] = [...existingPosts, ...formattedPosts];

        // Ensure uniqueness by a composite key of type and id
        const uniquePostsMap = new Map<string, FeedItem>();
        allPosts.forEach((item: any) => {
          const type = ('item_type' in item) ? item.item_type : 'post';
          const itemId = item.id || (item.item_data && item.item_data.id);
          const compositeKey = `${type}-${itemId}`;
          if (itemId) {
            uniquePostsMap.set(compositeKey, item as FeedItem);
          }
        });

        const uniquePosts = Array.from(uniquePostsMap.values());

        return {
          ...prev,
          [feedType]: {
            posts: uniquePosts,
            page: currentPage,
            hasMore: formattedPosts.length === POSTS_PER_PAGE,
          }
        };
      });

    } catch (err: unknown) {
      console.error(`Error fetching '${feedType}' feed:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setIsFetching(false);
      fetchingRef.current = false;
    }
  }, [user?.id, profile?.campus, feedType, feedData]);

  useEffect(() => {
    // Only trigger if we have a user and haven't fetched this feed yet
    if (user?.id && feedData[feedType].page === -1 && !isFetching) {
      fetchPosts(false);
    }
  }, [feedType, user?.id]); // Removed feedData and fetchPosts from deps to prevent loops

  // --- THIS IS THE FIX ---
  // Instead of optimistically adding the post, we now force a clean refetch of the current feed.
  // This is more robust and guarantees no duplicates.
  const addPostToContext = (newPost: FeedItem) => {
    // Check for @rock mention
    if ('content' in newPost && newPost.content) {
      import('@/utils/aiUtils').then(({ checkForAiMention }) => {
        checkForAiMention(newPost as PostType);
      });
    }

    // To give immediate feedback, we can clear the posts for the current feed
    // and reset its page count, which will trigger a fresh load.
    setFeedData(prev => ({
      ...prev,
      foryou: { ...prev.foryou, posts: [], page: -1 },
      following: { ...prev.following, posts: [], page: -1 },
      campus: { ...prev.campus, posts: [], page: -1 },
    }));
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