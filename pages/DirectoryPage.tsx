// src/pages/DirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { DirectoryProfile, Profile } from '../types';
import Spinner from '../components/Spinner';
import UserCard from '../components/UserCard';

type TabType = 'users' | 'communities';

const DirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase.rpc('get_unified_directory');
        if (fetchError) throw fetchError;
        setProfiles(data as DirectoryProfile[] || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  useEffect(() => {
    const fetchFollowStats = async () => {
      if (!currentUser) return;
      
      try {
        // Get following count
        const { count: followingCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', currentUser.id);
        
        // Get followers count
        const { count: followersCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', currentUser.id);
        
        setFollowStats({
          following: followingCount || 0,
          followers: followersCount || 0
        });
      } catch (err) {
        console.error('Failed to fetch follow stats:', err);
      }
    };
    
    fetchFollowStats();
  }, [currentUser]);
  
  const handleFollowToggle = async (profileToToggle: DirectoryProfile) => {
    if (!currentUser || profileToToggle.type !== 'user') return;
    setTogglingFollowId(profileToToggle.id);
    const isCurrentlyFollowing = profileToToggle.is_following;
    const currentFollowerCount = profileToToggle.follower_count || 0;

    setProfiles(currentProfiles => 
      currentProfiles.map(p => 
        p.id === profileToToggle.id
          ? {
              ...p,
              is_following: !isCurrentlyFollowing,
              follower_count: isCurrentlyFollowing ? currentFollowerCount - 1 : currentFollowerCount + 1
            }
          : p
      )
    );

    // Update follow stats optimistically
    setFollowStats(prev => ({
      ...prev,
      following: isCurrentlyFollowing ? prev.following - 1 : prev.following + 1
    }));

    try {
      if (isCurrentlyFollowing) {
        await supabase.from('followers').delete().match({
          follower_id: currentUser.id,
          following_id: profileToToggle.id,
        });
      } else {
        await supabase.from('followers').insert({
          follower_id: currentUser.id,
          following_id: profileToToggle.id,
        });
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      setProfiles(currentProfiles => 
        currentProfiles.map(p => 
          p.id === profileToToggle.id ? profileToToggle : p
        )
      );
      // Revert follow stats on error
      setFollowStats(prev => ({
        ...prev,
        following: isCurrentlyFollowing ? prev.following + 1 : prev.following - 1
      }));
    } finally {
      setTogglingFollowId(null);
    }
  };

  const handleMessageUser = (profile: Profile) => {
    navigate('/chat', { state: { recipient: profile } });
  };
  
  const filteredProfiles = useMemo(() => {
    let filtered = profiles;
    
    // Filter by tab type
    filtered = filtered.filter(p => 
      activeTab === 'users' ? p.type === 'user' : p.type === 'community'
    );
        
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [profiles, searchQuery, activeTab]);

  const userCount = useMemo(() => profiles.filter(p => p.type === 'user').length, [profiles]);
  const communityCount = useMemo(() => profiles.filter(p => p.type === 'community').length, [profiles]);

  if (loading) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Spinner />
        <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">Loading community...</p>
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
              <p className="text-red-400 font-bold text-lg mb-2">Unable to load directory</p>
              <p className="text-red-300/70 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    ); 
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-transparent via-brand-green/5 to-transparent dark:via-brand-green/10">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-12 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-transparent dark:from-brand-green/30 blur-3xl -z-10 opacity-30"></div>
          <h1 className="text-5xl md:text-6xl font-black text-text-main-light dark:text-text-main mb-3 tracking-tight">
            Community Directory
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary text-lg md:text-xl">
            Discover amazing people and communities
          </p>
        </div>

        {/* Follow Stats - Only show if user is logged in */}
        {currentUser && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex gap-3 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm border-2 border-tertiary-light/50 dark:border-tertiary/50 rounded-2xl p-4 shadow-lg shadow-black/5 dark:shadow-black/20">
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-xl border border-brand-green/20">
                <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="text-left">
                  <div className="text-2xl font-bold text-text-main-light dark:text-text-main leading-none">{followStats.following}</div>
                  <div className="text-xs text-text-secondary-light dark:text-text-secondary font-medium">Following</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-xl border border-brand-green/20">
                <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <div className="text-left">
                  <div className="text-2xl font-bold text-text-main-light dark:text-text-main leading-none">{followStats.followers}</div>
                  <div className="text-xs text-text-secondary-light dark:text-text-secondary font-medium">Followers</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex bg-white/60 dark:bg-secondary/60 backdrop-blur-sm border-2 border-tertiary-light/50 dark:border-tertiary/50 rounded-2xl p-2 shadow-lg shadow-black/5 dark:shadow-black/20">
            <button
              onClick={() => setActiveTab('users')}
              className={`relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30'
                  : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span>Users</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'users'
                    ? 'bg-white/20'
                    : 'bg-brand-green/20 text-brand-green'
                }`}>
                  {userCount}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('communities')}
              className={`relative px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'communities'
                  ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30'
                  : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Communities</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'communities'
                    ? 'bg-white/20'
                    : 'bg-brand-green/20 text-brand-green'
                }`}>
                  {communityCount}
                </span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-2xl mx-auto w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 to-brand-green/5 rounded-2xl blur-xl"></div>
            <div className="relative">
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={`Search ${activeTab === 'users' ? 'users' : 'communities'} by name, @username, or bio...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-5 py-4 bg-white/80 dark:bg-secondary/80 backdrop-blur-sm border-2 border-tertiary-light/50 dark:border-tertiary/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all shadow-lg shadow-black/5 dark:shadow-black/20 placeholder:text-text-tertiary-light/60 dark:placeholder:text-text-tertiary/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
        
        {/* Results Section */}
        <div className="relative">
          {filteredProfiles.length > 0 ? (
            <>
              {searchQuery && (
                <div className="mb-6 px-1">
                  <p className="text-text-secondary-light dark:text-text-secondary text-sm">
                    Found <span className="font-semibold text-text-main-light dark:text-text-main">{filteredProfiles.length}</span> result{filteredProfiles.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div className="grid gap-5">
                {filteredProfiles.map((profile, index) => (
                  <div 
                    key={profile.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-[1.01] transition-transform"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
                  >
                    <UserCard 
                      profile={profile} 
                      isCurrentUser={currentUser?.id === profile.id}
                      isToggling={togglingFollowId === profile.id}
                      onFollowToggle={handleFollowToggle}
                      onMessage={() => handleMessageUser(profile as any)}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-32 px-6">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-brand-green/20 blur-2xl rounded-full"></div>
                <div className="relative w-24 h-24 mx-auto rounded-full bg-secondary-light dark:bg-secondary border-2 border-tertiary-light dark:border-tertiary flex items-center justify-center">
                  <svg className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main mb-3">
                No matches found
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary max-w-md mx-auto">
                {searchQuery ? (
                  <>
                    We couldn't find any {activeTab === 'users' ? 'users' : 'communities'} matching{' '}
                    <span className="font-semibold text-text-main-light dark:text-text-main">"{searchQuery}"</span>
                  </>
                ) : (
                  <>No {activeTab === 'users' ? 'users' : 'communities'} found in this category</>
                )}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-green/20"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryPage;