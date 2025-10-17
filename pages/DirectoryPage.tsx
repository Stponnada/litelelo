// src/pages/DirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { DirectoryProfile, Profile } from '../types';
import Spinner from '../components/Spinner';
import UserCard from '../components/UserCard';
import { GlobeIcon } from '../components/icons';

type TabType = 'users' | 'communities';

// --- Helper Icons ---
const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
// --------------------

const DirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [allProfiles, setAllProfiles] = useState<DirectoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });

  // --- New State for Filters ---
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    admission_year: '',
    branch: '',
    gender: '',
    dorm_building: '',
    relationship_status: '',
    dining_hall: '',
  });
  const userProfiles = useMemo(() => allProfiles.filter(p => p.type === 'user'), [allProfiles]);
  // -----------------------------

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase.rpc('get_unified_directory');
        if (fetchError) throw fetchError;
        setAllProfiles((data as DirectoryProfile[]) || []);
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
        const { count: followingCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', currentUser.id);

        const { count: followersCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', currentUser.id);

        setFollowStats({
          following: followingCount || 0,
          followers: followersCount || 0,
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

    setAllProfiles((currentProfiles) =>
      currentProfiles.map((p) =>
        p.id === profileToToggle.id
          ? {
              ...p,
              is_following: !isCurrentlyFollowing,
              follower_count: isCurrentlyFollowing
                ? currentFollowerCount - 1
                : currentFollowerCount + 1,
            }
          : p
      )
    );

    setFollowStats((prev) => ({
      ...prev,
      following: isCurrentlyFollowing ? prev.following - 1 : prev.following + 1,
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
      console.error('Failed to toggle follow:', err);
      setAllProfiles((currentProfiles) =>
        currentProfiles.map((p) =>
          p.id === profileToToggle.id ? profileToToggle : p
        )
      );
      setFollowStats((prev) => ({
        ...prev,
        following: isCurrentlyFollowing ? prev.following + 1 : prev.following - 1,
      }));
    } finally {
      setTogglingFollowId(null);
    }
  };

  const handleMessageUser = (profile: Profile) => {
    navigate('/chat', { state: { recipient: profile } });
  };

  // --- Dynamic Filter Options ---
  const admissionYears = useMemo(() => [...new Set(userProfiles.map(p => p.admission_year).filter(Boolean))].sort((a, b) => b! - a!), [userProfiles]);
  const branches = useMemo(() => [...new Set(userProfiles.map(p => p.branch).filter(Boolean))].sort(), [userProfiles]);
  const dorms = useMemo(() => [...new Set(userProfiles.map(p => p.dorm_building).filter(Boolean))].sort(), [userProfiles]);
  const relationshipStatuses = useMemo(() => [...new Set(userProfiles.map(p => p.relationship_status).filter(Boolean))].sort(), [userProfiles]);
  const diningHalls = useMemo(() => [...new Set(userProfiles.map(p => p.dining_hall).filter(Boolean))].sort(), [userProfiles]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ admission_year: '', branch: '', gender: '', dorm_building: '', relationship_status: '', dining_hall: '' });
  };
  // -------------------------------

  const filteredProfiles = useMemo(() => {
    let filtered = [...allProfiles];

    filtered = filtered.filter((p) =>
      activeTab === 'users' ? p.type === 'user' : p.type === 'community'
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.username?.toLowerCase().includes(query) ||
          p.bio?.toLowerCase().includes(query)
      );
    }

    // --- Apply dropdown filters ---
    if (activeTab === 'users') {
      filtered = filtered.filter(p => 
        (!filters.admission_year || p.admission_year === parseInt(filters.admission_year)) &&
        (!filters.branch || p.branch === filters.branch) &&
        (!filters.gender || p.gender === filters.gender) &&
        (!filters.dorm_building || p.dorm_building === filters.dorm_building) &&
        (!filters.relationship_status || p.relationship_status === filters.relationship_status) &&
        (!filters.dining_hall || p.dining_hall === filters.dining_hall)
      );
    }
    // ----------------------------

    return filtered;
  }, [allProfiles, searchQuery, activeTab, filters]);

  const userCount = useMemo(
    () => allProfiles.filter((p) => p.type === 'user').length,
    [allProfiles]
  );
  const communityCount = useMemo(
    () => allProfiles.filter((p) => p.type === 'community').length,
    [allProfiles]
  );
  
  const activeFilterCount = Object.values(filters).filter(Boolean).length;


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Spinner />
        <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">
          Loading directory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-red-400 font-bold text-lg mb-2">
                Unable to load directory
              </p>
              <p className="text-red-300/70 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    // keep top-level guard to prevent page-wide horizontal scroll
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row flex-wrap items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-main-light dark:text-text-main mb-1 flex items-center gap-3 flex-wrap">
              <GlobeIcon className="w-10 h-10 md:w-12 md:h-12 text-brand-green flex-shrink-0" />
              <span>Directory</span>
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary text-sm">
              Discover people and communities
            </p>
          </div>

          {/* Tabs and stats */}
          <div className="flex flex-wrap items-center gap-3">
            {currentUser && (
              <div className="flex flex-wrap gap-2 bg-secondary-light dark:bg-secondary rounded-xl p-2 border border-tertiary-light/50 dark:border-tertiary/50">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 rounded-lg">
                  <svg
                    className="w-4 h-4 text-brand-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <div className="text-left">
                    <div className="text-base font-bold text-text-main-light dark:text-text-main leading-none">
                      {followStats.following}
                    </div>
                    <div className="text-[10px] text-text-secondary-light dark:text-text-secondary font-medium">
                      Following
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-green/10 rounded-lg">
                  <svg
                    className="w-4 h-4 text-brand-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div className="text-left">
                    <div className="text-base font-bold text-text-main-light dark:text-text-main leading-none">
                      {followStats.followers}
                    </div>
                    <div className="text-[10px] text-text-secondary-light dark:text-text-secondary font-medium">
                      Followers
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="inline-flex bg-secondary-light dark:bg-secondary rounded-xl p-1.5 border border-tertiary-light/50 dark:border-tertiary/50 flex-wrap">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-brand-green text-black shadow-md'
                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>Users</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'users'
                        ? 'bg-black/20 text-white'
                        : 'bg-brand-green/20 text-brand-green'
                    }`}
                  >
                    {userCount}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('communities')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  activeTab === 'communities'
                    ? 'bg-brand-green text-black shadow-md'
                    : 'text-text-secondary-light dark:text-text-secondary hover:text-text-main-light dark:hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>Communities</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === 'communities'
                        ? 'bg-black/20 text-white'
                        : 'bg-brand-green/20 text-brand-green'
                    }`}
                  >
                    {communityCount}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* --- New Filter Controls --- */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder={`Search ${activeTab === 'users' ? 'users' : 'communities'}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full max-w-full pl-12 pr-4 py-3 bg-secondary-light dark:bg-secondary border border-tertiary-light/50 dark:border-tertiary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-tertiary-light/50 dark:bg-tertiary/50 hover:bg-tertiary-light dark:hover:bg-tertiary flex items-center justify-center transition-colors"><XMarkIcon className="w-4 h-4" /></button>}
            </div>
            {activeTab === 'users' && (
              <button onClick={() => setShowFilters(!showFilters)} className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${showFilters ? 'bg-brand-green/20 text-brand-green' : 'bg-secondary-light dark:bg-secondary border border-tertiary-light/50 dark:border-tertiary/50'}`}>
                <FilterIcon className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 text-xs bg-brand-green text-black rounded-full flex items-center justify-center">{activeFilterCount}</span>}
              </button>
            )}
          </div>

          {showFilters && activeTab === 'users' && (
            <div className="p-4 bg-secondary-light dark:bg-secondary rounded-xl border border-tertiary-light/50 dark:border-tertiary/50 space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <select name="admission_year" value={filters.admission_year} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Batch</option>{admissionYears.map(y => <option key={y} value={y!}>{y}</option>)}</select>
                <select name="branch" value={filters.branch} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Branch</option>{branches.map(b => <option key={b} value={b}>{b}</option>)}</select>
                <select name="gender" value={filters.gender} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option></select>
                <select name="dorm_building" value={filters.dorm_building} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Dorm</option>{dorms.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select name="relationship_status" value={filters.relationship_status} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Relationship</option>{relationshipStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select name="dining_hall" value={filters.dining_hall} onChange={handleFilterChange} className="w-full p-2 bg-tertiary-light dark:bg-tertiary rounded-md text-sm"><option value="">Dining Hall</option>{diningHalls.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
              {activeFilterCount > 0 && <button onClick={resetFilters} className="text-sm text-brand-green hover:underline">Reset Filters</button>}
            </div>
          )}
        </div>

        {/* Directory List */}
        <div className="relative w-full max-w-full overflow-x-visible">
          {filteredProfiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-full">
              {filteredProfiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-w-0 w-full"
                  style={{
                    animationDelay: `${index * 30}ms`,
                    animationFillMode: 'backwards',
                  }}
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
          ) : (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-light dark:bg-secondary border-2 border-tertiary-light dark:border-tertiary flex items-center justify-center">
                <svg className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">
                No matches found
              </p>
              <p className="text-text-secondary-light dark:text-text-secondary text-sm max-w-md mx-auto mb-4">
                {(searchQuery || activeFilterCount > 0) ? (
                  <>We couldn't find any results matching your criteria.</>
                ) : (
                  <>No {activeTab === 'users' ? 'users' : 'communities'} to display.</>
                )}
              </p>
              {(searchQuery || activeFilterCount > 0) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    resetFilters();
                  }}
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-black font-semibold rounded-lg transition-colors text-sm"
                >
                  Clear Search & Filters
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