// src/components/FollowSuggestions.tsx

import React, { useState, useEffect } from 'react';
// FIXED: Use Next.js Link
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { FollowSuggestion } from '../types';
import Spinner from './Spinner';

const FollowSuggestionCard: React.FC<{ user: FollowSuggestion; onFollow: (userId: string) => void }> = ({ user, onFollow }) => (
  <div className="flex items-center space-x-2 p-2 group">
    {/* FIXED: to -> href */}
    <Link href={`/profile/${user.username}`}>
      <Image
        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random&color=fff&bold=true`}
        alt={user.username}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all"
        unoptimized
      />
    </Link>
    <div className="flex-1 min-w-0">
      {/* FIXED: to -> href */}
      <Link href={`/profile/${user.username}`} className="font-semibold text-text-main-light dark:text-text-main text-sm hover:text-brand-green transition-colors truncate block">
        {user.full_name}
      </Link>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary truncate">@{user.username}</p>
    </div>
    <button
      onClick={() => onFollow(user.user_id)}
      className="bg-brand-green text-black font-semibold py-1 px-3 rounded-full text-xs hover:bg-brand-green-darker hover:scale-105 active:scale-95 transition-all"
    >
      Follow
    </button>
  </div>
);

const FollowSuggestions: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/suggestions/follow?userId=${user.id}`);
        const result = await response.json();

        if (response.ok) {
          if (result.fromCache) {
            console.log(`%c[Redis] Suggestions Cache HIT (v3) - count: ${result.suggestions?.length || 0}`, 'color: #00ff00; font-weight: bold;');
          } else {
            console.log(`%c[Supabase] Suggestions Cache MISS (v3) - count: ${result.suggestions?.length || 0}`, 'color: #ff9900; font-weight: bold;');
          }
          setSuggestions(result.suggestions || []);
        } else {
          // Fallback
          const { data, error } = await supabase.rpc('get_follow_suggestions');
          if (error) throw error;
          setSuggestions(data || []);
        }
      } catch (error) {
        console.error("Error fetching follow suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user?.id]);

  const handleFollow = async (userIdToFollow: string) => {
    if (!user) return;

    // Optimistic update: remove from suggestions list immediately
    setSuggestions(prev => prev.filter(u => u.user_id !== userIdToFollow));

    // Asynchronous call to the database
    await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4 h-48 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show the widget if there are no suggestions
  }

  return (
    <div className="bg-white dark:bg-secondary rounded-2xl border border-gray-200 dark:border-tertiary p-4">
      <h3 className="font-semibold text-text-main-light dark:text-text-main mb-3">Who to Follow</h3>
      <div className="space-y-1">
        {suggestions.map(s => (
          <FollowSuggestionCard key={s.user_id} user={s} onFollow={handleFollow} />
        ))}
      </div>
    </div>
  );
};

export default FollowSuggestions;