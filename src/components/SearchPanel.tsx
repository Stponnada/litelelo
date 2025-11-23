'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from './Spinner';

interface SearchPanelProps {
    onNavigate: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onNavigate }) => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${searchTerm.trim()}%,full_name.ilike.%${searchTerm.trim()}%`)
                .limit(10);

            if (error) {
                console.error("Error searching profiles:", error);
            } else {
                setResults(data || []);
            }
            setLoading(false);
        };

        const debounceTimer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (
        <div className="flex-1 bg-white dark:bg-secondary h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6 px-3 text-text-main-light dark:text-text-main">Search</h2>
            <div className="px-3 mb-6">
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-gray-100 dark:bg-tertiary border border-gray-300 dark:border-white/10 rounded-lg text-base text-text-main-light dark:text-text-main placeholder-gray-500 focus:outline-none focus:border-brand-green"
                    autoFocus
                />
            </div>
            <div className="h-px bg-gray-200 dark:bg-white/10 mb-6" />

            <div className="flex-1 overflow-y-auto px-3">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center py-10">
                        <Spinner />
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-2 pb-4">
                        {results.map(profile => (
                            <div
                                key={profile.user_id}
                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                onClick={() => {
                                    onNavigate();
                                    router.push(`/profile/${profile.username}`);
                                }}
                            >
                                <Image
                                    src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0D8ABC&color=fff&size=50`}
                                    alt={profile.username}
                                    width={44}
                                    height={44}
                                    className="rounded-full object-cover"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-text-main-light dark:text-text-main">{profile.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-text-secondary">{profile.full_name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : searchTerm.length > 1 && (
                    <p className="text-center text-gray-500 dark:text-text-tertiary px-3">No results found.</p>
                )}
            </div>
        </div>
    );
};

export default SearchPanel;