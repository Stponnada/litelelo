// src/pages/SearchPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SearchResults as SearchResultsType, RecommendedContent, FollowSuggestion, TrendingPost, TrendingPoll } from '../types';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';

// --- Enhanced Sub-Components ---

const FollowSuggestionCard: React.FC<{ user: FollowSuggestion; onFollow: (userId: string) => void }> = ({ user, onFollow }) => (
  <div className="flex items-center space-x-4 p-4 hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30 transition-all rounded-lg group">
    <div className="relative">
      <img 
        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=10b981&color=fff`} 
        alt={user.username} 
        className="w-14 h-14 rounded-full object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green transition-all" 
      />
    </div>
    <div className="flex-1 min-w-0">
      <Link to={`/profile/${user.username}`} className="font-semibold text-text-main-light dark:text-text-main text-base hover:text-brand-green transition-colors truncate block">
        {user.full_name}
      </Link>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">@{user.username}</p>
    </div>
    <button
      onClick={() => onFollow(user.user_id)}
      className="bg-brand-green text-black font-semibold py-2.5 px-5 rounded-full text-sm hover:bg-brand-green-darker hover:scale-105 active:scale-95 transition-all shadow-sm hover:shadow-md"
    >
      Follow
    </button>
  </div>
);

const TrendingPostCard: React.FC<{ post: TrendingPost | TrendingPoll }> = ({ post }) => (
  <Link 
    to={`/post/${post.id}`} 
    className="block p-4 rounded-lg hover:bg-tertiary-light/40 dark:hover:bg-tertiary/40 transition-all group border-l-4 border-transparent hover:border-brand-green"
  >
    <p className="text-base text-text-main-light dark:text-text-main line-clamp-2 mb-3 group-hover:text-brand-green transition-colors">
      {post.content}
    </p>
    <div className="flex items-center space-x-3">
      <img 
        src={post.author_avatar_url || `https://ui-avatars.com/api/?name=${post.author_name}&background=6b7280&color=fff`} 
        alt={post.author_username || ''} 
        className="w-7 h-7 rounded-full object-cover ring-1 ring-tertiary-light dark:ring-tertiary" 
      />
      <div className="flex items-center flex-wrap text-sm text-text-secondary-light dark:text-text-secondary gap-2">
        <span className="font-medium">{post.author_name}</span>
        {'like_count' in post && (
          <span className="flex items-center gap-1">
            <span className="text-text-tertiary-light dark:text-text-tertiary">·</span>
            <span className="font-semibold text-brand-green">{post.like_count}</span> likes
          </span>
        )}
        {'total_votes' in post && (
          <span className="flex items-center gap-1">
            <span className="text-text-tertiary-light dark:text-text-tertiary">·</span>
            <span className="font-semibold text-brand-green">{post.total_votes}</span> votes
          </span>
        )}
      </div>
    </div>
  </Link>
);

const SearchPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [recommendations, setRecommendations] = useState<RecommendedContent | null>(null);
    const [recsLoading, setRecsLoading] = useState(true);

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
        setRecommendations(prev => {
            if (!prev) return null;
            return {
                ...prev,
                follow_suggestions: prev.follow_suggestions.filter(u => u.user_id !== userIdToFollow),
            };
        });
        
        await supabase.from('followers').insert({ follower_id: user.id, following_id: userIdToFollow });
    };

    const hasResults = results && (results.users.length > 0 || results.posts.length > 0);
    const showRecommendations = searchTerm.trim().length === 0;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main mb-2 bg-gradient-to-r from-brand-green to-brand-green-darker bg-clip-text text-transparent">
                    Discover
                </h1>
                <p className="text-text-secondary-light dark:text-text-secondary mb-6">
                    Search for users, posts, and trending content
                </p>
                
                {/* Enhanced Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search for users, posts, and more..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-secondary-light dark:bg-secondary border-2 border-tertiary-light dark:border-tertiary rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all shadow-sm hover:shadow-md"
                        autoFocus
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            
            <main>
                {showRecommendations ? (
                    recsLoading ? (
                        <div className="p-12 flex justify-center"><Spinner /></div>
                    ) : recommendations && (
                        <div className="space-y-6 animate-fadeIn">
                            {recommendations.follow_suggestions.length > 0 && (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-md overflow-hidden border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50 bg-gradient-to-r from-transparent to-brand-green/5">
                                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main flex items-center gap-2">
                                            <svg className="w-5 h-5 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                            </svg>
                                            Who to Follow
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
                                        {recommendations.follow_suggestions.map(u => (
                                            <FollowSuggestionCard key={u.user_id} user={u} onFollow={handleFollow} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {recommendations.trending_posts.length > 0 && (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-md overflow-hidden border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50 bg-gradient-to-r from-transparent to-brand-green/5">
                                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main flex items-center gap-2">
                                            <svg className="w-5 h-5 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                            </svg>
                                            Trending Posts
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
                                        {recommendations.trending_posts.map(p => (
                                            <TrendingPostCard key={p.id} post={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {recommendations.trending_polls.length > 0 && (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-md overflow-hidden border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="px-6 py-4 border-b border-tertiary-light/50 dark:border-tertiary/50 bg-gradient-to-r from-transparent to-brand-green/5">
                                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main flex items-center gap-2">
                                            <svg className="w-5 h-5 text-brand-green" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                            </svg>
                                            Trending Polls
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
                                        {recommendations.trending_polls.map(p => (
                                            <TrendingPostCard key={p.id} post={p} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    loading ? (
                        <div className="p-12 flex justify-center"><Spinner /></div>
                    ) : !hasResults ? (
                        <div className="text-center py-16">
                            <svg className="mx-auto h-16 w-16 text-text-tertiary-light dark:text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg text-text-tertiary-light dark:text-text-tertiary">
                                No results found for <span className="font-semibold text-text-secondary-light dark:text-text-secondary">"{searchTerm}"</span>
                            </p>
                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-2">
                                Try searching for something else
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {results.users.length > 0 && (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-md overflow-hidden border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="px-6 py-3 border-b border-tertiary-light/50 dark:border-tertiary/50">
                                        <h3 className="text-sm font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider">
                                            Users · {results.users.length}
                                        </h3>
                                    </div>
                                    <ul className="divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
                                        {results.users.map(user => (
                                            <li key={user.username}>
                                                <Link 
                                                    to={`/profile/${user.username}`} 
                                                    className="flex items-center space-x-4 p-4 hover:bg-tertiary-light/40 dark:hover:bg-tertiary/40 transition-all group"
                                                >
                                                    <img 
                                                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=10b981&color=fff`} 
                                                        alt={user.username} 
                                                        className="w-14 h-14 rounded-full object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green transition-all" 
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-text-main-light dark:text-text-main text-base group-hover:text-brand-green transition-colors">
                                                            {user.full_name}
                                                        </p>
                                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{user.username}</p>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {results.posts.length > 0 && (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-md overflow-hidden border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="px-6 py-3 border-b border-tertiary-light/50 dark:border-tertiary/50">
                                        <h3 className="text-sm font-bold text-text-tertiary-light dark:text-text-tertiary uppercase tracking-wider">
                                            Posts & Comments · {results.posts.length}
                                        </h3>
                                    </div>
                                    <ul className="divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
                                        {results.posts.map(post => (
                                            <li key={post.id}>
                                                <Link 
                                                    to={`/post/${post.id}`} 
                                                    className="block p-4 hover:bg-tertiary-light/40 dark:hover:bg-tertiary/40 transition-all group border-l-4 border-transparent hover:border-brand-green"
                                                >
                                                    <p className="text-base text-text-main-light dark:text-text-main line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
                                                        {post.content}
                                                    </p>
                                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                                                        by <span className="font-medium">{post.author_full_name}</span>
                                                    </p>
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