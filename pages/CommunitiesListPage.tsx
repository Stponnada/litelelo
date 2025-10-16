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
            className="relative group animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
        >
            {/* Animated gradient background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-green/20 via-brand-green/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative bg-white/60 dark:bg-secondary/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-hover:-translate-y-1">
                {/* Top section with avatar and info */}
                <div className="p-8 pb-6">
                    <div className="flex items-start gap-6 mb-5">
                        {/* Avatar with glow effect */}
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <img 
                                src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=3cfba2&color=000`} 
                                alt={community.name} 
                                className="relative w-20 h-20 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-lg"
                            />
                        </div>
                        
                        {/* Community info */}
                        <div className="flex-1 min-w-0 pt-1">
                            <Link to={`/communities/${community.id}`} className="block group/link mb-3">
                                <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main group-hover/link:text-brand-green transition-colors leading-tight">
                                    {community.name}
                                </h3>
                            </Link>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <UserGroupIcon className="w-4 h-4 text-brand-green" />
                                <span className="text-sm font-semibold text-text-main-light dark:text-text-main">{community.member_count}</span>
                                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary">{community.member_count === 1 ? 'member' : 'members'}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 leading-relaxed mb-6">
                        {community.description || 'No description provided.'}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Link 
                            to={`/communities/${community.id}`} 
                            className="flex-1 text-center py-3 px-4 text-sm font-bold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-main-light dark:text-text-main rounded-xl transition-all border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 group/view"
                        >
                            <span className="inline-flex items-center gap-2">
                                View
                                <svg className="w-4 h-4 group-hover/view:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </Link>
                        <button 
                            onClick={() => onJoinToggle(community.id, community.is_member)}
                            className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all border ${
                                community.is_member 
                                    ? 'bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/30' 
                                    : 'bg-brand-green/15 text-brand-green hover:bg-brand-green/25 border-brand-green/20 hover:border-brand-green/30 shadow-lg shadow-brand-green/10'
                            }`}
                        >
                            {community.is_member ? 'Leave' : 'Join'}
                        </button>
                    </div>
                </div>
                
                {/* Bottom accent line */}
                <div className="h-1 bg-gradient-to-r from-brand-green/50 via-brand-green/20 to-transparent"></div>
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
                <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center ring-1 ring-red-500/20">
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
        <div className="w-full min-h-screen">
            {/* Ambient background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {isCreateModalOpen && profile?.campus && (
                    <CreateCommunityModal
                        campus={profile.campus}
                        onClose={() => setCreateModalOpen(false)}
                        onCommunityCreated={handleCommunityCreated}
                    />
                )}
                
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-sm font-semibold mb-6">
                                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></div>
                                Campus Communities
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-text-main-light dark:text-text-main mb-4 tracking-tight leading-none flex flex-wrap items-center gap-4">
                                <span>Find Your</span>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full"></div>
                                    <UserGroupIcon className="relative w-16 lg:w-20 h-16 lg:h-20 text-brand-green" />
                                </div>
                                <br className="w-full" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-green/60">Community</span>
                            </h1>
                            <p className="text-xl text-text-secondary-light dark:text-text-secondary max-w-2xl">
                                Connect with <span className="font-bold text-brand-green">{communities.length}</span> vibrant communities on your campus
                            </p>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)} 
                            className="group relative overflow-hidden bg-brand-green hover:bg-brand-green/90 text-black font-bold py-4 px-8 rounded-2xl transition-all shadow-2xl shadow-brand-green/25 hover:shadow-brand-green/40 hover:scale-105"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative flex items-center gap-2">
                                <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Create Community
                            </span>
                        </button>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 to-transparent rounded-2xl blur-2xl"></div>
                        <div className="relative flex items-center">
                            <svg className="absolute left-6 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input 
                                type="text"
                                placeholder="Search communities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-6 py-5 bg-white/60 dark:bg-secondary/60 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green/30 transition-all shadow-xl shadow-black/5 dark:shadow-black/20 placeholder:text-text-tertiary-light/60 dark:placeholder:text-text-tertiary/60 text-lg"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-6 w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-all"
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
                            <div className="mb-8 px-2">
                                <p className="text-text-secondary-light dark:text-text-secondary">
                                    <span className="font-bold text-text-main-light dark:text-text-main text-lg">{filteredCommunities.length}</span> {filteredCommunities.length !== 1 ? 'communities' : 'community'} found
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-brand-green/20 blur-3xl rounded-full"></div>
                            <div className="relative w-32 h-32 mx-auto rounded-3xl bg-white/60 dark:bg-secondary/60 backdrop-blur-xl border border-white/20 dark:border-white/5 flex items-center justify-center shadow-2xl">
                                <UserGroupIcon className="w-16 h-16 text-text-tertiary-light dark:text-text-tertiary" />
                            </div>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-main-light dark:text-text-main mb-4">
                            {searchTerm ? 'No communities found' : 'No communities yet'}
                        </h2>
                        <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-8">
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
                                className="px-8 py-4 bg-white/60 dark:bg-secondary/60 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-secondary/80 text-text-main-light dark:text-text-main font-bold rounded-2xl transition-all shadow-xl border border-white/20 dark:border-white/5"
                            >
                                Clear search
                            </button>
                        ) : (
                            <button
                                onClick={() => setCreateModalOpen(true)}
                                className="px-8 py-4 bg-brand-green hover:bg-brand-green/90 text-black font-bold rounded-2xl transition-all shadow-2xl shadow-brand-green/25 hover:shadow-brand-green/40 hover:scale-105"
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