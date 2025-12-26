'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Post as PostType, CommunityDetails as CommunityDetailsType, ConversationSummary, Profile } from '@/types';
import Spinner from '@/components/Spinner';
import PostComponent from '@/components/Post';
import CreatePost from '@/components/CreatePost';
import ImageCropper from '@/components/ImageCropper';
import LightBox from '@/components/lightbox';
import { UserGroupIcon, ArrowLeftIcon, CameraIcon, LockClosedIcon, PlusIcon } from '@/components/icons';
import CreateSubcommunityModal from '@/components/CreateSubcommunityModal';
import CreateBlogModal from '@/components/CreateBlogModal';

// Subcommunity interface now matches CommunityDetailsType minus the extra fields we don't need, but simpler to just extend
interface Subcommunity extends CommunityDetailsType {
    // conversation_id removed
}

const CommunityPage: React.FC = () => {
    const params = useParams();
    const communityId = params?.communityId as string;
    const { user, profile: currentUserProfile } = useAuth();
    const router = useRouter();

    const [community, setCommunity] = useState<CommunityDetailsType | null>(null);
    const [subcommunities, setSubcommunities] = useState<Subcommunity[]>([]);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [subcommunityPosts, setSubcommunityPosts] = useState<PostType[]>([]); // New state for subcommunity posts
    const [loadingSubcommunityPosts, setLoadingSubcommunityPosts] = useState(false); // New loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedAccessType, setEditedAccessType] = useState<'public' | 'restricted' | 'private'>('public');

    // 'private' for member posts, 'public' for public posts, 'blog' for blog posts, or a subcommunity ID
    const [activeView, setActiveView] = useState<'private' | 'public' | 'blog' | string>('private');

    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const [cropperState, setCropperState] = useState<{ isOpen: boolean; type: 'avatar' | 'banner' | null; src: string | null; }>({ isOpen: false, type: null, src: null });
    const [isSaving, setIsSaving] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [isCreateSubcommunityModalOpen, setCreateSubcommunityModalOpen] = useState(false);
    const [isCreateBlogModalOpen, setCreateBlogModalOpen] = useState(false);

    const fetchCommunityData = useCallback(async () => {
        if (!communityId) return;

        // Only show full loading if we don't have the community or we're switching communities
        if (!community || community.id !== communityId) {
            setLoading(true);
        }
        setError(null);
        try {
            // Fetch community details, posts, and subcommunities in parallel for speed
            const communityPromise = supabase.rpc('get_community_details', { p_community_id: communityId }).single();
            const postsPromise = supabase.rpc('get_posts_for_community', { p_community_id: communityId });
            const subcommunitiesPromise = supabase.rpc('get_subcommunities', { p_parent_id: communityId });

            const [communityResult, postsResult, subcommunitiesResult] = await Promise.all([communityPromise, postsPromise, subcommunitiesPromise]);

            if (communityResult.error) throw communityResult.error;
            setCommunity(communityResult.data as CommunityDetailsType);

            if (postsResult.error) throw postsResult.error;

            // Transform flat RPC result to nested Post structure
            const rawPosts = postsResult.data as any[];
            const formattedPosts: PostType[] = rawPosts.map(post => ({
                ...post,
                author: post.author || {
                    author_id: post.author_id,
                    author_type: post.author_type,
                    author_name: post.author_name,
                    author_username: post.author_username,
                    author_avatar_url: post.author_avatar_url,
                    author_flair_details: post.author_flair_details
                }
            }));

            setPosts(formattedPosts);

            if (subcommunitiesResult.error) throw subcommunitiesResult.error;
            setSubcommunities(subcommunitiesResult.data || []);

            // Update last_visited_at timestamp for this community (fire and forget)
            if (user && communityResult.data) {
                const communityData = communityResult.data as CommunityDetailsType;

                // Update the current community
                supabase.rpc('update_community_last_visited', { p_community_id: communityId })
                    .then(({ error }) => {
                        if (error) {
                            console.error('Failed to update last_visited_at for community:', error);
                        }
                    });

                // If this is a subcommunity, also update the parent community's last_visited_at
                if (communityData.parent_community_id) {
                    supabase.rpc('update_community_last_visited', { p_community_id: communityData.parent_community_id })
                        .then(({ error }) => {
                            if (error) {
                                console.error('Failed to update last_visited_at for parent community:', error);
                            }
                        });
                }
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }, [communityId, user?.id, community?.id]);

    useEffect(() => {
        fetchCommunityData();
    }, [fetchCommunityData]);

    // Fetch subcommunity posts when activeView changes to a subcommunity ID
    useEffect(() => {
        const fetchSubcommunityPosts = async () => {
            if (!['private', 'public', 'blog'].includes(activeView)) {
                setLoadingSubcommunityPosts(true);
                try {
                    const { data, error } = await supabase.rpc('get_posts_for_community', { p_community_id: activeView });
                    if (error) throw error;

                    // Transform flat RPC result to nested Post structure
                    const rawPosts = data as any[];
                    const formattedPosts: PostType[] = rawPosts.map(post => ({
                        ...post,
                        author: post.author || {
                            author_id: post.author_id,
                            author_type: post.author_type,
                            author_name: post.author_name,
                            author_username: post.author_username,
                            author_avatar_url: post.author_avatar_url,
                            author_flair_details: post.author_flair_details
                        }
                    }));
                    setSubcommunityPosts(formattedPosts);
                } catch (err) {
                    console.error("Failed to fetch subcommunity posts:", err);
                } finally {
                    setLoadingSubcommunityPosts(false);
                }
            }
        };

        fetchSubcommunityPosts();
    }, [activeView]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setCropperState({ isOpen: true, type, src: reader.result as string });
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropSave = async (croppedImageFile: File) => {
        if (!community || !cropperState.type || !user) return;
        setIsSaving(true);
        const fileType = cropperState.type;
        const filePath = `${user.id}/community-assets/${community.id}/${fileType}.${croppedImageFile.name.split('.').pop()}`;
        const columnToUpdate = fileType === 'avatar' ? 'avatar_url' : 'banner_url';
        try {
            await supabase.storage.from('community-assets').upload(filePath, croppedImageFile, { upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('community-assets').getPublicUrl(filePath);
            const newUrl = `${publicUrl}?t=${new Date().getTime()}`;
            await supabase.from('communities').update({ [columnToUpdate]: newUrl }).eq('id', community.id);
            setCommunity(prev => prev ? { ...prev, [columnToUpdate]: newUrl } : null);
        } catch (err: unknown) {
            console.error(`Failed to upload ${fileType}:`, err);
            // Optionally, set an error state here as well if needed
        } finally {
            setIsSaving(false);
            setCropperState({ isOpen: false, type: null, src: null });
        }
    };

    const handleStartEdit = () => {
        if (!community) return;
        setEditedName(community.name);
        setEditedDescription(community.description);
        setEditedAccessType(community.access_type);
        setIsEditing(true);
    };

    const handleCancelEdit = () => setIsEditing(false);

    const handleSaveChanges = async () => {
        if (!community) return;
        setIsSaving(true);
        const { data } = await supabase.from('communities').update({ name: editedName, description: editedDescription, access_type: editedAccessType }).eq('id', community.id).select().single();
        if (data) setCommunity(prev => ({ ...prev!, ...data }));
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleJoinToggle = async (targetCommunityId: string, accessType: 'public' | 'restricted' | 'private', isMember: boolean, hasPendingRequest: boolean, parentId?: string) => {
        if (!user) return;

        // If trying to join a subcommunity (has parentId), we actually need to join the parent instead.
        // The user should already be a member of the parent to join/view subcommunity, 
        // OR joining the subcommunity implies joining the parent.
        // Based on requirements: "A user will have to join a community, to join any of its subommunities. If a user tries to join a subcommunity, the request should be routed directly to the communtiy"

        const effectiveTargetId = parentId || targetCommunityId;
        const effectiveAccessType = parentId && community?.id === parentId ? community.access_type : accessType; // Fallback logic if needed

        // If we are in subcommunity view and click "Join", we are joining the parent.
        // We need to know the parent's membership status. 
        // Ideally, we should check `community.is_member` if `community` is the parent.
        // But `community` in state is the *current* page's community.

        // Scenario 1: User is on Subcommunity Page. `community` is the subcommunity. `community.parent_community_id` is present.
        // User clicks "Join". We should join `community.parent_community_id`.

        let targetIdToJoin = targetCommunityId;
        if (community?.parent_community_id && targetCommunityId === community.id) {
            targetIdToJoin = community.parent_community_id;
        }

        // Logic below assumes we are toggling the community we clicked on.
        // If we redirect to parent, we need to handle that state update.
        // Simpler approach: If it's a subcommunity join request, purely trigger the parent join action.

        if (parentId) {
            // Join parent instead
            // We need to fetch parent details to know access type etc if we don't have it, 
            // but usually we might assume public/same as standard for simplicity or fetch it.
            // Be safe: Just use the standard flow but with parent ID.
            // Note: This function updates LOCAL state. We need to be careful.
            // If we join parent, we should likely reload or fetch parent state.

            // For now, let's implement the requirement: "request should be routed directly to the community"
            // If we are on subcommunity page, the `community` object IS the subcommunity.
            // We can't easily optimistic update the parent state if we don't have it.
            // So we will just fire the RPC for the parent.

            // Actually, if we are on a subcommunity page, we probably shouldn't even SHOW a "Join Subcommunity" button
            // We should show "Join [Parent Name]" button.

            // Let's rely on the UI rendering to pass the correct ID (Parent ID) to this function if it's a subcommunity.
        }

        const isSubcommunity = targetCommunityId !== community?.id;

        const updateState = (updater: (c: CommunityDetailsType | Subcommunity) => CommunityDetailsType | Subcommunity) => {
            if (isSubcommunity) {
                setSubcommunities(prev => prev.map(sc => sc.id === targetCommunityId ? (updater(sc) as Subcommunity) : sc));
            } else if (community) {
                setCommunity(updater(community));
            }
        };

        if (accessType === 'public') {
            updateState(c => ({ ...c, is_member: !isMember, member_count: c.member_count + (!isMember ? 1 : -1) }));
            try {
                if (isMember) {
                    await supabase.from('community_members').delete().match({ community_id: targetCommunityId, user_id: user.id });
                } else {
                    await supabase.from('community_members').insert({ community_id: targetCommunityId, user_id: user.id, status: 'approved' });
                }
            } catch (err: unknown) {
                console.error("Failed to toggle membership:", err);
                fetchCommunityData(); // Revert on error
            }
        } else { // Restricted
            if (hasPendingRequest) {
                updateState(c => ({ ...c, has_pending_request: false }));
                await supabase.from('community_members').delete().match({ community_id: targetCommunityId, user_id: user.id, status: 'pending' });
            } else if (!isMember) {
                updateState(c => ({ ...c, has_pending_request: true }));
                await supabase.rpc('request_to_join_community', { p_community_id: targetCommunityId });
            } else {
                updateState(c => ({ ...c, is_member: false, member_count: c.member_count - 1 }));
                await supabase.from('community_members').delete().match({ community_id: targetCommunityId, user_id: user.id });
            }
        }
    };

    // selectSubcommunityConversation removed as we no longer use chat

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <Spinner />
                <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">Loading community...</p>
            </div>
        );
    }

    if (error || !community) {
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
                            <p className="text-red-400 font-bold text-lg mb-2">Community not found</p>
                            <p className="text-red-300/70 text-sm">{error || 'This community does not exist or you do not have access to it.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isOwner = community.is_admin;
    const canPostInCurrentView = community.is_member && ['private', 'public'].includes(activeView);
    const placeholderText = activeView === 'public' ? "Share something with everyone..." : "What's on your mind, member?";

    const blogPosts = posts.filter(p => p.post_type === 'blog');
    const publicPosts = posts.filter(p => p.is_public && p.post_type !== 'blog');
    const privatePosts = posts.filter(p => !p.is_public);


    return (
        <div className="w-full min-h-screen">
            {cropperState.isOpen && cropperState.src && <ImageCropper imageSrc={cropperState.src} aspect={cropperState.type === 'avatar' ? 1 : 16 / 6} cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'} onSave={handleCropSave} onClose={() => setCropperState({ isOpen: false, type: null, src: null })} isSaving={isSaving} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
            {isCreateSubcommunityModalOpen && <CreateSubcommunityModal parentCommunityId={community.id} onClose={() => setCreateSubcommunityModalOpen(false)} onSubcommunityCreated={fetchCommunityData} />}
            {isCreateBlogModalOpen && community && (
                <CreateBlogModal
                    isOpen={isCreateBlogModalOpen}
                    onClose={() => setCreateBlogModalOpen(false)}
                    communityId={community.id}
                    onSuccess={fetchCommunityData}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
                <Link href={community?.parent_community_id ? `/communities/${community.parent_community_id}` : "/communities"} className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green transition-colors mb-3 group">
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {community?.parent_community_id ? `Back to ${community.parent_community_name}` : 'Back to all communities'}
                </Link>

                <div className="bg-white/80 dark:bg-secondary/80 backdrop-blur-sm rounded-2xl shadow-lg border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden mb-4">
                    {/* Banner - Profile Page Style */}
                    <div className="relative h-32 sm:h-48 bg-gradient-to-br from-brand-green/30 via-brand-green/20 to-tertiary-light dark:to-tertiary group">
                        {community.banner_url && <Image src={community.banner_url} alt="Banner" fill className="object-cover" unoptimized />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
                        {isOwner && (<>
                            <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </button>
                            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                        </>)}
                    </div>

                    {/* Info Section - Profile Page Style */}
                    <div className="px-4 sm:px-6 pb-4">
                        {/* Avatar and Buttons Row - Profile Page Style */}
                        <div className="relative -mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                            {/* Avatar - centered on mobile, left on desktop */}
                            <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                                <div className="absolute inset-0 rounded-full"></div>
                                <Image
                                    src={community.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=3cfba2&color=000`}
                                    alt={community.name}
                                    width={128}
                                    height={128}
                                    className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white dark:border-secondary object-cover shadow-2xl"
                                    unoptimized
                                />
                                {isOwner && (<>
                                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                        <CameraIcon className="w-6 h-6 text-white" />
                                    </button>
                                    <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                                </>)}
                            </div>
                        </div>

                        {/* Community Info - centered on mobile, left-aligned on desktop */}
                        <div className="mt-4 text-center sm:text-left">
                            {community.parent_community_id && (
                                <Link href={`/communities/${community.parent_community_id}`} className="inline-block mb-1 text-xs font-bold uppercase tracking-wider text-brand-green hover:underline">
                                    Subcommunity of {community.parent_community_name}
                                </Link>
                            )}
                            {isEditing ? (
                                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full text-2xl sm:text-3xl font-black bg-tertiary-light dark:bg-tertiary rounded-lg p-2 mb-2" />
                            ) : (
                                <h1 className="text-2xl sm:text-3xl font-black text-text-main-light dark:text-text-main mb-2">{community.name}</h1>
                            )}

                            <Link href={`/communities/${community.id}/members`} className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary hover:text-brand-green transition-colors mb-2">
                                <UserGroupIcon className="w-4 h-4" />
                                <span className="font-semibold">{community.member_count} {community.member_count === 1 ? 'member' : 'members'}</span>
                            </Link>

                            {isEditing ? (
                                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full mt-2 text-sm text-text-secondary-light dark:text-text-secondary bg-tertiary-light dark:bg-tertiary rounded-lg p-2" rows={2} />
                            ) : community.description && (
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary max-w-2xl mx-auto sm:mx-0">{community.description}</p>
                            )}
                        </div>

                        {/* Action Buttons - below avatar on mobile, right side on desktop */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 mt-3 sm:mb-2">
                            {isEditing ? (<>
                                <button onClick={handleCancelEdit} className="text-sm font-semibold py-2 px-5 rounded-lg bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors">Cancel</button>
                                <button onClick={handleSaveChanges} disabled={isSaving} className="text-sm font-bold py-2 px-5 rounded-lg bg-brand-green text-black hover:bg-brand-green-darker transition-colors">{isSaving ? <Spinner /> : 'Save'}</button>
                                <select value={editedAccessType} onChange={(e) => setEditedAccessType(e.target.value as 'public' | 'restricted' | 'private')} className="text-sm bg-tertiary-light dark:bg-tertiary rounded-lg py-2 px-4">
                                    <option value="public">Public</option>
                                    <option value="restricted">Restricted</option>
                                    <option value="private">Private</option>
                                </select>
                            </>) : isOwner ? (<>
                                <button onClick={() => setCreateBlogModalOpen(true)} className="text-sm font-semibold py-2 px-5 rounded-lg bg-brand-green text-black hover:bg-brand-green-darker transition-colors shadow-lg shadow-brand-green/20">
                                    Write Blog
                                </button>
                                <button onClick={handleStartEdit} className="text-sm font-semibold py-2 px-5 rounded-lg bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors">
                                    Edit Community
                                </button>
                            </>) : (
                                <button
                                    onClick={() => {
                                        if (community.parent_community_id) {
                                            router.push(`/communities/${community.parent_community_id}`);
                                        } else {
                                            handleJoinToggle(community.id, community.access_type, community.is_member, community.has_pending_request);
                                        }
                                    }}
                                    className={`text-sm font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50 ${community.is_member ? 'bg-transparent border border-tertiary-light dark:border-tertiary text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500' : community.has_pending_request ? 'bg-tertiary-light/60 dark:bg-tertiary/60 text-text-secondary-light dark:text-text-secondary cursor-not-allowed' : 'bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20'}`} disabled={!community.is_member && community.has_pending_request}>
                                    {community.is_member ? 'Leave' : (community.has_pending_request ? 'Request Sent' : (community.parent_community_id ? `Join ${community.parent_community_name}` : 'Join'))}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Subcommunities List (Only for Parent Community) */}
            {!community.parent_community_id && subcommunities.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-wider">Subcommunities</h3>
                        {isOwner && (
                            <button
                                onClick={() => setCreateSubcommunityModalOpen(true)}
                                className="p-1.5 rounded-lg text-brand-green hover:bg-brand-green/10 transition-colors"
                                title="Create Subcommunity"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subcommunities.map(sub => (
                            <Link
                                href={`/communities/${sub.id}`}
                                key={sub.id}
                                className="group block p-4 rounded-xl border border-tertiary-light/50 dark:border-tertiary/50 bg-white/40 dark:bg-secondary/40 hover:bg-white/60 dark:hover:bg-secondary/60 hover:border-brand-green/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-tertiary-light dark:bg-tertiary flex items-center justify-center text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transition-colors">
                                        <UserGroupIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-text-main-light dark:text-text-main truncate">{sub.name}</h4>
                                            {sub.access_type === 'restricted' && <LockClosedIcon className="w-3 h-3 text-text-tertiary-light dark:text-text-tertiary" />}
                                        </div>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary truncate">{sub.description || 'No description'}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                        <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Just Create Button if no subcommunities yet */}
            {!community.parent_community_id && subcommunities.length === 0 && isOwner && (
                <div className="mb-6 flex justify-end px-2">
                    <button
                        onClick={() => setCreateSubcommunityModalOpen(true)}
                        className="text-sm font-bold text-brand-green hover:underline flex items-center gap-1"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Subcommunity
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="w-full">
                <div className="space-y-5">
                    {/* Horizontal Tabs - YouTube Style */}
                    <div className="mb-4">
                        <div className="bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-full border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden inline-flex">
                            <div className="flex items-center gap-1 p-1">
                                <button
                                    onClick={() => setActiveView('private')}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeView === 'private'
                                        ? 'bg-brand-green text-black'
                                        : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                                        }`}
                                >
                                    Member Posts
                                </button>
                                <button
                                    onClick={() => setActiveView('public')}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeView === 'public'
                                        ? 'bg-brand-green text-black'
                                        : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                                        }`}
                                >
                                    Public Feed
                                </button>
                                <button
                                    onClick={() => setActiveView('blog')}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeView === 'blog'
                                        ? 'bg-brand-green text-black'
                                        : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
                                        }`}
                                >
                                    Blogs
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Member restriction message for private posts */}
                    {activeView === 'private' && !community.is_member ? (
                        <div className="text-center py-24 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border border-tertiary-light/50 dark:border-tertiary/50">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-brand-green/20 blur-2xl rounded-full"></div>
                                <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/10 border-2 border-brand-green/30 flex items-center justify-center">
                                    <svg className="w-12 h-12 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3">Join to see posts</h3>
                            <p className="text-text-secondary-light dark:text-text-secondary mb-6 max-w-md mx-auto">
                                {community.parent_community_id
                                    ? `Join ${community.parent_community_name} to view and participate in this subcommunity.`
                                    : "Become a member to view and create internal posts in this community."}
                            </p>
                            <button
                                onClick={() => {
                                    if (community.parent_community_id) {
                                        router.push(`/communities/${community.parent_community_id}`);
                                    } else {
                                        handleJoinToggle(community.id, community.access_type, community.is_member, community.has_pending_request);
                                    }
                                }}
                                className="bg-brand-green text-black font-bold py-3 px-8 rounded-xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30"
                            >
                                {community.parent_community_id ? `Go to ${community.parent_community_name}` : 'Join Community'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Create Post Input - Visible for all valid views if user is allowed to post */}
                            {currentUserProfile && community.is_member && (
                                <div className="mb-6">
                                    <CreatePost
                                        onPostCreated={() => {
                                            // If in subcommunity, re-fetch subcommunity posts. Else re-fetch community data.
                                            if (!['private', 'public', 'blog'].includes(activeView)) {
                                                const fetchSub = async () => {
                                                    const { data } = await supabase.rpc('get_posts_for_community', { p_community_id: activeView });
                                                    if (data) {
                                                        const rawPosts = data as any[];
                                                        const formattedPosts: PostType[] = rawPosts.map(post => ({
                                                            ...post,
                                                            author: post.author || {
                                                                author_id: post.author_id,
                                                                author_type: post.author_type,
                                                                author_name: post.author_name,
                                                                author_username: post.author_username,
                                                                author_avatar_url: post.author_avatar_url,
                                                                author_flair_details: post.author_flair_details
                                                            }
                                                        }));
                                                        setSubcommunityPosts(formattedPosts);
                                                    }
                                                };
                                                fetchSub();
                                            } else {
                                                fetchCommunityData();
                                            }
                                        }}
                                        profile={currentUserProfile}
                                        communityId={['private', 'public', 'blog'].includes(activeView) ? community.id : activeView} // Use activeView as communityId if it's a subcommunity
                                        isPublicPost={activeView === 'public'} // Only true for main public feed
                                        placeholderText={
                                            activeView === 'public' ? "Share something with everyone..." :
                                                activeView === 'blog' ? "Write a blog post..." :
                                                    ['private'].includes(activeView) ? "What's on your mind, member?" :
                                                        `Post to ${subcommunities.find(s => s.id === activeView)?.name || 'subcommunity'}...`
                                        }
                                    />
                                </div>
                            )}

                            {activeView === 'private' && privatePosts.map((post, i) => <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}><PostComponent post={post} onImageClick={setLightboxUrl} /></div>)}
                            {activeView === 'public' && publicPosts.map((post, i) => <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}><PostComponent post={post} onImageClick={setLightboxUrl} /></div>)}
                            {activeView === 'blog' && blogPosts.map((post, i) => <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}><PostComponent post={post} onImageClick={setLightboxUrl} /></div>)}

                            {(activeView === 'private' && privatePosts.length === 0) && <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50"><p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">No member posts yet</p><p className="text-text-secondary-light dark:text-text-secondary">Be the first to share something with the community!</p></div>}
                            {(activeView === 'public' && publicPosts.length === 0) && <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50"><p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">No public posts yet</p><p className="text-text-secondary-light dark:text-text-secondary">This community hasn&apos;t shared anything publicly yet.</p></div>}
                            {(activeView === 'blog' && blogPosts.length === 0) && <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50"><p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">No blog posts yet</p><p className="text-text-secondary-light dark:text-text-secondary">This community has no blog posts.</p></div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SubcommunityLink: React.FC<{ label?: string, subcommunity?: Subcommunity, isActive: boolean, onClick: () => void, onJoinToggle?: (targetCommunityId: string, accessType: 'public' | 'restricted' | 'private', isMember: boolean, hasPendingRequest: boolean) => void }> = ({ label, subcommunity, isActive, onClick, onJoinToggle }) => {
    const isChannel = !!label;
    const name = label || subcommunity!.name;

    const handleJoinClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (subcommunity && onJoinToggle) {
            onJoinToggle(subcommunity.id, subcommunity.access_type, subcommunity.is_member, subcommunity.has_pending_request);
        }
    };

    return (
        <div onClick={isChannel || subcommunity?.is_member ? onClick : undefined} className={`group flex items-center justify-between p-2 rounded-lg transition-all ${isActive ? 'bg-brand-green/20 dark:bg-brand-green/20' : (isChannel || subcommunity?.is_member) ? 'hover:bg-tertiary-light/60 dark:hover:bg-tertiary/60 cursor-pointer' : 'opacity-70'}`}>
            <div className="flex items-center gap-2 min-w-0">
                {isChannel ? <span className="text-lg font-semibold text-text-tertiary-light dark:text-text-tertiary">#</span> : <UserGroupIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" />}
                <span className={`font-semibold truncate ${isActive ? 'text-brand-green' : 'text-text-secondary-light dark:text-text-secondary'}`}>{name}</span>
                {subcommunity?.access_type === 'restricted' && <LockClosedIcon className="w-3 h-3 text-text-tertiary-light dark:text-text-tertiary flex-shrink-0" />}
            </div>
            {!isChannel && !subcommunity?.is_member && onJoinToggle && (
                <button onClick={handleJoinClick} disabled={subcommunity?.has_pending_request} className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${subcommunity?.has_pending_request ? 'text-text-tertiary-light dark:text-text-tertiary' : 'text-brand-green hover:bg-brand-green/10'}`}>
                    {subcommunity?.has_pending_request ? 'Pending' : 'Join'}
                </button>
            )}
        </div>
    );
};

export default CommunityPage;
