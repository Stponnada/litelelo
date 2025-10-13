// src/pages/CommunitiesListPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { UserGroupIcon, PlusIcon } from '../components/icons';

interface CommunityListItem {
    id: string;
    name: string;
    description: string;
    avatar_url: string | null;
    member_count: number;
    is_member: boolean;
}

const CommunityCard: React.FC<{ community: CommunityListItem, onJoinToggle: (communityId: string, isMember: boolean) => void, index: number }> = ({ community, onJoinToggle, index }) => {
    return (
        <div 
            className="bg-white/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-tertiary-light/50 dark:border-tertiary/50 flex flex-col overflow-hidden group hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
        >
            <div className="p-6 flex-grow">
                <div className="flex items-start space-x-4 mb-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-brand-green/20 blur-xl rounded-full group-hover:bg-brand-green/30 transition-colors"></div>
                        <img 
                            src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=3cfba2&color=000`} 
                            alt={community.name} 
                            className="relative w-20 h-20 rounded-2xl object-cover border-2 border-brand-green/30 shadow-lg"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <Link to={`/communities/${community.id}`} className="block group/link">
                            <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover/link:text-brand-green transition-colors truncate">
                                {community.name}
                            </h3>
                        </Link>
                        <div className="flex items-center text-sm text-text-tertiary-light dark:text-text-tertiary mt-2 bg-tertiary-light/30 dark:bg-tertiary/30 rounded-lg px-3 py-1.5 w-fit">
                            <UserGroupIcon className="w-4 h-4 mr-1.5 text-brand-green" />
                            <span className="font-semibold">{community.member_count}</span>
                            <span className="ml-1">{community.member_count === 1 ? 'member' : 'members'}</span>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary line-clamp-3 leading-relaxed">
                    {community.description || 'No description provided.'}
                </p>
            </div>
            <div className="p-4 bg-gradient-to-t from-tertiary-light/50 to-transparent dark:from-tertiary/50 rounded-b-2xl flex justify-between items-center gap-3 border-t border-tertiary-light/30 dark:border-tertiary/30">
                <Link 
                    to={`/communities/${community.id}`} 
                    className="text-sm font-bold text-brand-green hover:text-brand-green/80 transition-colors flex items-center gap-1.5 group/view"
                >
                    View Community
                    <svg className="w-4 h-4 group-hover/view:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
                <button 
                    onClick={() => onJoinToggle(community.id, community.is_member)}
                    className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md ${
                        community.is_member 
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/30 hover:border-red-500/50' 
                            : 'bg-brand-green/20 text-brand-green hover:bg-brand-green/30 border-2 border-brand-green/30 hover:border-brand-green/50'
                    }`}
                >
                    {community.is_member ? 'Leave' : 'Join'}
                </button>
            </div>
        </div>
    );
};


const CommunitiesListPage: React.FC = () => {
    const { profile } = useAuth();
    const [communities, setCommunities] = useState<CommunityListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        if (!profile?.campus) return;

        const fetchCommunities = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_communities_list', { p_campus: profile.campus });
                if (rpcError) throw rpcError;
                setCommunities(data as CommunityListItem[] || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, [profile?.campus]);
    
    const handleJoinToggle = async (communityId: string, isCurrentlyMember: boolean) => {
        if(!profile) return;

        const originalCommunities = [...communities];
        // Optimistic update
        setCommunities(prev => prev.map(c => 
            c.id === communityId 
            ? { ...c, is_member: !isCurrentlyMember, member_count: c.member_count + (!isCurrentlyMember ? 1 : -1) }
            : c
        ));

        try {
            if (isCurrentlyMember) {
                const { error } = await supabase.from('community_members').delete().match({ community_id: communityId, user_id: profile.user_id });
                if(error) throw error;
            } else {
                const { error } = await supabase.from('community_members').insert({ community_id: communityId, user_id: profile.user_id });
                if(error) throw error;
            }
        } catch (err: any) {
            console.error("Failed to toggle membership:", err);
            // Revert on error
            setCommunities(originalCommunities);
        }
    };

    const handleCommunityCreated = (newCommunity: CommunityListItem) => {
        setCommunities(prev => [newCommunity, ...prev]);
        setCreateModalOpen(false);
    }
    
    const filteredCommunities = useMemo(() => {
        return communities.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [communities, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <Spinner />
                <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">Loading communities...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-12 px-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-red-400 font-bold text-lg mb-2">Unable to load communities</p>
                            <p className="text-red-300/70 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-transparent via-brand-green/5 to-transparent dark:via-brand-green/10">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {isCreateModalOpen && profile?.campus && (
                    <CreateCommunityModal
                        campus={profile.campus}
                        onClose={() => setCreateModalOpen(false)}
                        onCommunityCreated={handleCommunityCreated}
                    />
                )}
                
                {/* Hero Section */}
                <div className="relative mb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-transparent dark:from-brand-green/30 blur-3xl -z-10 opacity-30"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black text-text-main-light dark:text-text-main mb-2 tracking-tight">
                                Communities
                            </h1>
                            <p className="text-text-secondary-light dark:text-text-secondary text-lg">
                                Discover and join{' '}
                                <span className="inline-flex items-center justify-center min-w-[3rem] h-7 px-3 rounded-full bg-brand-green/20 text-brand-green font-bold border border-brand-green/30 text-base">
                                    {communities.length}
                                </span>
                                {' '}communities on your campus
                            </p>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)} 
                            className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-black font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30 hover:scale-105 group"
                        >
                            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Create Community
                        </button>
                    </div>
                </div>
                
                {/* Search Bar */}
                <div className="mb-10">
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 to-brand-green/5 rounded-2xl blur-xl"></div>
                        <div className="relative">
                            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                type="text"
                                placeholder="Search for communities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-5 py-4 bg-white/80 dark:bg-secondary/80 backdrop-blur-sm border-2 border-tertiary-light/50 dark:border-tertiary/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all shadow-lg shadow-black/5 dark:shadow-black/20 placeholder:text-text-tertiary-light/60 dark:placeholder:text-text-tertiary/60"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-tertiary-light/50 dark:bg-tertiary/50 hover:bg-tertiary-light dark:hover:bg-tertiary flex items-center justify-center transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Communities Grid */}
                {filteredCommunities.length > 0 ? (
                    <>
                        {searchTerm && (
                            <div className="mb-6 px-1">
                                <p className="text-text-secondary-light dark:text-text-secondary text-sm">
                                    Found <span className="font-semibold text-text-main-light dark:text-text-main">{filteredCommunities.length}</span> communit{filteredCommunities.length !== 1 ? 'ies' : 'y'}
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCommunities.map((community, index) => (
                                <CommunityCard 
                                    key={community.id} 
                                    community={community} 
                                    onJoinToggle={handleJoinToggle}
                                    index={index}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-32 px-6">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-brand-green/20 blur-2xl rounded-full"></div>
                            <div className="relative w-24 h-24 mx-auto rounded-full bg-secondary-light dark:bg-secondary border-2 border-tertiary-light dark:border-tertiary flex items-center justify-center">
                                <UserGroupIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary" />
                            </div>
                        </div>
                        <p className="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main mb-3">
                            {searchTerm ? 'No communities found' : 'No communities yet'}
                        </p>
                        <p className="text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-6">
                            {searchTerm ? (
                                <>
                                    We couldn't find any communities matching{' '}
                                    <span className="font-semibold text-text-main-light dark:text-text-main">"{searchTerm}"</span>
                                </>
                            ) : (
                                'Be the first to create a community on your campus!'
                            )}
                        </p>
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-black font-semibold rounded-xl transition-colors shadow-lg shadow-brand-green/20"
                            >
                                Clear search
                            </button>
                        ) : (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-black font-semibold rounded-xl transition-colors shadow-lg shadow-brand-green/20"
                            >
                                Create First Community
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunitiesListPage;