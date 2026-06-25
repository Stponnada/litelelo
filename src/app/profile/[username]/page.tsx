'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import PostComponent from '@/components/Post';
import CreatePost from '@/components/CreatePost';
import { Post as PostType, Profile, Friend } from '@/types';
import Spinner from '@/components/Spinner';
import PostSkeleton from '@/components/PostSkeleton';
import ProfilePageSkeleton from '@/components/ProfilePageSkeleton';
import { CameraIcon, LogoutIcon, ChatIcon, UserGroupIcon, BookmarkIcon, ConsulIcon, UserPlusIcon, CheckIcon, XMarkIcon, XIcon, UserIcon, BookOpenIcon, HomeIcon, PhoneIcon, TrashIcon, EyeIcon, EyeSlashIcon, CalendarDaysIcon } from '@/components/icons';
import { isMscBranch, BITS_BRANCHES } from '@/data/bitsBranches';
import { BITS_DORMS } from '@/data/bitsDorms';
import { BITS_MESSES } from '@/data/bitsMesses';
import ImageCropper from '@/components/ImageCropper';
import FollowListModal from '@/components/FollowListModal';
import LightBox from '@/components/lightbox';
import Wall from '@/components/Wall';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getResizedAvatarUrl } from '@/utils/imageUtils';

interface CommunityLink {
    id: string;
    name: string;
    avatar_url: string | null;
    role: 'member' | 'admin';
}

const Flair: React.FC<{ flair: { id: string; name: string; avatar_url: string | null } }> = ({ flair }) => (
    <Link
        href={`/communities/${flair.id}`}
        className="group"
        title={flair.name}
    >
        <Image
            src={flair.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(flair.name)}`}
            alt={flair.name}
            width={24}
            height={24}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover transition-transform group-hover:scale-110 shadow-md border-2 border-secondary-light dark:border-secondary"
            unoptimized
        />
    </Link>
);


const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${isActive
            ? 'border-b-2 border-brand-green text-brand-green'
            : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main'
            }`}
    >
        {label}
    </button>
);

const FriendshipButtons: React.FC<{
    profile: Profile;
    isToggling: boolean;
    onFollow: () => void;
    onUnfollow: () => void;
    onMessage: () => void;
    onSendRequest: () => void;
    onAcceptRequest: () => void;
    onCancelOrDenyRequest: () => void;
}> = ({
    profile, isToggling, onFollow, onUnfollow, onMessage,
    onSendRequest, onAcceptRequest, onCancelOrDenyRequest
}) => {
        const isFriends = profile.is_following && profile.is_followed_by;

        // Highest priority: A request is pending from them to you.
        if (profile.has_received_request) {
            return (
                <>
                    <button
                        onClick={onAcceptRequest}
                        disabled={isToggling}
                        className="font-bold py-2 px-4 sm:px-6 rounded-full bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20 transition-all text-sm sm:text-base"
                    >
                        Accept
                    </button>
                    <button
                        onClick={onCancelOrDenyRequest}
                        disabled={isToggling}
                        className="p-2 sm:p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Deny Request"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </>
            );
        }

        // Next priority: You have sent a request to them.
        if (profile.has_sent_request) {
            return (
                <>
                    <button
                        disabled
                        className="font-bold py-2 px-4 sm:px-6 rounded-full bg-tertiary-light dark:bg-tertiary text-text-secondary-light dark:text-text-secondary cursor-not-allowed text-sm sm:text-base"
                    >
                        Sent
                    </button>
                    <button
                        onClick={onCancelOrDenyRequest}
                        disabled={isToggling}
                        className="p-2 sm:p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        title="Cancel Request"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </>
            );
        }

        // They are friends
        if (isFriends) {
            return (
                <>
                    <button onClick={onMessage} className="p-2 sm:p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
                    <button onClick={onUnfollow} disabled={isToggling} className="font-bold py-2 px-4 sm:px-6 rounded-full bg-transparent border-2 border-tertiary-light dark:border-tertiary text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-2 text-sm sm:text-base">
                        {isToggling ? <Spinner /> : <> <CheckIcon className="w-5 h-5" /> Friends </>}
                    </button>
                </>
            );
        }

        // Default: not friends and no pending request — offer to add them.
        // (Legacy one-way "follow" edges fall through to here in the friends-only model.)
        return (
            <>
                <button onClick={onMessage} className="p-2 sm:p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
                <button onClick={onSendRequest} disabled={isToggling} className="font-bold py-2 px-4 sm:px-6 rounded-full bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20 transition-all flex items-center gap-2 text-sm sm:text-base">
                    {isToggling ? <Spinner /> : <><UserPlusIcon className="w-5 h-5" /> <span className="hidden sm:inline">Add Friend</span><span className="sm:hidden">Add</span></>}
                </button>
            </>
        );
    };

interface ProfileRpcResult extends Omit<Profile, 'phone' | 'flair_details'> {
    phone: string | null;
    flair_details: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
}

interface ProfilePostRpcResult extends Omit<PostType, 'author'> {
    author_id: string;
    author_type: 'user' | 'community';
    author_name: string | null;
    author_username: string | null;
    author_avatar_url: string | null;
    author_flair_details: {
        id: string;
        name: string;
        avatar_url: string | null;
    } | null;
    parent_post_id: string | null;
    root_post_id: string | null;
    replying_to_username: string | null;
}

const ProfilePage: React.FC = () => {
    const params = useParams();
    const username = params?.username as string;
    const { user: currentUser, profile: currentUserProfile, updateProfileContext } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);
    const [hasWaved, setHasWaved] = useState(false);

    const [activeTab, setActiveTab] = useState<'posts' | 'mentions' | 'media'>('posts');
    const [posts, setPosts] = useState<PostType[]>([]);
    const [mentions, setMentions] = useState<PostType[]>([]);
    const [mediaPosts, setMediaPosts] = useState<PostType[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);

    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
    const [mutualFriendsLoading, setMutualFriendsLoading] = useState(true);

    const [communities, setCommunities] = useState<CommunityLink[]>([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);

    const [followModalState, setFollowModalState] = useState<{ isOpen: boolean; listType: 'followers' | 'following' | null; }>({ isOpen: false, listType: null });
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [isMutualFriendsModalOpen, setIsMutualFriendsModalOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // get_profile_details is fetched through a cached, service-role API route, so it
    // can't know who's viewing (relationship flags come back blank/shared) and it
    // doesn't return hometown/language. Enrich the base profile client-side with the
    // authenticated session so the friend button state and hometown are correct.
    const enrichProfile = useCallback(async (p: any) => {
        if (!p?.user_id) return p;
        const extraPromise = supabase
            .from('profiles')
            .select('hometown, language')
            .eq('user_id', p.user_id)
            .single();
        const relPromise = (currentUser && p.user_id !== currentUser.id)
            ? supabase
                .from('followers')
                .select('follower_id, following_id, status')
                .or(`and(follower_id.eq.${currentUser.id},following_id.eq.${p.user_id}),and(follower_id.eq.${p.user_id},following_id.eq.${currentUser.id})`)
            : Promise.resolve({ data: null as any });
        const [{ data: extra }, { data: edges }] = await Promise.all([extraPromise, relPromise]);
        const merged: any = {
            ...p,
            hometown: extra?.hometown ?? p.hometown ?? null,
            language: extra?.language ?? p.language ?? null,
        };
        if (edges && currentUser) {
            const outgoing = (edges as any[]).find(e => e.follower_id === currentUser.id);
            const incoming = (edges as any[]).find(e => e.following_id === currentUser.id);
            merged.is_following = !!outgoing;
            merged.is_followed_by = !!incoming;
            merged.has_sent_request = outgoing?.status === 'pending';
            merged.has_received_request = incoming?.status === 'pending';
        }
        return merged;
    }, [currentUser?.id]);

    const fetchProfileData = useCallback(async () => {
        if (!username) return;
        setProfileLoading(true);
        try {
            // Use our Redis-cached API route for the base (viewer-agnostic) profile.
            const response = await fetch(`/api/profile/${username}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Profile not found");
            setProfile(await enrichProfile(data));
        } catch (err: unknown) {
            console.error("Error fetching profile data via API, falling back to Supabase:", err);
            // Fallback to direct Supabase call if API fails
            const { data: directData, error: directError } = await supabase
                .rpc('get_profile_details', {
                    profile_username: username,
                })
                .single<ProfileRpcResult>();

            if (directError || !directData) throw directError || new Error("Profile not found");
            setProfile(await enrichProfile(directData));
        } finally {
            setProfileLoading(false);
        }
    }, [username, enrichProfile]);

    // Whether the current user has already waved at this profile (for the Wave button).
    useEffect(() => {
        if (!profile || !currentUser || profile.user_id === currentUser.id) { setHasWaved(false); return; }
        let active = true;
        supabase
            .from('waves')
            .select('sender_id')
            .eq('sender_id', currentUser.id)
            .eq('recipient_id', profile.user_id)
            .maybeSingle()
            .then(({ data }) => { if (active) setHasWaved(!!data); });
        return () => { active = false; };
    }, [profile?.user_id, currentUser?.id]);

    const handleWaveProfile = useCallback(async () => {
        if (!currentUser || !profile || hasWaved) return;
        setHasWaved(true);
        const wave = () => supabase
            .from('waves')
            .upsert({ sender_id: currentUser.id, recipient_id: profile.user_id }, { onConflict: 'sender_id,recipient_id', ignoreDuplicates: true });
        let { error } = await wave();
        if (error) {
            await supabase.auth.refreshSession().catch(() => {});
            ({ error } = await wave());
        }
        if (error) { console.error('litelelo: wave failed, reverting', error); setHasWaved(false); }
    }, [currentUser, profile, hasWaved]);

    const fetchPostsAndMentions = useCallback(async () => {
        if (!profile) return;
        setPostsLoading(true);

        const postsPromise = supabase.rpc('get_posts_for_profile', { p_user_id: profile.user_id });
        const mentionsPromise = supabase.rpc('get_mentions_for_user', { profile_user_id: profile.user_id });

        const [postsResult, mentionsResult] = await Promise.all([postsPromise, mentionsPromise]);

        if (postsResult.error) {
            console.error("Error fetching posts:", postsResult.error);
        } else {
            const fetchedPosts = (postsResult.data as ProfilePostRpcResult[] || []).map(p => ({
                ...p,
                author: {
                    author_id: p.author_id,
                    author_type: p.author_type,
                    author_name: p.author_name,
                    author_username: p.author_username,
                    author_avatar_url: p.author_avatar_url,
                    author_flair_details: p.author_flair_details,
                }
            }));
            setPosts(fetchedPosts);
            setMediaPosts(fetchedPosts.filter((p: PostType) => !!p.image_url));
        }

        if (mentionsResult.error) {
            console.error("Error fetching mentions:", mentionsResult.error)
        } else {
            const fetchedMentions = (mentionsResult.data as ProfilePostRpcResult[] || []).map(p => ({
                ...p,
                author: {
                    author_id: p.author_id,
                    author_type: p.author_type,
                    author_name: p.author_name,
                    author_username: p.author_username,
                    author_avatar_url: p.author_avatar_url,
                    author_flair_details: p.author_flair_details,
                }
            }));
            setMentions(fetchedMentions);
        }

        setPostsLoading(false);
    }, [profile]);

    const handlePostCreated = (newPost: PostType) => {
        // Check for @rock mention
        import('@/utils/aiUtils').then(({ checkForAiMention }) => {
            checkForAiMention(newPost);
        });

        if (newPost.content?.toLowerCase().includes('@rock')) {
            setTimeout(() => {
                setPosts(prevPosts => [newPost, ...prevPosts]);
                fetchPostsAndMentions();
            }, 1500);
        } else {
            setPosts(prevPosts => [newPost, ...prevPosts]);
        }
    };

    const fetchFriendshipData = useCallback(async () => {
        if (!profile || !currentUser) return;
        setFriendsLoading(true);
        setMutualFriendsLoading(true);
        try {
            // Promise for profile user's friends
            const profileFriendsPromise = supabase.rpc('get_mutual_followers', { p_user_id: profile.user_id });

            // Promise for current user's friends (if not viewing own profile)
            const isOwnProfile = profile.user_id === currentUser.id;
            const currentUserFriendsPromise = isOwnProfile
                ? Promise.resolve({ data: null, error: null })
                : supabase.rpc('get_mutual_followers', { p_user_id: currentUser.id });

            const [profileFriendsResult, currentUserFriendsResult] = await Promise.all([profileFriendsPromise, currentUserFriendsPromise]);

            if (profileFriendsResult.error) throw profileFriendsResult.error;
            const profileFriends = profileFriendsResult.data || [];
            setFriends(profileFriends);

            if (currentUserFriendsResult.error) throw currentUserFriendsResult.error;

            if (!isOwnProfile) {
                const currentUserFriends = currentUserFriendsResult.data || [];
                // Find the intersection
                const mutuals = profileFriends.filter((profileFriend: Friend) =>
                    currentUserFriends.some((currentUserFriend: Friend) => currentUserFriend.user_id === profileFriend.user_id)
                );
                setMutualFriends(mutuals);
            } else {
                setMutualFriends([]);
            }

        } catch (err: unknown) {
            console.error("Error fetching friendship data:", err);
            setFriends([]);
            setMutualFriends([]);
        } finally {
            setFriendsLoading(false);
            setMutualFriendsLoading(false);
        }
    }, [profile, currentUser?.id]);

    const fetchCommunities = useCallback(async () => {
        if (!profile) return;
        setCommunitiesLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_communities_for_user', { p_user_id: profile.user_id });
            if (error) throw error;
            setCommunities(data || []);
        } catch (err: unknown) {
            console.error("Error fetching communities:", err);
        } finally {
            setCommunitiesLoading(false);
        }
    }, [profile]);


    useEffect(() => {
        fetchProfileData();
    }, [username, fetchProfileData]);

    useEffect(() => {
        if (profile) {
            fetchPostsAndMentions();
            fetchFriendshipData();
            fetchCommunities();
        }
    }, [profile, fetchPostsAndMentions, fetchFriendshipData, fetchCommunities]);

    const handleMessageUser = () => {
        if (!profile) return;
        router.push(`/chat?recipientId=${profile.user_id}`);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        router.push('/login');
    };

    const handleFollow = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        const originalFollowerCount = profile.follower_count;
        setProfile({ ...profile, is_following: true, follower_count: profile.follower_count + 1 });
        const { error: rpcError } = await supabase.rpc('follow_user', { user_to_follow_id: profile.user_id });
        if (rpcError) {
            console.error("Error following user:", rpcError);
            setProfile({ ...profile, is_following: false, follower_count: originalFollowerCount });
        }
        setIsTogglingFollow(false);
    };

    const handleUnfollow = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        const originalFollowerCount = profile.follower_count;
        const originalIsFollowedBy = profile.is_followed_by;
        setProfile({ ...profile, is_following: false, follower_count: profile.follower_count - 1 });
        const { error: rpcError } = await supabase.rpc('unfollow_user', { user_to_unfollow_id: profile.user_id });
        if (rpcError) {
            console.error("Error unfollowing user:", rpcError);
            setProfile({ ...profile, is_following: true, follower_count: originalFollowerCount, is_followed_by: originalIsFollowedBy });
        }
        setIsTogglingFollow(false);
    };

    const handleSendRequest = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        setProfile({ ...profile, has_sent_request: true });
        const { error: rpcError } = await supabase.rpc('send_friend_request', { recipient_id: profile.user_id });
        if (rpcError) {
            console.error("Error sending request:", rpcError);
            setProfile({ ...profile, has_sent_request: false });
        }
        setIsTogglingFollow(false);
    };

    const handleAcceptRequest = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        setProfile({
            ...profile,
            has_received_request: false,
            is_following: true,
            is_followed_by: true,
            follower_count: profile.follower_count + 1,
        });
        const { error: rpcError } = await supabase.rpc('accept_friend_request', { requester_id: profile.user_id });
        if (rpcError) {
            console.error("Error accepting request:", rpcError);
            fetchProfileData();
        }
        setIsTogglingFollow(false);
    };

    const handleCancelOrDenyRequest = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        const wasRequestSent = profile.has_sent_request;
        setProfile({ ...profile, has_sent_request: false, has_received_request: false });
        const { error: rpcError } = await supabase.rpc('cancel_or_deny_friend_request', { other_user_id: profile.user_id });
        if (rpcError) {
            console.error("Error cancelling/denying request:", rpcError);
            setProfile({ ...profile, has_sent_request: wasRequestSent, has_received_request: !wasRequestSent });
        }
        setIsTogglingFollow(false);
    };

    if (profileLoading) {
        return <ProfilePageSkeleton />;
    }

    if (!profile) {
        return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    }

    const isOwnProfile = currentUser?.id === profile.user_id;
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    const formattedBirthday = profile.birthday
        ? format(new Date(profile.birthday), 'MMMM d')
        : null;

    return (
        <>
            {isEditModalOpen && profile && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
            {followModalState.isOpen && profile && followModalState.listType && <FollowListModal profile={profile} listType={followModalState.listType} onClose={() => setFollowModalState({ isOpen: false, listType: null })} />}
            {isFriendsModalOpen && profile && <FriendsListModal profile={profile} onClose={() => setIsFriendsModalOpen(false)} />}
            {isMutualFriendsModalOpen && profile && (
                <MutualFriendsListModal
                    mutualFriends={mutualFriends}
                    onClose={() => setIsMutualFriendsModalOpen(false)}
                    profile={profile}
                />
            )}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <div className="w-full max-w-7xl mx-auto pb-8">
                {/* Main Profile Card */}
                <div className="relative mb-6 overflow-visible">
                    {/* Banner Image */}
                    <div className="h-44 sm:h-64 bg-gradient-to-br from-tertiary-light to-tertiary-light/50 dark:from-tertiary dark:to-tertiary/50 relative rounded-b-3xl overflow-hidden shadow-lg">
                        {profile.banner_url ? (
                            <Image
                                src={profile.banner_url}
                                alt="Banner"
                                fill
                                className="object-cover"
                                sizes="(max-width: 1280px) 100vw, 1280px"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-blue-500/20"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    </div>

                    {/* Profile Info Overlay */}
                    <div className="px-4 sm:px-8 pb-3 relative -mt-20 sm:-mt-28 flex flex-col sm:flex-row items-end gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative z-10 flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-secondary-light dark:border-secondary bg-tertiary overflow-hidden shadow-2xl">
                                <Image
                                    src={getResizedAvatarUrl(profile.avatar_url, 144, 144, profile.full_name || profile.username)}
                                    alt={profile.full_name || profile.username}
                                    width={144}
                                    height={144}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>

                        {/* Info & Actions */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4 text-center sm:text-left mt-2 sm:mt-0">
                            {/* Text Info */}
                            <div className="text-black md:text-white pb-2">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-md">
                                        {profile.full_name}
                                    </h1>
                                    {profile.flair_details && <Flair flair={profile.flair_details} />}
                                </div>
                                <p className="text-black md:text-white pb-2 font-medium text-sm sm:text-base">
                                    @{profile.username}
                                </p>

                                <div className="flex items-center justify-center sm:justify-start gap-6 mt-3 text-sm text-black sm:text-white">
                                    <button
                                        onClick={() => setIsFriendsModalOpen(true)}
                                        className="hover:text-brand-green transition-colors drop-shadow-lg"
                                    >
                                        <span className="font-bold text-base">{friends.length}</span>
                                        <span className="ml-1">{friends.length === 1 ? 'Friend' : 'Friends'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-center sm:justify-end gap-2 pb-2">
                                {isOwnProfile ? (
                                    <>
                                        <Link href="/bookmarks" className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 hover:bg-brand-green/30 hover:border-brand-green/50 text-white transition-all" title="Bookmarks">
                                            <BookmarkIcon className="w-5 h-5" />
                                        </Link>
                                        <button onClick={() => setIsEditModalOpen(true)} className="font-semibold py-2.5 px-6 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-brand-green/30 hover:border-brand-green/50 transition-all text-sm sm:text-base">
                                            Edit Profile
                                        </button>
                                        <button onClick={handleSignOut} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-red-400 hover:bg-red-500/30 hover:border-red-500/50 transition-all" title="Sign Out">
                                            <LogoutIcon className="w-5 h-5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleWaveProfile}
                                            disabled={hasWaved}
                                            className={`font-bold py-2 px-4 sm:px-6 rounded-full transition-all text-sm sm:text-base ${hasWaved
                                                ? 'bg-brand-green/15 text-brand-green cursor-default'
                                                : 'bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80'}`}
                                            title={hasWaved ? 'You waved at them' : 'Wave'}
                                        >
                                            {hasWaved ? 'Waved 👋' : 'Wave 👋'}
                                        </button>
                                        <FriendshipButtons
                                            profile={profile}
                                            isToggling={isTogglingFollow}
                                            onFollow={handleFollow}
                                            onUnfollow={handleUnfollow}
                                            onMessage={handleMessageUser}
                                            onSendRequest={handleSendRequest}
                                            onAcceptRequest={handleAcceptRequest}
                                            onCancelOrDenyRequest={handleCancelOrDenyRequest}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wall — friendships (public) plus, for the owner, waves and requests */}
                <div className="px-4 sm:px-6 mb-6">
                    <h3 className="text-sm font-bold text-text-main-light dark:text-white mb-3">
                        {isOwnProfile ? 'Your wall' : `${profile.full_name || profile.username}'s wall`}
                    </h3>
                    <Wall ownerId={profile.user_id} isOwner={isOwnProfile} ownerName={profile.full_name} />
                </div>

                <div className="px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Details Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="glass-panel rounded-2xl p-6 space-y-6">
                                {profile.bio && (
                                    <div>
                                        <h3 className="text-lg font-bold text-text-main-light dark:text-white mb-2">About</h3>
                                        <p className="text-text-secondary-light dark:text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                                    </div>
                                )}

                                {profile.roommates && profile.roommates.length > 0 && (
                                    <>
                                        <hr className="border-tertiary-light dark:border-white/10" />
                                        <div>
                                            <h3 className="text-sm font-bold text-text-main-light dark:text-white mb-2">Roomies</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.roommates.map((roomie) => (
                                                    <Link href={`/profile/${roomie.username}`} key={roomie.user_id} className="inline-flex items-center gap-2 bg-tertiary-light dark:bg-white/5 px-3 py-1 rounded-full text-xs font-medium hover:bg-brand-green/20 transition-colors">
                                                        <span className="text-brand-green">@</span>{roomie.full_name || roomie.username}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                <hr className="border-tertiary-light dark:border-white/10" />

                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-text-main-light dark:text-white">Details</h3>
                                    <div className="space-y-2.5 text-sm text-text-secondary-light dark:text-text-secondary">
                                        <ProfileDetail label="Birthday" value={formattedBirthday} />
                                        <ProfileDetail label="Campus" value={profile.campus} />
                                        <ProfileDetail label="Hometown" value={profile.hometown} />
                                        <ProfileDetail label="Language" value={profile.language} />
                                        <ProfileDetail label="Class of" value={profile.admission_year ? `${profile.admission_year + 4}` : null} />
                                        <ProfileDetail label="Primary Degree" value={profile.branch} />
                                        <ProfileDetail label="B.E. Degree" value={profile.dual_degree_branch} />
                                        <ProfileDetail label="Relationship" value={profile.relationship_status} />
                                        <ProfileDetail label="Dorm" value={dormInfo} />
                                        <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                                        <ProfileDetail label="Phone" value={profile.phone || null} />
                                    </div>
                                </div>

                                {!isOwnProfile && !mutualFriendsLoading && mutualFriends.length > 0 && (
                                    <>
                                        <hr className="border-tertiary-light dark:border-white/10" />
                                        <div>
                                            <button onClick={() => setIsMutualFriendsModalOpen(true)} className="w-full text-left hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 p-2 -m-2 rounded-lg transition-colors">
                                                <h3 className="text-sm font-bold text-text-main-light dark:text-white mb-2">Mutual Friends</h3>
                                                <div className="flex items-center">
                                                    <div className="flex flex-wrap -space-x-2">
                                                        {mutualFriends.slice(0, 7).map(friend => (
                                                            <Image
                                                                key={friend.user_id}
                                                                src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.username)}&background=random&color=fff&bold=true`}
                                                                alt={friend.username}
                                                                width={32}
                                                                height={32}
                                                                className="w-8 h-8 rounded-full object-cover ring-2 ring-secondary-light dark:ring-secondary"
                                                                title={friend.full_name || friend.username}
                                                                unoptimized
                                                            />
                                                        ))}
                                                    </div>
                                                    {mutualFriends.length > 7 && (
                                                        <span className="text-xs font-bold pl-4 text-text-tertiary-light dark:text-text-tertiary">
                                                            +{mutualFriends.length - 7}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-2">
                                                    You and {profile.full_name?.split(' ')[0]} have {mutualFriends.length} friend{mutualFriends.length > 1 ? 's' : ''} in common.
                                                </p>
                                            </button>
                                        </div>
                                    </>
                                )}

                                {!friendsLoading && friends.length > 0 && (
                                    <>
                                        <hr className="border-tertiary-light dark:border-white/10" />
                                        <div>
                                            <button onClick={() => setIsFriendsModalOpen(true)} className="flex items-center justify-between w-full text-sm font-bold text-text-main-light dark:text-white mb-3 hover:text-brand-green transition-colors">
                                                <span>Friends</span>
                                                <span className="text-xs text-text-tertiary-light font-normal">{friends.length}</span>
                                            </button>
                                            <div className="grid grid-cols-3 gap-3">
                                                {friends.slice(0, 9).map(friend => (
                                                    <Link href={`/profile/${friend.username}`} key={friend.user_id} className="group flex flex-col items-center text-center">
                                                        <Image
                                                            src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.username)}&background=random&color=fff&bold=true`}
                                                            alt={friend.username}
                                                            width={48}
                                                            height={48}
                                                            className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all"
                                                            unoptimized
                                                        />
                                                        <span className="mt-1 text-[11px] leading-tight text-text-secondary-light dark:text-text-secondary group-hover:text-brand-green transition-colors truncate w-full">
                                                            {friend.full_name || friend.username}
                                                        </span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!communitiesLoading && communities.length > 0 && (
                                    <>
                                        <hr className="border-tertiary-light dark:border-white/10" />
                                        <div>
                                            <h3 className="text-sm font-bold text-text-main-light dark:text-white mb-3">Communities</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {communities.slice(0, 5).map(community => (
                                                    <Link href={`/communities/${community.id}`} key={community.id} className="group relative">
                                                        <Image
                                                            src={community.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=random&color=fff&bold=true`}
                                                            alt={community.name}
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all"
                                                            title={community.name}
                                                            unoptimized
                                                        />
                                                        {community.role === 'admin' && (
                                                            <div className="absolute -top-1 -right-1 bg-secondary-light dark:bg-secondary rounded-full p-0.5">
                                                                <ConsulIcon className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Feed Section */}
                        <div className="lg:col-span-2 space-y-6">
                            {isOwnProfile && currentUserProfile && (
                                <div className="glass-panel rounded-2xl overflow-hidden p-1">
                                    <CreatePost onPostCreated={handlePostCreated} profile={currentUserProfile} />
                                </div>
                            )}

                            <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px]">
                                <div className="flex border-b border-tertiary-light/50 dark:border-white/10">
                                    <TabButton label="Posts" isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                                    <TabButton label="Photos" isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                                    <TabButton label="Mentions" isActive={activeTab === 'mentions'} onClick={() => setActiveTab('mentions')} />
                                </div>
                                <div className="p-4">
                                    {postsLoading ? (
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
                                                <PostSkeleton key={i} />
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {activeTab === 'posts' && (
                                                <div className="space-y-4">
                                                    {posts.length > 0 ? (
                                                        posts.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />)
                                                    ) : (
                                                        <div className="text-center py-16 text-text-tertiary-light dark:text-text-tertiary">
                                                            <p className="text-lg font-medium">No posts yet</p>
                                                            <p className="text-sm opacity-70">Share your first post!</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {activeTab === 'mentions' && (
                                                <div className="space-y-4">
                                                    {mentions.length > 0 ? (
                                                        mentions.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />)
                                                    ) : (
                                                        <div className="text-center py-16 text-text-tertiary-light dark:text-text-tertiary">
                                                            <p className="text-lg font-medium">No mentions yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {activeTab === 'media' && (
                                                mediaPosts.length > 0 ? (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {mediaPosts.map(post => (
                                                            <Link href={`/post/${post.id}`} key={post.id} className="group relative aspect-square rounded-xl overflow-hidden bg-tertiary-light dark:bg-white/5">
                                                                <img src={post.image_url!} alt="Post media" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.preventDefault(); setLightboxUrl(post.image_url!); }}>
                                                                    <span className="text-white font-bold bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">View</span>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-16 text-text-tertiary-light dark:text-text-tertiary">
                                                        <p className="text-lg font-medium">No media posted yet</p>
                                                    </div>
                                                )
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const MutualFriendsListModal: React.FC<{
    mutualFriends: Friend[];
    profile: Profile;
    onClose: () => void;
}> = ({ mutualFriends, profile, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl w-full flex flex-col
                           max-w-md md:max-w-2xl lg:max-w-4xl max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-tertiary-light dark:border-tertiary flex items-center justify-between sticky top-0 bg-secondary-light dark:bg-secondary rounded-t-2xl">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-white">Mutual Friends</h2>
                    <button onClick={onClose} className="text-2xl text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main">&times;</button>
                </div>
                <div className="overflow-y-auto p-4">
                    {mutualFriends.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                            {mutualFriends.map(friend => (
                                <Link
                                    href={`/profile/${friend.username}`}
                                    onClick={onClose}
                                    key={friend.user_id}
                                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors text-center"
                                >
                                    <img
                                        src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.username)}&background=random&color=fff&bold=true`}
                                        alt={friend.username}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                    />
                                    <div className="w-full">
                                        <p className="font-semibold text-sm text-text-main-light dark:text-text-main truncate">{friend.full_name || friend.username}</p>
                                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{friend.username}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-tertiary-light dark:text-text-tertiary p-8">You have no mutual friends with {profile.full_name?.split(' ')[0]}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const FriendsListModal: React.FC<{ profile: Profile; onClose: () => void }> = ({ profile, onClose }) => {
    const [fullFriendsList, setFullFriendsList] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllFriends = async () => {
            if (!profile) return;
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_mutual_followers', { p_user_id: profile.user_id });
                if (error) throw error;
                setFullFriendsList(data || []);
            } catch (error) {
                console.error("Error fetching full friends list:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllFriends();
    }, [profile]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl w-full flex flex-col
                           max-w-md md:max-w-2xl lg:max-w-4xl max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 border-b border-tertiary-light dark:border-tertiary flex items-center justify-between sticky top-0 bg-secondary-light dark:bg-secondary rounded-t-2xl">
                    <h2 className="text-xl font-bold text-text-main-light dark:text-white">Friends</h2>
                    <button onClick={onClose} className="text-2xl text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main">&times;</button>
                </div>
                <div className="overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Spinner /></div>
                    ) : fullFriendsList.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
                            {fullFriendsList.map(friend => (
                                <Link
                                    href={`/profile/${friend.username}`}
                                    onClick={onClose}
                                    key={friend.user_id}
                                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors text-center"
                                >
                                    <img
                                        src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.username)}&background=random&color=fff&bold=true`}
                                        alt={friend.username}
                                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                                    />
                                    <div className="w-full">
                                        <p className="font-semibold text-sm text-text-main-light dark:text-text-main truncate">{friend.full_name || friend.username}</p>
                                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{friend.username}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-text-tertiary-light dark:text-text-tertiary p-8">{profile.full_name?.split(' ')[0]} has no friends yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const EditProfileModal: React.FC<{
    userProfile: Profile,
    onClose: () => void,
    onSave: () => void
}> = ({ userProfile, onClose, onSave }) => {
    const { user, updateProfileContext } = useAuth();
    const router = useRouter();

    // States
    const [profileData, setProfileData] = useState(userProfile);
    const [privacySettings, setPrivacySettings] = useState<{ [key: string]: 'public' | 'private' }>(userProfile.privacy_settings || {});
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [joinedCommunities, setJoinedCommunities] = useState<CommunityLink[]>([]);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [availableDorms, setAvailableDorms] = useState<string[]>([]);
    const [availableMesses, setAvailableMesses] = useState<string[]>([]);
    const [isDualDegreeStudent, setIsDualDegreeStudent] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [cropperState, setCropperState] = useState<{
        isOpen: boolean;
        type: 'avatar' | 'banner' | null;
        src: string | null;
    }>({ isOpen: false, type: null, src: null });

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Logic: Handle Branch Data
    useEffect(() => {
        const campus = profileData.campus;
        if (campus && BITS_BRANCHES[campus]) {
            const campusBranches = BITS_BRANCHES[campus];
            setAvailableBranches(Object.values(campusBranches).flat());
            setIsDualDegreeStudent(isMscBranch(profileData.branch || '', campus));
        }
    }, [profileData.campus, profileData.branch]);

    // Logic: Fetch Flairs
    useEffect(() => {
        if (!user) return;
        const fetchUserCommunities = async () => {
            const { data } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id });
            setJoinedCommunities(data || []);
        };
        fetchUserCommunities();
    }, [user]);

    // Logic: Handle Dorm Data
    useEffect(() => {
        const { campus, gender } = profileData;
        if (campus && gender && BITS_DORMS[campus] && BITS_DORMS[campus][gender]) {
            const dorms = BITS_DORMS[campus][gender];
            setAvailableDorms(dorms);
            if (!dorms.includes(profileData.dorm_building || '')) {
                setProfileData(prev => ({ ...prev, dorm_building: null }));
            }
        } else {
            setAvailableDorms([]);
        }
    }, [profileData.campus, profileData.gender]);

    // Logic: Handle Mess Data
    useEffect(() => {
        const { campus } = profileData;
        if (campus && BITS_MESSES[campus]) {
            const messes = BITS_MESSES[campus];
            setAvailableMesses(messes);
            if (!messes.includes(profileData.dining_hall || '')) {
                setProfileData(prev => ({ ...prev, dining_hall: null }));
            }
        } else {
            setAvailableMesses([]);
        }
    }, [profileData.campus]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setCropperState({ isOpen: true, type, src: reader.result as string });
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleCropSave = (croppedImageFile: File) => {
        const previewUrl = URL.createObjectURL(croppedImageFile);
        if (cropperState.type === 'avatar') {
            setAvatarFile(croppedImageFile);
            setAvatarPreview(previewUrl);
        } else {
            setBannerFile(croppedImageFile);
            setBannerPreview(previewUrl);
        }
        setCropperState({ isOpen: false, type: null, src: null });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => {
            const updated = { ...prev, [name]: value };
            // Clear dual degree if switching to non-MSc branch
            if (name === 'branch' && !isMscBranch(value, updated.campus || '')) {
                updated.dual_degree_branch = null;
            }
            return updated;
        });
    };

    const togglePrivacy = (field: string) => {
        setPrivacySettings(prev => ({
            ...prev,
            [field]: prev[field] === 'private' ? 'public' : 'private'
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setError('');

        try {
            let avatar_url = profileData.avatar_url;
            let banner_url = profileData.banner_url;

            // Upload Logic
            if (avatarFile) {
                const path = `${user.id}/avatar_${Date.now()}`;
                await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
                avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
            }
            if (bannerFile) {
                const path = `${user.id}/banner_${Date.now()}`;
                await supabase.storage.from('avatars').upload(path, bannerFile, { upsert: true });
                banner_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
            }

            const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({
                username: profileData.username,
                full_name: profileData.full_name,
                bio: profileData.bio,
                branch: profileData.branch,
                dual_degree_branch: profileData.dual_degree_branch || null,
                relationship_status: profileData.relationship_status,
                dorm_building: profileData.dorm_building,
                dorm_room: profileData.dorm_room,
                dining_hall: profileData.dining_hall,
                phone: profileData.phone || null,
                displayed_community_flair: profileData.displayed_community_flair || null,
                avatar_url,
                banner_url,
                birthday: profileData.birthday,
                privacy_settings: privacySettings,
                updated_at: new Date().toISOString()
            }).eq('user_id', user.id).select().single();

            if (updateError) {
                if (updateError.message.includes('profiles_username_key')) {
                    throw new Error('That username is already taken. Please choose another.');
                }
                throw updateError;
            }

            // Invalidate Redis cache for both old and new username (if changed) and by ID
            try {
                await fetch(`/api/profile/${userProfile.username}`, { method: 'POST' });
                await fetch(`/api/profile/by-id/${user.id}`, { method: 'POST' });

                if (profileData.username !== userProfile.username) {
                    await fetch(`/api/profile/${profileData.username}`, { method: 'POST' });
                }
            } catch (cacheErr) {
                console.warn("Failed to invalidate cache, it will expire naturally:", cacheErr);
            }

            updateProfileContext(updatedProfile);
            if (profileData.username !== userProfile.username) {
                router.replace(`/profile/${updatedProfile.username}`);
            } else {
                onSave();
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving your profile.');
        } finally {
            setIsSaving(false);
        }
    };
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError('');
        try {
            const { error: deleteError } = await supabase.rpc('delete_own_account');
            if (deleteError) throw deleteError;

            // Success! Sign out and redirect
            await supabase.auth.signOut({ scope: 'local' });
            router.push('/login');
        } catch (err: any) {
            setError(err.message || 'An error occurred while deleting your account.');
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (showDeleteConfirm) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-secondary dark:bg-primary border border-red-500/20 w-full max-w-md rounded-[32px] p-8 text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TrashIcon className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Delete Account?</h2>
                    <p className="text-text-tertiary mb-8">
                        This action is permanent. All your posts, profile data, and messages will be gone forever.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Spinner /> : 'Yes, Delete Everything'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="w-full py-4 bg-tertiary dark:bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (cropperState.isOpen && cropperState.src) {
        return (
            <ImageCropper
                imageSrc={cropperState.src}
                aspect={cropperState.type === 'avatar' ? 1 : 21 / 9}
                cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
                onSave={handleCropSave}
                onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
                isSaving={isSaving}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-secondary-light dark:bg-primary border border-tertiary-light/30 dark:border-white/10 w-full max-w-5xl max-h-[95vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Scrollable Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto scrollbar-hide">

                    {/* Media Header Section */}
                    <div className="relative h-44 bg-secondary/50">
                        {bannerPreview ? (
                            <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-transparent" />
                        )}
                        <button
                            type="button"
                            onClick={() => bannerInputRef.current?.click()}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] group"
                        >
                            <div className="flex flex-col items-center gap-2 transform group-hover:scale-110 transition-transform duration-300">
                                <CameraIcon className="w-8 h-8 text-white" />
                                <span className="text-white text-sm font-semibold">Update Banner</span>
                            </div>
                        </button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />

                        {/* Avatar */}
                        <div className="absolute -bottom-12 left-8">
                            <div className="relative w-28 h-28 rounded-3xl border-[6px] border-[#0B0E11] bg-secondary overflow-hidden shadow-xl">
                                <img src={avatarPreview || `https://ui-avatars.com/api/?name=${profileData.full_name}`} className="w-full h-full object-cover" alt="Avatar" />
                                <button
                                    type="button"
                                    onClick={() => avatarInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 group"
                                >
                                    <div className="flex flex-col items-center gap-1 transform group-hover:scale-110 transition-transform duration-300">
                                        <CameraIcon className="w-6 h-6 text-white" />
                                        <span className="text-white text-xs font-semibold">Edit</span>
                                    </div>
                                </button>
                                <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pt-16 pb-6 space-y-6">
                        {/* Title & Errors */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black text-text-main-light dark:text-white">Edit Profile</h2>
                                <p className="text-text-secondary-light dark:text-text-tertiary text-sm">Customize your campus presence.</p>
                            </div>
                            <button onClick={onClose} type="button" className="p-2 hover:bg-tertiary-light/50 dark:hover:bg-white/5 rounded-full transition-colors">
                                <XIcon className="w-6 h-6 text-text-secondary-light dark:text-text-tertiary" />
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-start gap-3"
                            >
                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Section: Identity */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-brand-green text-xs font-bold uppercase tracking-widest">
                                <UserIcon className="w-4 h-4" /> Identity
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField label="Full Name" name="full_name" value={profileData.full_name} onChange={handleChange} />
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-xs font-bold text-text-secondary-light dark:text-text-tertiary ml-1">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green font-bold text-lg">@</span>
                                        <input
                                            type="text"
                                            name="username"
                                            value={profileData.username || ''}
                                            onChange={handleChange}
                                            className="w-full bg-tertiary-light dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 pl-10 text-text-main-light dark:text-white outline-none focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/10 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField
                                    label="Birthday"
                                    name="birthday"
                                    type="date"
                                    value={profileData.birthday}
                                    onChange={handleChange}
                                    isPrivate={privacySettings['birthday'] === 'private'}
                                    onTogglePrivacy={() => togglePrivacy('birthday')}
                                />
                            </div>
                            {/* Read-only Campus & Batch Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1.5 flex-1 opacity-70">
                                    <label className="text-xs font-bold text-text-secondary-light dark:text-text-tertiary ml-1">Campus</label>
                                    <div className="w-full bg-tertiary-light/50 dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 text-text-main-light dark:text-white cursor-not-allowed">
                                        {profileData.campus || 'N/A'}
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1 opacity-70">
                                    <label className="text-xs font-bold text-text-secondary-light dark:text-text-tertiary ml-1">Class of</label>
                                    <div className="w-full bg-tertiary-light/50 dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 text-text-main-light dark:text-white cursor-not-allowed">
                                        {profileData.admission_year ? profileData.admission_year + 4 : 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-tertiary ml-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={profileData.bio || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    maxLength={500}
                                    className="w-full bg-tertiary-light dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 text-text-main-light dark:text-white outline-none focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/10 transition-all resize-none"
                                    placeholder="Briefly describe yourself..."
                                />
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-xs text-text-secondary-light dark:text-text-tertiary">Share a bit about yourself</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-tertiary">
                                        {profileData.bio?.length || 0}/500
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Contact */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-brand-green text-xs font-bold uppercase tracking-widest">
                                <PhoneIcon className="w-4 h-4" /> Contact
                            </div>
                            <InputField
                                label="Phone Number (Optional)"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleChange}
                                type="tel"
                                placeholder="+91 98765 43210"
                                isPrivate={privacySettings['phone'] === 'private'}
                                onTogglePrivacy={() => togglePrivacy('phone')}
                            />
                        </div>

                        {/* Section: Academics */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-brand-green text-xs font-bold uppercase tracking-widest">
                                <BookOpenIcon className="w-4 h-4" /> Academic Info
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <SelectField
                                    label="Primary Degree"
                                    name="branch"
                                    value={profileData.branch}
                                    options={availableBranches}
                                    onChange={handleChange}
                                    isPrivate={privacySettings['branch'] === 'private'}
                                    onTogglePrivacy={() => togglePrivacy('branch')}
                                />
                                <AnimatePresence mode="wait">
                                    {isDualDegreeStudent && (
                                        <motion.div
                                            key="dual-degree"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <SelectField
                                                label="B.E. Degree"
                                                name="dual_degree_branch"
                                                value={profileData.dual_degree_branch}
                                                options={profileData.campus ? BITS_BRANCHES[profileData.campus]['B.E.'] : []}
                                                onChange={handleChange}
                                                isPrivate={privacySettings['branch'] === 'private'} // Assuming both branches share privacy setting
                                                onTogglePrivacy={() => togglePrivacy('branch')}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <SelectField
                                    label="Featured Community Flair"
                                    name="displayed_community_flair"
                                    value={profileData.displayed_community_flair}
                                    options={joinedCommunities.map(c => ({ label: c.name, value: c.id }))}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Section: Lifestyle */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-brand-green text-xs font-bold uppercase tracking-widest">
                                <HomeIcon className="w-4 h-4" /> Lifestyle
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <SelectField
                                    label="Dorm Building"
                                    name="dorm_building"
                                    value={profileData.dorm_building}
                                    options={availableDorms}
                                    onChange={handleChange}
                                    isPrivate={privacySettings['dorm'] === 'private'}
                                    onTogglePrivacy={() => togglePrivacy('dorm')}
                                />
                                <InputField
                                    label="Room No."
                                    name="dorm_room"
                                    value={profileData.dorm_room}
                                    onChange={handleChange}
                                    type="number"
                                    placeholder="469"
                                    isPrivate={privacySettings['dorm'] === 'private'}
                                    onTogglePrivacy={() => togglePrivacy('dorm')}
                                />
                                <SelectField
                                    label="Dining Hall"
                                    name="dining_hall"
                                    value={profileData.dining_hall}
                                    options={availableMesses}
                                    onChange={handleChange}
                                    isPrivate={privacySettings['dining_hall'] === 'private'}
                                    onTogglePrivacy={() => togglePrivacy('dining_hall')}
                                />
                            </div>
                            <SelectField
                                label="Relationship"
                                name="relationship_status"
                                value={profileData.relationship_status}
                                options={['Single', 'In a relationship', "It's complicated", 'Married']}
                                onChange={handleChange}
                                isPrivate={privacySettings['relationship_status'] === 'private'}
                                onTogglePrivacy={() => togglePrivacy('relationship_status')}
                            />
                        </div>

                        {/* Section: Danger Zone */}
                        <div className="pt-6 border-t border-tertiary-light/50 dark:border-white/10">
                            <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-3xl border border-red-500/10">
                                <div>
                                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Danger Zone</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-tertiary mt-1">Once you delete your account, there is no going back.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Delete Account
                                </button>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-text-tertiary font-bold hover:text-white transition-colors"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-10 py-3 bg-brand-green text-black font-black rounded-2xl shadow-xl shadow-brand-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Spinner /> : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// --- Helper Components for Cleanliness ---

interface InputFieldProps {
    label: string;
    name: string;
    value: string | number | null | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
    isPrivate?: boolean;
    onTogglePrivacy?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = "text", placeholder = "", isPrivate, onTogglePrivacy }) => (
    <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-tertiary">{label}</label>
            {onTogglePrivacy && (
                <button
                    type="button"
                    onClick={onTogglePrivacy}
                    className={`p-1 rounded-full transition-colors ${isPrivate ? 'text-brand-green bg-brand-green/10' : 'text-text-tertiary hover:text-text-secondary'}`}
                    title={isPrivate ? "Private" : "Public"}
                >
                    {isPrivate ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-tertiary-light dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 text-text-main-light dark:text-white outline-none focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/10 transition-all placeholder:text-text-tertiary/50"
        />
    </div>
);

interface SelectFieldProps {
    label: string;
    name: string;
    value: string | null | undefined;
    options: Array<string | { label: string; value: string }>;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    isPrivate?: boolean;
    onTogglePrivacy?: () => void;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, options, onChange, isPrivate, onTogglePrivacy }) => (
    <div className="space-y-1.5 flex-1">
        <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-text-secondary-light dark:text-text-tertiary">{label}</label>
            {onTogglePrivacy && (
                <button
                    type="button"
                    onClick={onTogglePrivacy}
                    className={`p-1 rounded-full transition-colors ${isPrivate ? 'text-brand-green bg-brand-green/10' : 'text-text-tertiary hover:text-text-secondary'}`}
                    title={isPrivate ? "Private" : "Public"}
                >
                    {isPrivate ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
                </button>
            )}
        </div>
        <select
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full bg-tertiary-light dark:bg-white/5 border border-tertiary-light dark:border-white/5 rounded-2xl p-3.5 text-text-main-light dark:text-white outline-none focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/10 transition-all appearance-none cursor-pointer"
        >
            <option value="" className="bg-secondary-light dark:bg-primary">Select...</option>
            {options.map((opt) => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                return (
                    <option key={optValue} value={optValue} className="bg-secondary-light dark:bg-primary">
                        {optLabel}
                    </option>
                );
            })}
        </select>
    </div>
);

const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;

    // Decode HTML entities
    const decodeHtmlEntities = (text: string | number): string => {
        if (typeof text === 'number') return text.toString();
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    };

    return (
        <div className="flex items-start gap-2">
            <span className="font-semibold text-text-main-light dark:text-text-main min-w-fit">
                {label}:
            </span>
            <span className="text-text-secondary-light dark:text-text-secondary">
                {decodeHtmlEntities(value)}
            </span>
        </div>
    );
};

export default ProfilePage;
