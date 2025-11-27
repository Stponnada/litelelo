'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { DirectoryProfile } from '@/types';
import Spinner from '@/components/Spinner';
import UserCard from '@/components/UserCard';
import { GlobeIcon } from '@/components/icons';

// --- Icons ---
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
const GridIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);
const NetworkIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

// --- Types ---
type TabType = 'users' | 'communities';
type UserFilterTab = 'all' | 'following' | 'followers' | 'friends';

const DirectoryPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const router = useRouter();

    // --- Data State ---
    const [allProfiles, setAllProfiles] = useState<DirectoryProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- UI State ---
    const [viewMode, setViewMode] = useState<'grid' | 'network'>('grid');
    const [activeTab, setActiveTab] = useState<TabType>('users');

    // --- Detailed Filtering State ---
    const [userFilterTab, setUserFilterTab] = useState<UserFilterTab>('all');
    const [followerIds, setFollowerIds] = useState<Set<string>>(new Set());
    const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        admission_year: '',
        branch: '',
        gender: '',
        dorm_building: '',
        relationship_status: '',
        dining_hall: '',
    });

    // --- Interaction State ---
    const [selectedProfile, setSelectedProfile] = useState<DirectoryProfile | null>(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            try {
                const { data, error: fetchError } = await supabase.rpc('get_unified_directory');
                if (fetchError) throw fetchError;
                setAllProfiles((data as DirectoryProfile[]) || []);
            } catch (err: any) {
                setError(err.message || 'Error loading directory');
            } finally {
                setLoading(false);
            }
        };
        fetchProfiles();
    }, []);

    // Fetch Stats & Follower IDs
    useEffect(() => {
        const fetchFollowData = async () => {
            if (!currentUser) return;
            try {
                // Stats
                const { count: followingCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', currentUser.id);
                const { count: followersCount } = await supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', currentUser.id);
                setFollowStats({ following: followingCount || 0, followers: followersCount || 0 });

                // Follower IDs for "Friends" tab
                const { data } = await supabase.from('followers').select('follower_id').eq('following_id', currentUser.id);
                if (data) setFollowerIds(new Set(data.map(item => item.follower_id)));
            } catch (err) { console.error(err); }
        };
        fetchFollowData();
    }, [currentUser]);

    // --- Event Handlers ---
    const handleFollowToggle = async (profileToToggle: DirectoryProfile) => {
        if (!currentUser || profileToToggle.type !== 'user') return;

        const isFollowing = profileToToggle.is_following;

        // Optimistic Updates
        setAllProfiles(prev => prev.map(p => p.id === profileToToggle.id ? { ...p, is_following: !isFollowing, follower_count: (p.follower_count || 0) + (isFollowing ? -1 : 1) } : p));
        if (selectedProfile?.id === profileToToggle.id) {
            setSelectedProfile(prev => prev ? { ...prev, is_following: !isFollowing, follower_count: (prev.follower_count || 0) + (isFollowing ? -1 : 1) } : null);
        }
        setFollowStats(prev => ({ ...prev, following: isFollowing ? prev.following - 1 : prev.following + 1 }));

        try {
            if (isFollowing) {
                await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profileToToggle.id });
            } else {
                await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profileToToggle.id });
            }
        } catch (err) { console.error(err); }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => setFilters({ admission_year: '', branch: '', gender: '', dorm_building: '', relationship_status: '', dining_hall: '' });

    // --- Filtering Logic ---
    const userProfiles = useMemo(() => allProfiles.filter(p => p.type === 'user'), [allProfiles]);

    // Filter Lists for Dropdowns
    const admissionYears = useMemo(() => [...new Set(userProfiles.map(p => p.admission_year).filter((y): y is number => !!y))].sort((a, b) => b - a), [userProfiles]);
    const branches = useMemo(() => [...new Set(userProfiles.map(p => p.branch).filter((b): b is string => !!b))].sort(), [userProfiles]);
    const dorms = useMemo(() => [...new Set(userProfiles.map(p => p.dorm_building).filter((d): d is string => !!d))].sort(), [userProfiles]);

    const filteredProfiles = useMemo(() => {
        let filtered = [...allProfiles];

        // 1. Tab Filter
        filtered = filtered.filter(p => activeTab === 'users' ? p.type === 'user' : p.type === 'community');

        // 2. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name?.toLowerCase().includes(query) || p.username?.toLowerCase().includes(query) || p.branch?.toLowerCase().includes(query));
        }

        // 3. Grid View Specific Filters (Only apply in Grid Mode)
        if (activeTab === 'users' && viewMode === 'grid') {
            // Sub-tabs
            if (userFilterTab === 'following') filtered = filtered.filter(p => p.is_following);
            else if (userFilterTab === 'followers') filtered = filtered.filter(p => followerIds.has(p.id));
            else if (userFilterTab === 'friends') filtered = filtered.filter(p => p.is_following && followerIds.has(p.id));

            // Dropdowns
            filtered = filtered.filter(p =>
                (!filters.admission_year || p.admission_year === parseInt(filters.admission_year)) &&
                (!filters.branch || p.branch === filters.branch) &&
                (!filters.gender || p.gender === filters.gender) &&
                (!filters.dorm_building || p.dorm_building === filters.dorm_building)
            );
        }

        return filtered;
    }, [allProfiles, searchQuery, activeTab, viewMode, userFilterTab, followerIds, filters]);

    const activeFilterCount = Object.values(filters).filter(Boolean).length;


    if (loading) return <div className="flex justify-center items-center h-[70vh]"><Spinner /></div>;

    return (
        <div className="w-full max-w-full overflow-x-hidden flex flex-col h-[calc(100vh-64px)]">

            {/* --- HEADER SECTION --- */}
            <div className="flex-none bg-background-light dark:bg-background border-b border-tertiary-light/50 dark:border-tertiary/50 z-20">
                <div className="max-w-7xl mx-auto px-4 py-4">

                    {/* Top Row: Title & Stats */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                        <div>
                            <h1 className="text-5xl font-bold flex items-center gap-2 text-text-main-light dark:text-text-main">
                                <GlobeIcon className="w-8 h-8 text-brand-green" />
                                <span>Directory</span>
                            </h1>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary">Discover people and communities</p>
                        </div>

                        {/* Right: Stats & Tabs */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Stats Pills */}
                            {currentUser && (
                                <div className="hidden md:flex gap-2 bg-secondary-light dark:bg-secondary rounded-xl p-2 border border-tertiary-light/50 dark:border-tertiary/50">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 rounded-lg">
                                        <div className="text-sm font-bold text-text-main-light dark:text-text-main">{followStats.following}</div>
                                        <div className="text-[10px] uppercase text-text-secondary-light dark:text-text-secondary font-bold">Following</div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-brand-green/10 rounded-lg">
                                        <div className="text-sm font-bold text-text-main-light dark:text-text-main">{followStats.followers}</div>
                                        <div className="text-[10px] uppercase text-text-secondary-light dark:text-text-secondary font-bold">Followers</div>
                                    </div>
                                </div>
                            )}

                            {/* Users / Communities Switch */}
                            <div className="flex bg-secondary-light dark:bg-secondary rounded-xl p-1 border border-tertiary-light/50 dark:border-tertiary/50">
                                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'users' ? 'bg-brand-green text-black shadow-md' : 'text-text-secondary-light dark:text-text-secondary'}`}>
                                    Users <span className="text-xs opacity-70 ml-1">{allProfiles.filter(p => p.type === 'user').length}</span>
                                </button>
                                <button onClick={() => { setActiveTab('communities'); setViewMode('grid'); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'communities' ? 'bg-brand-green text-black shadow-md' : 'text-text-secondary-light dark:text-text-secondary'}`}>
                                    Communities <span className="text-xs opacity-70 ml-1">{allProfiles.filter(p => p.type === 'community').length}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Controls (Search, Filters, View Toggle) */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder={viewMode === 'network' ? "Find in your network..." : "Search directory..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-secondary-light dark:bg-secondary border border-tertiary-light/50 dark:border-tertiary/50 rounded-xl focus:ring-2 focus:ring-brand-green outline-none"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full"><XMarkIcon className="w-4 h-4" /></button>}
                        </div>

                        {/* Filters Button (Grid Only) */}
                        {activeTab === 'users' && viewMode === 'grid' && (
                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ${showFilters ? 'bg-brand-green/20 text-brand-green border-brand-green' : 'bg-secondary-light dark:bg-secondary border-tertiary-light/50 dark:border-tertiary/50'}`}>
                                <FilterIcon className="w-5 h-5" />
                                <span>Filters</span>
                                {activeFilterCount > 0 && <span className="bg-brand-green text-black text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                            </button>
                        )}

                        {/* Grid/Network Toggle (Only for Users tab) */}
                        {activeTab === 'users' && (
                            <div className="flex bg-secondary-light dark:bg-secondary rounded-xl p-1 border border-tertiary-light/50 dark:border-tertiary/50 shrink-0">
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-green text-black shadow-sm' : 'text-text-secondary-light dark:text-text-secondary'}`} title="Grid View">
                                    <GridIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewMode('network')} className={`relative p-2 rounded-lg transition-all group ${viewMode === 'network' ? 'bg-brand-green text-black shadow-sm' : 'text-text-secondary-light dark:text-text-secondary'}`} title="Your Network">
                                    <NetworkIcon className="w-5 h-5" />
                                    {/* Tooltip for Network */}
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Your Network</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Expandable Filters Panel (Grid Only) */}
                    {showFilters && activeTab === 'users' && viewMode === 'grid' && (
                        <div className="mt-4 p-4 bg-secondary-light dark:bg-secondary rounded-xl border border-tertiary-light/50 dark:border-tertiary/50 animate-fadeIn">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <select name="admission_year" value={filters.admission_year} onChange={handleFilterChange} className="p-2 bg-tertiary-light dark:bg-tertiary rounded-lg text-sm"><option value="">Batch</option>{admissionYears.map(y => <option key={y} value={y}>{y}</option>)}</select>
                                <select name="branch" value={filters.branch} onChange={handleFilterChange} className="p-2 bg-tertiary-light dark:bg-tertiary rounded-lg text-sm"><option value="">Branch</option>{branches.map(b => <option key={b} value={b}>{b}</option>)}</select>
                                <select name="dorm_building" value={filters.dorm_building} onChange={handleFilterChange} className="p-2 bg-tertiary-light dark:bg-tertiary rounded-lg text-sm"><option value="">Dorm</option>{dorms.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                <select name="gender" value={filters.gender} onChange={handleFilterChange} className="p-2 bg-tertiary-light dark:bg-tertiary rounded-lg text-sm"><option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option></select>
                            </div>
                            {activeFilterCount > 0 && <button onClick={resetFilters} className="mt-3 text-sm text-brand-green hover:underline">Reset Filters</button>}
                        </div>
                    )}

                    {/* Sub-Tabs (All, Following, etc) - Grid Only */}
                    {activeTab === 'users' && viewMode === 'grid' && currentUser && (
                        <div className="mt-4 flex space-x-6 border-b border-tertiary-light/50 dark:border-tertiary/50 overflow-x-auto">
                            {(['all', 'following', 'followers', 'friends'] as UserFilterTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setUserFilterTab(tab)}
                                    className={`pb-2 capitalize text-sm font-semibold border-b-2 transition-all ${userFilterTab === tab ? 'border-brand-green text-brand-green' : 'border-transparent text-text-secondary-light dark:text-text-secondary hover:text-text-main'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- CONTENT SECTION --- */}
            <div className="flex-1 relative overflow-hidden bg-background-light dark:bg-background">
                {viewMode === 'grid' ? (
                    <div className="h-full overflow-y-auto p-4 max-w-7xl mx-auto w-full">
                        {filteredProfiles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                {filteredProfiles.map((profile) => (
                                    <UserCard
                                        key={profile.id}
                                        profile={profile}
                                        isCurrentUser={currentUser?.id === profile.id}
                                        isToggling={false}
                                        onFollowToggle={() => handleFollowToggle(profile)}
                                        onMessage={() => setSelectedProfile(profile)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-text-secondary-light dark:text-text-secondary">
                                <p className="text-xl font-bold">No results found</p>
                                <p className="text-sm">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Network View uses strictly filtered profiles */
                    <InteractiveNetworkCanvas
                        profiles={userProfiles}
                        searchQuery={searchQuery}
                        currentUser={currentUser}
                        onSelectNode={setSelectedProfile}
                    />
                )}

                {/* Sidebar Overlay */}
                <ProfileSidebar
                    profile={selectedProfile}
                    currentUser={currentUser}
                    onClose={() => setSelectedProfile(null)}
                    onFollowToggle={handleFollowToggle}
                    onMessage={() => selectedProfile && router.push(`/chat?recipientId=${selectedProfile.id}`)}
                />
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// STATIC NETWORK COMPONENT (Personalized "My Network" View)
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
// INTERACTIVE NETWORK COMPONENT ("Mindblowing" Version)
// ----------------------------------------------------------------------
const InteractiveNetworkCanvas = ({ profiles, searchQuery, currentUser, onSelectNode }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Interaction State
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const transformRef = useRef({ x: 0, y: 0, k: 1 }); // Pan x, y, Scale k
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Physics State
    const nodesRef = useRef<any[]>([]);
    const linksRef = useRef<any[]>([]);
    const starsRef = useRef<any[]>([]);
    const animationRef = useRef<number | null>(null);
    const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

    // 1. Initialize Data & Layout (Organic Neural Network)
    useEffect(() => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        const center = { x: width / 2, y: height / 2 };

        // A. Filter & Prepare Data
        let networkProfiles = profiles.filter((p: DirectoryProfile) => {
            return p.id === currentUser?.id || p.is_following;
        });

        // Ensure "Me" exists
        const isMePresent = networkProfiles.find((p: any) => p.id === currentUser?.id);
        if (!isMePresent && currentUser) {
            networkProfiles.push({
                id: currentUser.id,
                name: currentUser.user_metadata?.full_name || "You",
                username: currentUser.user_metadata?.username || "You",
                type: 'user',
                is_following: false,
                avatar_url: currentUser.user_metadata?.avatar_url
            });
        }

        // B. Create Stars
        if (starsRef.current.length === 0) {
            const stars = [];
            for (let i = 0; i < 200; i++) {
                stars.push({
                    x: (Math.random() - 0.5) * 3000,
                    y: (Math.random() - 0.5) * 3000,
                    size: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
            starsRef.current = stars;
        }

        // C. Create Nodes with Organic Layout (Neural Network Style)
        const otherNodes = networkProfiles.filter((p: any) => p.id !== currentUser?.id);

        // Create clusters with varying distances
        const baseRadius = Math.min(width, height) * 0.3;
        const nodes = networkProfiles.map((p: DirectoryProfile, _index: number) => {
            const isMe = currentUser && p.id === currentUser.id;

            // Preload Image - FIXED: Also load current user's avatar
            if (p.avatar_url && !imagesRef.current[p.id]) {
                const img = new Image();
                img.src = p.avatar_url;
                img.crossOrigin = 'anonymous'; // Handle CORS if needed
                imagesRef.current[p.id] = img;
            }

            let x, y;
            if (isMe) {
                // Center position for "Me"
                x = center.x;
                y = center.y;
            } else {
                // Organic arrangement - random angles and varying distances
                const angle = Math.random() * 2 * Math.PI;
                const radiusVariation = 0.7 + Math.random() * 0.6; // 70% to 130% of base radius
                const distance = baseRadius * radiusVariation;

                // Add some noise for organic feel
                const noise = (Math.random() - 0.5) * 40;
                x = center.x + distance * Math.cos(angle) + noise;
                y = center.y + distance * Math.sin(angle) + noise;
            }

            return {
                x,
                y,
                radius: isMe ? 45 : 25,
                profile: p,
                isMe: !!isMe
            };
        });

        // D. Create Links
        const links: any[] = [];
        const myNode = nodes.find((n: any) => n.isMe);

        // Build a map of followers for mutual friend detection
        const followerIds = new Set<string>();
        // We need to get follower data from parent component
        // For now, we'll create a simple map from the profiles

        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];

            // 1. Link from Me to people I follow
            if (myNode && nodeA !== myNode && nodeA.profile.is_following) {
                links.push({ source: myNode, target: nodeA, isMeLink: true });
            }

            // 2. Links between friends (if both follow each other - mutual friends)
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeB = nodes[j];
                if (nodeA.isMe || nodeB.isMe) continue;

                // Check if both are following (mutual friends)
                // Since we only have "is_following" from current user's perspective,
                // we'll create connections based on shared attributes as a proxy
                const sameDorm = nodeA.profile.dorm_building &&
                    nodeA.profile.dorm_building === nodeB.profile.dorm_building;
                const sameBranch = nodeA.profile.branch &&
                    nodeA.profile.branch === nodeB.profile.branch;

                // Add connection if they share dorm or branch (likely friends)
                if ((sameDorm || sameBranch) && Math.random() > 0.3) { // 70% chance to show connection
                    links.push({ source: nodeA, target: nodeB, isMeLink: false });
                }
            }
        }

        nodesRef.current = nodes;
        linksRef.current = links;

        // Center View initially
        transformRef.current = { x: 0, y: 0, k: 1 };

    }, [profiles, currentUser]);

    // 2. Render Loop (No Physics)
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const render = () => {
            if (!containerRef.current) return;
            // Resize if needed
            if (canvas.width !== containerRef.current.clientWidth || canvas.height !== containerRef.current.clientHeight) {
                canvas.width = containerRef.current.clientWidth;
                canvas.height = containerRef.current.clientHeight;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background Grid (Subtle)
            ctx.save();
            ctx.strokeStyle = '#333';
            ctx.globalAlpha = 0.1;
            ctx.lineWidth = 1;
            const gridSize = 50 * transformRef.current.k;
            const offsetX = transformRef.current.x % gridSize;
            const offsetY = transformRef.current.y % gridSize;
            // (Simplified grid for performance, or skip)

            ctx.restore();

            ctx.save();
            // Apply Transform (Pan/Zoom)
            ctx.translate(transformRef.current.x, transformRef.current.y);
            ctx.scale(transformRef.current.k, transformRef.current.k);

            // Draw Stars
            starsRef.current.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });

            // Draw Links
            linksRef.current.forEach(link => {
                ctx.beginPath();
                ctx.moveTo(link.source.x, link.source.y);
                ctx.lineTo(link.target.x, link.target.y);

                if (link.isMeLink) {
                    // Links from/to "Me" - bright green
                    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
                    ctx.lineWidth = 2;
                } else {
                    // Friend-to-friend links - subtle
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = 1;
                }
                ctx.stroke();
            });

            // Draw Nodes
            nodesRef.current.forEach(node => {
                const isMatch = !searchQuery || node.profile.name?.toLowerCase().includes(searchQuery.toLowerCase());
                const isHovered = hoveredNode === node.profile.id;

                ctx.globalAlpha = (!isMatch && searchQuery) ? 0.1 : 1;

                // Glow
                if (node.isMe || isHovered) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = node.isMe ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.5)';
                } else {
                    ctx.shadowBlur = 0;
                }

                // Circle Background
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.isMe ? '#10b981' : '#1f2937';
                ctx.fill();

                // Image
                const img = imagesRef.current[node.profile.id];
                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius - 2, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, node.x - node.radius, node.y - node.radius, node.radius * 2, node.radius * 2);
                    ctx.restore();
                } else {
                    // Initials
                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${node.isMe ? 14 : 12}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const initials = (node.profile.name || '?').slice(0, 2).toUpperCase();
                    ctx.fillText(initials, node.x, node.y);
                }

                // Border
                if (isHovered || node.isMe) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Label (Name)
                if (isHovered || node.isMe) {
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.shadowColor = 'black';
                    ctx.shadowBlur = 4;
                    ctx.fillText(node.profile.name?.split(' ')[0] || '', node.x, node.y + node.radius + 18);
                    ctx.shadowBlur = 0;
                }

                ctx.globalAlpha = 1;
            });

            ctx.restore();

            animationRef.current = requestAnimationFrame(render);
        };

        render();
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [searchQuery, hoveredNode]);

    // 3. Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
        const y = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

        // Check for node click
        const clickedNode = nodesRef.current.slice().reverse().find(n => {
            const dist = Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2));
            return dist < n.radius;
        });

        if (clickedNode && !clickedNode.isMe) {
            // Select node immediately
            onSelectNode(clickedNode.profile);
        } else {
            // Start panning
            isDraggingRef.current = true;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - transformRef.current.x) / transformRef.current.k;
        const mouseY = (e.clientY - rect.top - transformRef.current.y) / transformRef.current.k;

        // Hover Check
        if (!isDraggingRef.current) {
            const hovered = nodesRef.current.slice().reverse().find(n => {
                const dist = Math.sqrt(Math.pow(n.x - mouseX, 2) + Math.pow(n.y - mouseY, 2));
                return dist < n.radius;
            });
            setHoveredNode(hovered?.profile.id || null);
            document.body.style.cursor = hovered ? 'pointer' : 'grab';
        }

        // Panning
        if (isDraggingRef.current) {
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            transformRef.current.x += dx;
            transformRef.current.y += dy;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = 'grabbing';
        }
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        document.body.style.cursor = 'grab';
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault(); // Prevent page scroll
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, transformRef.current.k + delta), 5);

        // Zoom towards mouse pointer
        // (Simplified: Zoom center for now to avoid complex math bugs in this iteration)
        // Better:
        const rect = canvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleRatio = newScale / transformRef.current.k;

        transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * scaleRatio;
        transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * scaleRatio;
        transformRef.current.k = newScale;
    };

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#0a0a0a]">
            {/* Background Gradient/Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black pointer-events-none" />

            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className="block w-full h-full cursor-grab active:cursor-grabbing relative z-10"
            />

            {/* Controls / Legend */}
            <div className="absolute bottom-6 left-6 p-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-xs text-white/80 space-y-3 pointer-events-none select-none z-20">
                <div className="font-bold text-white mb-1">Network Map</div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-brand-green shadow-[0_0_10px_#10b981]"></span>
                    <span>You</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600"></span>
                    <span>Connection</span>
                </div>
                <div className="text-[10px] opacity-50 mt-2">
                    Scroll to Zoom • Drag to Pan
                </div>
            </div>

            {/* Reset View Button */}
            <button
                onClick={() => { transformRef.current = { x: 0, y: 0, k: 1 }; }}
                className="absolute bottom-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white transition-all z-20"
                title="Reset View"
            >
                <NetworkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// ----------------------------------------------------------------------
// PROFILE SIDEBAR
// ----------------------------------------------------------------------
const ProfileSidebar = ({ profile, currentUser, onClose, onFollowToggle, onMessage }: any) => {
    if (!profile) return null;
    return (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-background-light/95 dark:bg-background/95 backdrop-blur-xl border-l border-tertiary-light/50 dark:border-tertiary/50 shadow-2xl z-30 animate-slideInRight flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-tertiary-light/50 dark:border-tertiary/50">
                <h3 className="font-bold text-lg text-text-main-light dark:text-text-main">Profile</h3>
                <button onClick={onClose} className="p-2 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-full"><XMarkIcon className="w-6 h-6" /></button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                <UserCard
                    profile={profile}
                    isCurrentUser={currentUser?.id === profile.id}
                    isToggling={false}
                    onFollowToggle={() => onFollowToggle(profile)}
                    onMessage={onMessage}
                />
            </div>
        </div>
    );
};

export default DirectoryPage;