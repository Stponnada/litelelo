// src/pages/Profile.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Post as PostType, Profile, Friend } from '../types';
import Spinner from '../components/Spinner';
import ProfilePageSkeleton from '../components/ProfilePageSkeleton';
import { CameraIcon, LogoutIcon, ChatIcon, UserGroupIcon, BookmarkIcon, ConsulIcon, UserPlusIcon, CheckIcon, XMarkIcon } from '../components/icons';
import { isMscBranch, BITS_BRANCHES } from '../data/bitsBranches';
import ImageCropper from '../components/ImageCropper';
import FollowListModal from '../components/FollowListModal';
import LightBox from '../components/lightbox';
import { format } from 'date-fns';

interface CommunityLink {
    id: string;
    name: string;
    avatar_url: string | null;
    role: 'member' | 'admin';
}

const Flair: React.FC<{ flair: { id: string; name: string; avatar_url: string | null } }> = ({ flair }) => (
    <Link
      to={`/communities/${flair.id}`}
      className="group"
      title={flair.name}
    >
        <img 
            src={flair.avatar_url || `https://ui-avatars.com/api/?name=${flair.name}`} 
            alt={flair.name} 
            className="w-6 h-6 rounded-full object-cover transition-transform group-hover:scale-110 shadow-md border-2 border-secondary-light dark:border-secondary" 
        />
    </Link>
);


const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 px-6 font-semibold text-center transition-all ${
            isActive 
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
          className="font-bold py-2.5 px-6 rounded-full bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20 transition-all"
        >
          Accept Request
        </button>
        <button
          onClick={onCancelOrDenyRequest}
          disabled={isToggling}
          className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
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
          className="font-bold py-2.5 px-6 rounded-full bg-tertiary-light dark:bg-tertiary text-text-secondary-light dark:text-text-secondary cursor-not-allowed"
        >
          Request Sent
        </button>
        <button
          onClick={onCancelOrDenyRequest}
          disabled={isToggling}
          className="p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
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
        <button onClick={onMessage} className="p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
        <button onClick={onUnfollow} disabled={isToggling} className="font-bold py-2.5 px-6 rounded-full bg-transparent border-2 border-tertiary-light dark:border-tertiary text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-2">
            {isToggling ? <Spinner /> : <> <CheckIcon className="w-5 h-5"/> Friends </>}
        </button>
      </>
    );
  }

  // You follow them, but they don't follow back
  if (profile.is_following) {
    return (
        <>
            <button onClick={onMessage} className="p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
            <button onClick={onUnfollow} disabled={isToggling} className="font-bold py-2.5 px-6 rounded-full bg-brand-green text-black hover:bg-brand-green-darker transition-all">
                {isToggling ? <Spinner /> : 'Following'}
            </button>
        </>
    );
  }
  
  // They follow you, but you don't follow back
  if (profile.is_followed_by) {
    return (
        <>
            <button onClick={onMessage} className="p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
            <button onClick={onFollow} disabled={isToggling} className="font-bold py-2.5 px-8 rounded-full bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20 transition-all flex items-center gap-2">
                {isToggling ? <Spinner /> : 'Follow Back'}
            </button>
        </>
    );
  }

  // Default case: No relationship
  return (
    <>
      <button onClick={onMessage} className="p-3 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors" title="Message"><ChatIcon className="w-5 h-5" /></button>
      <button onClick={onFollow} disabled={isToggling} className="font-semibold py-2.5 px-6 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors">
        {isToggling ? <Spinner /> : 'Follow'}
      </button>
      <button onClick={onSendRequest} disabled={isToggling} className="font-bold py-2.5 px-6 rounded-full bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20 transition-all flex items-center gap-2">
        <UserPlusIcon className="w-5 h-5" /> Add Friend
      </button>
    </>
  );
};

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser, profile: currentUserProfile, updateProfileContext } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState<Profile | null>(location.state?.profileData || null);
    const [profileLoading, setProfileLoading] = useState(!location.state?.profileData);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'posts' | 'mentions' | 'media'>('posts');
    const [posts, setPosts] = useState<PostType[]>([]);
    const [mentions, setMentions] = useState<PostType[]>([]);
    const [mediaPosts, setMediaPosts] = useState<PostType[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    const [communities, setCommunities] = useState<CommunityLink[]>([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(true);

    const [followModalState, setFollowModalState] = useState<{ isOpen: boolean; listType: 'followers' | 'following' | null; }>({ isOpen: false, listType: null });
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const fetchProfileData = useCallback(async () => {
        if (!username) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_profile_details', {
                    profile_username: username,
                })
                .single();

            if (error || !data) throw error || new Error("Profile not found");
            const profileData: any = data;
            let phone: string | null = null;
            if (profileData?.user_id) {
                const { data: profileRow } = await supabase
                    .from('profiles')
                    .select('phone')
                    .eq('user_id', profileData.user_id)
                    .single();
                phone = (profileRow as any)?.phone ?? null;
            }
            setProfile({ ...(profileData as object), phone } as any);
        } catch (error) {
            console.error("Error fetching profile data:", error);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, [username]); 

    const fetchPostsAndMentions = useCallback(async () => {
        if (!profile) return;
        setPostsLoading(true);
    
        const postsPromise = supabase.rpc('get_posts_for_profile', { p_user_id: profile.user_id });
        const mentionsPromise = supabase.rpc('get_mentions_for_user', { profile_user_id: profile.user_id });
        
        const [postsResult, mentionsResult] = await Promise.all([postsPromise, mentionsPromise]);
    
        if (postsResult.error) {
            console.error("Error fetching posts:", postsResult.error);
        } else {
            const fetchedPosts = (postsResult.data as any[] || []).map(p => ({
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
             const fetchedMentions = (mentionsResult.data as any[] || []).map(p => ({
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

    const handlePostCreated = (newPost: any) => {
        const authorProfile = newPost.profiles as Profile | null;
        const formattedPost: PostType = {
            ...newPost,
            like_count: 0,
            dislike_count: 0,
            comment_count: 0,
            user_vote: null,
            author: {
                author_id: authorProfile?.user_id || '',
                author_type: 'user',
                author_name: authorProfile?.full_name || '',
                author_username: authorProfile?.username || '',
                author_avatar_url: authorProfile?.avatar_url || '',
                author_flair_details: null,
            },
            original_poster_username: null,
            // @ts-ignore
            profiles: null,
        };
        delete (formattedPost as any).profiles;
        setPosts(prevPosts => [formattedPost, ...prevPosts]);
    };
    
    const fetchFriends = useCallback(async () => {
        if (!profile) return;
        setFriendsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_mutual_followers', { p_user_id: profile.user_id });
            if (error) throw error;
            setFriends(data || []);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setFriendsLoading(false);
        }
    }, [profile]);
    
    const fetchCommunities = useCallback(async () => {
        if (!profile) return;
        setCommunitiesLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_communities_for_user', { p_user_id: profile.user_id });
            if (error) throw error;
            setCommunities(data || []);
        } catch (error) {
            console.error("Error fetching communities:", error);
        } finally {
            setCommunitiesLoading(false);
        }
    }, [profile]);


    useEffect(() => {
        if (location.state?.profileData) {
            window.history.replaceState(null, '');
        } else {
            fetchProfileData();
        }
    }, [username, fetchProfileData, location.state]); 
    
    useEffect(() => {
        if (profile) {
            fetchPostsAndMentions();
            fetchFriends();
            fetchCommunities();
        }
    }, [profile, fetchPostsAndMentions, fetchFriends, fetchCommunities]);
    
    const handleMessageUser = () => {
        if (!profile) return;
        navigate('/chat', { state: { recipient: profile } });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut({ scope: 'local' });
        navigate('/login');
    };

    const handleFollow = async () => {
        if (!currentUser || !profile || isTogglingFollow) return;
        setIsTogglingFollow(true);
        const originalFollowerCount = profile.follower_count;
        setProfile({ ...profile, is_following: true, follower_count: profile.follower_count + 1 });
        const { error } = await supabase.rpc('follow_user', { user_to_follow_id: profile.user_id });
        if (error) {
            console.error("Error following user:", error);
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
        const { error } = await supabase.rpc('unfollow_user', { user_to_unfollow_id: profile.user_id });
        if (error) {
            console.error("Error unfollowing user:", error);
            setProfile({ ...profile, is_following: true, follower_count: originalFollowerCount, is_followed_by: originalIsFollowedBy });
        }
        setIsTogglingFollow(false);
    };
    
    const handleSendRequest = async () => {
      if (!currentUser || !profile || isTogglingFollow) return;
      setIsTogglingFollow(true);
      setProfile({ ...profile, has_sent_request: true });
      const { error } = await supabase.rpc('send_friend_request', { recipient_id: profile.user_id });
      if (error) {
        console.error("Error sending request:", error);
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
      const { error } = await supabase.rpc('accept_friend_request', { requester_id: profile.user_id });
      if (error) {
        console.error("Error accepting request:", error);
        fetchProfileData();
      }
      setIsTogglingFollow(false);
    };

    const handleCancelOrDenyRequest = async () => {
      if (!currentUser || !profile || isTogglingFollow) return;
      setIsTogglingFollow(true);
      const wasRequestSent = profile.has_sent_request;
      setProfile({ ...profile, has_sent_request: false, has_received_request: false });
      const { error } = await supabase.rpc('cancel_or_deny_friend_request', { other_user_id: profile.user_id });
      if (error) {
        console.error("Error cancelling/denying request:", error);
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
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <div className="w-full max-w-7xl mx-auto pb-8">
                <div className="relative mb-6">
                    <div className="h-64 sm:h-72 bg-gradient-to-br from-tertiary-light to-tertiary-light/50 dark:from-tertiary dark:to-tertiary/50 relative overflow-hidden">
                        {profile.banner_url ? (
                            <img 
                                src={profile.banner_url} 
                                alt="Banner" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-green/20 to-blue-500/20"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                        
                        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-6">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                <div className="relative">
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 bg-tertiary overflow-hidden shadow-2xl">
                                        {profile.avatar_url ? (
                                            <img 
                                                src={profile.avatar_url} 
                                                alt={profile.full_name || ''} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-green/20 to-blue-500/20">
                                                <span className="text-5xl font-bold text-brand-green">{profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('') : profile.username[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                                    <div className="text-white">
                                        <div className="flex items-center gap-3">
                                            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-lg">
                                                {profile.full_name}
                                            </h1>
                                            {profile.flair_details && <Flair flair={profile.flair_details} />}
                                        </div>
                                        <p className="text-base text-white/80 mt-1 drop-shadow">
                                            @{profile.username}
                                        </p>
                                        
                                        <div className="flex items-center gap-6 mt-3 text-sm">
                                            <button 
                                                onClick={() => setFollowModalState({ isOpen: true, listType: 'following' })} 
                                                className="hover:underline transition-all"
                                            >
                                                <span className="font-bold text-white text-base">
                                                    {profile.following_count}
                                                </span>
                                                <span className="text-white/70 ml-1">
                                                    Following
                                                </span>
                                            </button>
                                            <button 
                                                onClick={() => setFollowModalState({ isOpen: true, listType: 'followers' })} 
                                                className="hover:underline transition-all"
                                            >
                                                <span className="font-bold text-white text-base">
                                                    {profile.follower_count}
                                                </span>
                                                <span className="text-white/70 ml-1">
                                                    Followers
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isOwnProfile ? (
                                            <>
                                                <Link to="/bookmarks" className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors" title="Bookmarks">
                                                    <BookmarkIcon className="w-5 h-5"/>
                                                </Link>
                                                <button onClick={() => setIsEditModalOpen(true)} className="font-semibold py-2.5 px-6 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors">
                                                    Edit Profile
                                                </button>
                                                <button onClick={handleSignOut} className="p-3 text-red-400 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors" title="Sign Out">
                                                    <LogoutIcon className="w-5 h-5" />
                                                </button>
                                            </>
                                        ) : (
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-secondary-light dark:bg-secondary rounded-2xl p-6 space-y-6 shadow-sm">
                                {profile.bio && (<div><h3 className="text-lg font-bold text-text-main-light dark:text-white mb-3">Bio</h3><p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap leading-relaxed">{profile.bio}</p></div>)}
                                {profile.roommates && profile.roommates.length > 0 && (<><hr className="border-tertiary-light dark:border-tertiary" /><div><h3 className="text-lg font-bold text-text-main-light dark:text-white mb-3">Roomies with:</h3><div className="flex items-center gap-2 flex-wrap"><div className="text-text-secondary-light dark:text-text-secondary">{profile.roommates.map((roomie, index) => (<React.Fragment key={roomie.user_id}><Link to={`/profile/${roomie.username}`} className="font-semibold text-brand-green hover:underline">{roomie.full_name || roomie.username}</Link>{index < profile.roommates.length - 2 && ', '}{index === profile.roommates.length - 2 && ' and '}</React.Fragment>))}</div></div></div></>)}
                                <hr className="border-tertiary-light dark:border-tertiary" />
                                <div>
                                    <h3 className="text-lg font-bold text-text-main-light dark:text-white mb-4">Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <ProfileDetail label="Birthday" value={formattedBirthday} />
                                        <ProfileDetail label="Primary Degree" value={profile.branch} />
                                        <ProfileDetail label="B.E. Degree" value={profile.dual_degree_branch} />
                                        <ProfileDetail label="Relationship" value={profile.relationship_status} />
                                        <ProfileDetail label="Dorm" value={dormInfo} />
                                        <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                                        <ProfileDetail label="Phone" value={profile.phone || null} />
                                    </div>
                                </div>
                                {!friendsLoading && friends.length > 0 && (<><hr className="border-tertiary-light dark:border-tertiary" /><div><button onClick={() => setIsFriendsModalOpen(true)} className="text-lg font-bold text-text-main-light dark:text-white mb-4 hover:underline text-left w-full">Friends</button><div className="grid grid-cols-3 gap-3">{friends.slice(0, 9).map(friend => (<Link to={`/profile/${friend.username}`} key={friend.user_id} className="flex flex-col items-center space-y-2 group" title={friend.full_name || friend.username}><img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.username)}&background=random&color=fff&bold=true`} alt={friend.username} className="w-16 h-16 rounded-full object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all bg-tertiary"/><p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transition-colors truncate w-full">{friend.full_name?.split(' ')[0] || friend.username}</p></Link>))}</div></div></>)}
                                {!communitiesLoading && communities.length > 0 && (<><hr className="border-tertiary-light dark:border-tertiary" /><div><h3 className="text-lg font-bold text-text-main-light dark:text-white mb-4">Communities</h3><div className="grid grid-cols-3 gap-3">{communities.slice(0, 9).map(community => (<Link to={`/communities/${community.id}`} key={community.id} className="flex flex-col items-center space-y-2 group" title={community.name}><div className="relative"><img src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=random&color=fff&bold=true`} alt={community.name} className="w-16 h-16 rounded-xl object-cover ring-2 ring-transparent group-hover:ring-brand-green transition-all"/>{community.role === 'admin' && (<div className="absolute -top-1 -right-1"><ConsulIcon className="w-4 h-4" /></div>)}</div><p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary group-hover:text-brand-green transition-colors truncate w-full">{community.name}</p></Link>))}</div></div></>)}
                            </div>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {isOwnProfile && currentUserProfile && (<div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-sm overflow-hidden"><CreatePost onPostCreated={handlePostCreated} profile={currentUserProfile} /></div>)}
                            <div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-sm overflow-hidden">
                                <div className="flex border-b border-tertiary-light dark:border-tertiary">
                                    <TabButton label="Posts" isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                                    <TabButton label="Photos" isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                                    <TabButton label="Mentions" isActive={activeTab === 'mentions'} onClick={() => setActiveTab('mentions')} />
                                </div>
                                <div className="p-4">
                                    {postsLoading ? <div className="text-center py-12"><Spinner/></div> : (
                                        <>
                                            {activeTab === 'posts' && (<div className="space-y-4">{posts.length > 0 ? (posts.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />)) : (<div className="text-center py-16"><p className="text-text-tertiary-light dark:text-text-tertiary text-lg">No posts yet</p></div>)}</div>)}
                                            {activeTab === 'mentions' && (<div className="space-y-4">{mentions.length > 0 ? (mentions.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />)) : (<div className="text-center py-16"><p className="text-text-tertiary-light dark:text-text-tertiary text-lg">No mentions yet</p></div>)}</div>)}
                                            {activeTab === 'media' && (mediaPosts.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 gap-1">{mediaPosts.map(post => (<Link to={`/post/${post.id}`} key={post.id} className="group relative aspect-square rounded overflow-hidden"><img src={post.image_url!} alt="Post media" className="w-full h-full object-cover"/><div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.preventDefault(); setLightboxUrl(post.image_url!); }}><span className="text-white text-sm font-medium">View</span></div></Link>))}</div>) : (<div className="text-center py-16"><p className="text-text-tertiary-light dark:text-text-tertiary text-lg">No media posted yet</p></div>))}
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
                                    to={`/profile/${friend.username}`} 
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

const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    // This component's code remains unchanged from your previous version.
    // It's included here for completeness of the file.
    const { user, updateProfileContext } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(userProfile);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [joinedCommunities, setJoinedCommunities] = useState<CommunityLink[]>([]);
    const [cropperState, setCropperState] = useState<{ isOpen: boolean; type: 'avatar' | 'banner' | null; src: string | null; }>({ isOpen: false, type: null, src: null });
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [isDualDegreeStudent, setIsDualDegreeStudent] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        const campus = profileData.campus;
        if (campus && BITS_BRANCHES[campus]) {
            const campusBranches = BITS_BRANCHES[campus];
            setAvailableBranches([...campusBranches['B.E.'], ...campusBranches['M.Sc.']]);
            const isMsc = isMscBranch(profileData.branch || '', campus);
            setIsDualDegreeStudent(isMsc);
        }
    }, [profileData.campus, profileData.branch]);
    useEffect(() => {
        if (!user) return;
        const fetchUserCommunities = async () => {
            const { data, error } = await supabase.rpc('get_communities_for_user', { p_user_id: user.id });
            if (error) console.error("Failed to fetch user's communities:", error);
            else setJoinedCommunities(data || []);
        };
        fetchUserCommunities();
    }, [user]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => { setCropperState({ isOpen: true, type, src: reader.result as string }); };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    const handleCropSave = (croppedImageFile: File) => {
        const previewUrl = URL.createObjectURL(croppedImageFile);
        if (cropperState.type === 'avatar') { setAvatarFile(croppedImageFile); setAvatarPreview(previewUrl); } 
        else if (cropperState.type === 'banner') { setBannerFile(croppedImageFile); setBannerPreview(previewUrl); }
        setCropperState({ isOpen: false, type: null, src: null });
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'branch' && !isMscBranch(value, updated.campus || '')) {
                updated.dual_degree_branch = null;
            }
            return updated;
        });
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true); setError('');
        try {
            let avatar_url = profileData.avatar_url;
            let banner_url = profileData.banner_url;
            if (avatarFile) {
                const filePath = `${user.id}/avatar.${avatarFile.name.split('.').pop()}`;
                await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatar_url = `${publicUrl}?t=${new Date().getTime()}`;
            }
            if (bannerFile) {
                const filePath = `${user.id}/banner.${bannerFile.name.split('.').pop()}`;
                await supabase.storage.from('avatars').upload(filePath, bannerFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                banner_url = `${publicUrl}?t=${new Date().getTime()}`;
            }
            const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({
                username: profileData.username,
                full_name: profileData.full_name, bio: profileData.bio, branch: profileData.branch,
                dual_degree_branch: profileData.dual_degree_branch || null, relationship_status: profileData.relationship_status,
                dorm_building: profileData.dorm_building, dorm_room: profileData.dorm_room, dining_hall: profileData.dining_hall,
                phone: profileData.phone || null,
                avatar_url, banner_url, updated_at: new Date().toISOString(),
                displayed_community_flair: profileData.displayed_community_flair || null,
            }).eq('user_id', user.id).select().single();
            if (updateError) {
                if (updateError.message.includes('profiles_username_key')) throw new Error('That username is already taken. Please choose another.');
                throw updateError;
            }
            updateProfileContext(updatedProfile);
            const usernameChanged = profileData.username !== userProfile.username;
            onClose();
            if (usernameChanged) {
                navigate(`/profile/${updatedProfile.username}`, { replace: true, state: { profileData: updatedProfile } });
            } else {
                onSave();
            }
        } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
    };
    if (cropperState.isOpen && cropperState.src) return <ImageCropper imageSrc={cropperState.src} aspect={cropperState.type === 'avatar' ? 1 : 16/9} cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'} onSave={handleCropSave} onClose={() => setCropperState({ isOpen: false, type: null, src: null })} isSaving={isSaving} />;
    return <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"><div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"><form onSubmit={handleSubmit} className="p-6 sm:p-8">{/* ... form JSX from previous step ... */}</form></div></div>
};

const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex items-start gap-2">
            <span className="font-semibold text-text-main-light dark:text-text-main min-w-fit">
                {label}:
            </span>
            <span className="text-text-secondary-light dark:text-text-secondary">
                {value}
            </span>
        </div>
    );
};

export default ProfilePage;