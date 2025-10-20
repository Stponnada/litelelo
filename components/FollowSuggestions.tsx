// src/components/FollowSuggestions.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { FollowSuggestion } from '../types';
import Spinner from './Spinner';

const FollowSuggestionCard: React.FC<{ user: FollowSuggestion; onFollow: (userId: string) => void }> = ({ user, onFollow }) => (
  <div className="flex items-center space-x-3 p-3 group">
    <Link to={`/profile/${user.username}`}>
      <img 
        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=10b981&color=fff`} 
        alt={user.username} 
        className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all" 
      />
    </Link>
    <div className="flex-1 min-w-0">
      <Link to={`/profile/${user.username}`} className="font-semibold text-text-main-light dark:text-text-main text-sm hover:text-brand-green transition-colors truncate block">
        {user.full_name}
      </Link>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary truncate">@{user.username}</p>
    </div>
    <button
      onClick={() => onFollow(user.user_id)}
      className="bg-brand-green text-black font-semibold py-1.5 px-4 rounded-full text-xs hover:bg-brand-green-darker hover:scale-105 active:scale-95 transition-all"
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
            setLoading(true);
            try {
                // --- THIS IS THE FIX ---
                // The RPC was named incorrectly. The correct RPC is `get_search_recommendations`,
                // which returns an object containing multiple recommendation types.
                const { data, error } = await supabase.rpc('get_search_recommendations');
                if (error) throw error;
                // We extract the `follow_suggestions` array from the returned data object.
                setSuggestions(data?.follow_suggestions || []);
            } catch (error) {
                console.error("Error fetching follow suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

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