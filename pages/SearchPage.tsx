// src/pages/SearchPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SearchResults as SearchResultsType, UserSearchResult, PostSearchResult, CommunitySearchResult, ListingSearchResult, EventSearchResult } from '../types';
import Spinner from '../components/Spinner';
import { format } from 'date-fns';

// --- Reusable Result Card Components ---

const UserResultCard: React.FC<{ user: UserSearchResult }> = ({ user }) => (
    <Link to={`/profile/${user.username}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{user.full_name}</p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary">@{user.username}</p>
        </div>
    </Link>
);

const PostResultCard: React.FC<{ post: PostSearchResult }> = ({ post }) => (
    <Link to={`/post/${post.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <p className="text-text-secondary-light dark:text-text-secondary truncate italic">"{post.content}"</p>
        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">by {post.author_full_name}</p>
    </Link>
);

const CommunityResultCard: React.FC<{ community: CommunitySearchResult }> = ({ community }) => (
    <Link to={`/communities/${community.id}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <img src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}`} alt={community.name} className="w-12 h-12 rounded-lg object-cover" />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{community.name}</p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary">{community.member_count} members</p>
        </div>
    </Link>
);

const ListingResultCard: React.FC<{ listing: ListingSearchResult }> = ({ listing }) => (
    <Link to="/campus/marketplace" state={{ selectedListingId: listing.id }} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <img src={listing.primary_image_url || 'https://placehold.co/100x100'} alt={listing.title} className="w-12 h-12 rounded-lg object-cover" />
        <div>
            <p className="font-semibold text-text-main-light dark:text-text-main">{listing.title}</p>
            <p className="text-sm font-bold text-brand-green">₹{listing.price.toLocaleString()}</p>
        </div>
    </Link>
);

const EventResultCard: React.FC<{ event: EventSearchResult }> = ({ event }) => (
    <Link to={`/campus/events/${event.id}`} className="block p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors">
        <p className="font-semibold text-text-main-light dark:text-text-main">{event.name}</p>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary">{format(new Date(event.start_time), 'PPp')}</p>
    </Link>
);

const TabButton: React.FC<{ label: string, count: number, isActive: boolean, onClick: () => void }> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${isActive ? 'bg-brand-green text-black' : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'}`}
    >
        {label}
        <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-black/20' : 'bg-tertiary-light dark:bg-tertiary'}`}>{count}</span>
    </button>
);


const SearchPage: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialQuery = queryParams.get('q') || '';

    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(!!initialQuery);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults(null);
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_all', { search_term: searchTerm.trim() });
                if (error) throw error;
                setResults(data);
                setActiveTab('all'); // Reset to 'all' tab on new search
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

    const resultCounts = useMemo(() => ({
        users: results?.users.length || 0,
        posts: results?.posts.length || 0,
        communities: results?.communities.length || 0,
        listings: results?.listings.length || 0,
        events: results?.events.length || 0,
    }), [results]);

    const totalResults = Object.values(resultCounts).reduce((sum, count) => sum + count, 0);

    const renderResults = () => {
        if (loading) return <div className="p-12 flex justify-center"><Spinner /></div>;
        if (!results || totalResults === 0) {
            return (
                <div className="text-center py-16">
                    <p className="text-text-tertiary-light dark:text-text-tertiary">
                        {searchTerm.trim().length < 2 ? "Start typing to search..." : "No results found."}
                    </p>
                </div>
            );
        }

        // --- THE FIX: Add a 'propName' to each section ---
        const sections = [
            { key: 'users', title: 'Users', data: results.users, component: UserResultCard, propName: 'user' },
            { key: 'communities', title: 'Communities', data: results.communities, component: CommunityResultCard, propName: 'community' },
            { key: 'listings', title: 'Marketplace', data: results.listings, component: ListingResultCard, propName: 'listing' },
            { key: 'events', title: 'Events', data: results.events, component: EventResultCard, propName: 'event' },
            { key: 'posts', title: 'Posts & Comments', data: results.posts, component: PostResultCard, propName: 'post' },
        ];

        return (
            <>
                <div className="flex flex-wrap gap-2 p-4 border-b border-tertiary-light dark:border-tertiary">
                    <TabButton label="All" count={totalResults} isActive={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                    {sections.filter(s => s.data.length > 0).map(s => (
                        <TabButton key={s.key} label={s.title} count={s.data.length} isActive={activeTab === s.key} onClick={() => setActiveTab(s.key)} />
                    ))}
                </div>

                <div className="divide-y divide-tertiary-light/50 dark:divide-tertiary/50">
                    {sections.map(({ key, title, data, component: Component, propName }) => { // <-- Destructure propName
                        if ((activeTab === 'all' || activeTab === key) && data.length > 0) {
                            return (
                                <div key={key} className="p-4">
                                    {activeTab === 'all' && <h3 className="font-bold mb-2 text-text-main-light dark:text-text-main">{title}</h3>}
                                    <div className="space-y-1">
                                        {/* --- THE FIX: Use propName to pass the correct prop --- */}
                                        {data.map((item: any) => <Component key={item.id || item.username} {...{ [propName]: item }} />)}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            </>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4 text-text-main-light dark:text-text-main">Search</h1>
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search for anything..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
                    autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-secondary-light dark:bg-secondary rounded-lg border border-tertiary-light dark:border-tertiary">
                {renderResults()}
            </div>
        </div>
    );
};

export default SearchPage;