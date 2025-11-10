// src/components/GlobalSearchBar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SearchResults as SearchResultsType } from '../types';
import SearchResults from './SearchResults'; // The dropdown component
import { XCircleIcon } from './icons';

const GlobalSearchBar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

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
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            if (isFocused) {
                performSearch();
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, isFocused]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = () => {
        setIsFocused(false);
        setSearchTerm('');
    };

    const handleViewAll = () => {
        handleNavigate();
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    };
    
    const hasResults = results && (results.users.length > 0 || results.posts.length > 0 || results.communities.length > 0 || results.listings.length > 0 || results.events.length > 0);

    return (
        <div className="relative w-full max-w-xl mx-auto" ref={searchRef}>
            <div className="relative" style={{ zIndex: 50 }}>
                <input
                    type="text"
                    placeholder="Search litelelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    className={`w-full pl-10 pr-10 py-3 bg-secondary-light dark:bg-secondary border-2 rounded-full text-base transition-all shadow-lg hover:shadow-xl focus:outline-none ${
                        isFocused 
                        ? 'border-brand-green ring-2 ring-brand-green/30 ring-offset-1 ring-offset-secondary-light dark:ring-offset-secondary' 
                        : 'border-tertiary-light dark:border-tertiary hover:border-brand-green/50'
                    }`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <XCircleIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    </button>
                )}
            </div>

            {isFocused && searchTerm.length > 1 && (
                <>
                    <div className="fixed top-0 left-0 right-0 bottom-0" style={{ zIndex: 40 }} onClick={() => setIsFocused(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2" style={{ zIndex: 50 }}>
                        <div className="bg-secondary-light/95 dark:bg-secondary/95 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border-2 border-tertiary-light dark:border-tertiary">
                            <SearchResults results={results} loading={loading} onNavigate={handleNavigate} />
                            {hasResults && (
                                <button 
                                    onClick={handleViewAll}
                                    className="w-full text-center py-3 bg-secondary-light dark:bg-secondary border-t-2 border-tertiary-light dark:border-tertiary text-sm font-semibold text-brand-green hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
                                >
                                    View all results
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GlobalSearchBar;