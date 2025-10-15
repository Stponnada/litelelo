// src/pages/SearchPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SearchResults as SearchResultsType, RecommendedContent, FollowSuggestion, TrendingPost, TrendingPoll } from '../types';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

// --- NEW SUB-COMPONENTS for Recommendations ---

const FollowSuggestionCard: React.FC<{ user: FollowSuggestion; onFollow: (userId: string) => void }> = ({ user, onFollow }) => (
  <div className="flex items-center space-x-3 p-3">
    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
    <div className="flex-1 min-w-0">
      <Link to={`/profile/${user.username}`} className="font-semibold text-text-main-light dark:text-text-main text-md hover:underline truncate block">{user.full_name}</Link>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">@{user.username}</p>
    </div>
    <button
      onClick={() => onFollow(user.user_id)}
      className="bg-brand-green text-black font-bold py-2 px-4 rounded-full text-sm hover:bg-brand-green-darker transition-colors"
    >
      Follow
    </button>
  </div>
);

const TrendingPostCard: React.FC<{ post: TrendingPost | TrendingPoll }> = ({ post }) => (
  <Link to={`/post/${post.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 transition-colors">
    <p className="text-md text-text-secondary-light dark:text-text-secondary line-clamp-2">"{post.content}"</p>
    <div className="flex items-center space-x-2 mt-2">
      <img src={post.author_avatar_url || ''} alt={post.author_username || ''} className="w-6 h-6 rounded-full object-cover" />
      <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">
        by {post.author_name}
        {'like_count' in post && <span className="ml-2">· {post.like_count} likes</span>}
        {'total_votes' in post && <span className="ml-2">· {post.total_votes} votes</span>}
      </span>
    </div>
  </Link>
);


const SearchPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(false);
    
    // State for recommendations
    const [recommendations, setRecommendations] = useState<RecommendedContent | null>(null);
    const [recsLoading, setRecsLoading] = useState(true);

    // Fetch recommendations on component mount
    useEffect(() => {
        const fetchRecommendations = async () => {
            setRecsLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_search_recommendations');
                if (error) throw error;
                setRecommendations(data);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setRecsLoading(false);
            }
        };
        fetchRecommendations();
    }, []);
    
    // Handle search input changes
    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults(null);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_all', { search_term: searchTerm.trim() });
                if (error) throw error;
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const handleFollow = async (userIdToFollow: string) => {
        if (!user) return;
        // Optimistic update: remove the user from the suggestion list
        setRecommendations(prev => {
            if (!prev) return null;
            return {
                ...prev,
                follow_suggestions: prev.follow_suggestions.filter(u => u.user_id !== userIdToFollow),
            };
        });
        
        // Backend call
        await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
    };

    const hasResults = results && (results.users.length > 0 || results.posts.length > 0);
    const showRecommendations = searchTerm.trim().length === 0;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main mb-4">Search</h1>
                <input
                    type="text"
                    placeholder="Search for users, posts, and more..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-secondary-light dark:bg-secondary border-2 border-tertiary-light dark:border-tertiary rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    autoFocus
                />
            </div>
            
            <main>
                {showRecommendations ? (
                    // --- RECOMMENDATIONS UI ---
                    recsLoading ? (
                        <div className="p-8 flex justify-center"><Spinner /></div>
                    ) : recommendations && (
                        <div className="space-y-8 animate-fadeIn">
                            {recommendations.follow_suggestions.length > 0 && (
                                <div className="p-4 bg-secondary-light dark:bg-secondary rounded-lg">
                                    <h3 className="text-md font-bold text-text-main-light dark:text-text-main px-3 pt-2 pb-2">Who to follow</h3>
                                    <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                                        {recommendations.follow_suggestions.map(u => <FollowSuggestionCard key={u.user_id} user={u} onFollow={handleFollow} />)}
                                    </div>
                                </div>
                            )}
                            {recommendations.trending_posts.length > 0 && (
                                <div className="p-4 bg-secondary-light dark:bg-secondary rounded-lg">
                                    <h3 className="text-md font-bold text-text-main-light dark:text-text-main px-3 pt-2 pb-2">Trending Posts</h3>
                                    <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                                        {recommendations.trending_posts.map(p => <TrendingPostCard key={p.id} post={p} />)}
                                    </div>
                                </div>
                            )}
                             {recommendations.trending_polls.length > 0 && (
                                <div className="p-4 bg-secondary-light dark:bg-secondary rounded-lg">
                                    <h3 className="text-md font-bold text-text-main-light dark:text-text-main px-3 pt-2 pb-2">Trending Polls</h3>
                                    <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                                        {recommendations.trending_polls.map(p => <TrendingPostCard key={p.id} post={p} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    // --- SEARCH RESULTS UI ---
                    loading ? (
                        <div className="p-8 flex justify-center"><Spinner /></div>
                    ) : !hasResults ? (
                        <p className="text-center text-text-tertiary-light dark:text-text-tertiary p-8">
                            No results for "{searchTerm}"
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {results.users.length > 0 && (
                                <div className="p-4 bg-secondary-light dark:bg-secondary rounded-lg">
                                    <h3 className="text-sm font-bold text-text-tertiary-light dark:text-text-tertiary uppercase px-3 pt-2 pb-1">Users</h3>
                                    <ul>
                                        {results.users.map(user => (
                                        <li key={user.username}>
                                            <Link to={`/profile/${user.username}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary">
                                            <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                                            <div>
                                                <p className="font-semibold text-text-main-light dark:text-text-main text-md">{user.full_name}</p>
                                                <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{user.username}</p>
                                            </div>
                                            </Link>
                                        </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {results.posts.length > 0 && (
                                <div className="p-4 bg-secondary-light dark:bg-secondary rounded-lg">
                                    <h3 className="text-sm font-bold text-text-tertiary-light dark:text-text-tertiary uppercase px-3 pt-2 pb-1">Posts & Comments</h3>
                                    <ul>
                                        {results.posts.map(post => (
                                        <li key={post.id}>
                                            <Link to={`/post/${post.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary">
                                            <p className="text-md text-text-secondary-light dark:text-text-secondary truncate">"{post.content}"</p>
                                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">by {post.author_full_name}</p>
                                            </Link>
                                        </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default SearchPage;