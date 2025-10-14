// src/pages/Profile.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Post as PostType, Profile, Friend } from '../types';
import Spinner from '../components/Spinner';
import { CameraIcon, LogoutIcon, ChatIcon, UserGroupIcon, StarIcon, BookmarkIcon } from '../components/icons';
import { isMscBranch, BITS_BRANCHES } from '../data/bitsBranches.ts';
import ImageCropper from '../components/ImageCropper';
import FollowListModal from '../components/FollowListModal';
import LightBox from '../components/lightbox';

interface CommunityLink {
    id: string;
    name: string;
    avatar_url: string | null;
    role: 'member' | 'admin';
}

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 p-4 font-bold text-center transition-colors ${
            isActive 
            ? 'border-b-2 border-brand-green text-text-main-light dark:text-text-main' 
            : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/60 dark:hover:bg-tertiary'
        }`}
    >
        {label}
    </button>
);

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser, profile: currentUserProfile, updateProfileContext } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
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
            setProfile(data);
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
                }
            }));
            setPosts(fetchedPosts);
            setMediaPosts(fetchedPosts.filter((p: PostType) => !!p.image_url));
        }
    
        if (mentionsResult.error) {
            console.error("Error fetching mentions:", mentionsResult.error)
        } else {
             // --- THIS IS THE FIX ---
             // The data from the RPC now contains all the author details we need.
             const fetchedMentions = (mentionsResult.data as any[] || []).map(p => ({
                ...p,
                author: {
                    author_id: p.author_id,
                    author_type: p.author_type,
                    author_name: p.author_name,
                    author_username: p.author_username,
                    author_avatar_url: p.author_avatar_url,
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
        fetchProfileData();
    }, [fetchProfileData]);
    
    useEffect(() => {
        if (profile) {
            fetchPostsAndMentions();
            fetchFriends();
            fetchCommunities();
        }
    }, [profile, fetchPostsAndMentions, fetchFriends, fetchCommunities]);
    
    const handleFollowToggle = async () => {
      if (!currentUser || !profile || isTogglingFollow) return;
      setIsTogglingFollow(true);
      const isCurrentlyFollowing = profile.is_following;
      setProfile({ ...profile, is_following: !isCurrentlyFollowing, follower_count: isCurrentlyFollowing ? profile.follower_count - 1 : profile.follower_count + 1 });
      try {
        if (isCurrentlyFollowing) {
          await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profile.user_id });
        } else {
          await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profile.user_id });
        }
      } catch (error) {
        console.error('Failed to toggle follow:', error);
        setProfile({ ...profile, is_following: isCurrentlyFollowing, follower_count: profile.follower_count });
      } finally {
        setIsTogglingFollow(false);
      }
    };
    
    const handleMessageUser = () => {
        if (!profile) return;
        navigate('/chat', { state: { recipient: profile } });
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (profileLoading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }
    
    if (!profile) {
        return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    }
    
    const isOwnProfile = currentUser?.id === profile.user_id;
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
            {isEditModalOpen && profile && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
            {followModalState.isOpen && profile && followModalState.listType && <FollowListModal profile={profile} listType={followModalState.listType} onClose={() => setFollowModalState({ isOpen: false, listType: null })} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <div className="w-full max-w-7xl mx-auto">
                <div className="relative">
                    <div className="h-48 sm:h-80 bg-tertiary-light dark:bg-tertiary">
                        {profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute left-4 sm:left-6 -bottom-16 sm:-bottom-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-primary-light dark:border-primary bg-gray-700">
                           {profile.avatar_url && <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" />}
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-end">
                        <div className="pt-16 sm:pt-20 pl-[calc(8rem+1rem)] sm:pl-[calc(10rem+1.5rem)] text-white">
                            <h1 className="text-4xl sm:text-5xl font-bold drop-shadow-lg">{profile.full_name}</h1>
                            <p className="text-gray-300 drop-shadow-lg">@{profile.username}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isOwnProfile ? (
                                <>
                                    <Link to="/bookmarks" className="font-bold py-2 px-4 rounded-full border-2 border-white/80 text-white hover:bg-white/10 transition-colors flex items-center space-x-2">
                                        <BookmarkIcon className="w-5 h-5"/>
                                        <span className="hidden sm:inline">Bookmarks</span>
                                    </Link>
                                    <button onClick={() => setIsEditModalOpen(true)} className="font-bold py-2 px-4 rounded-full border-2 border-white/80 text-white hover:bg-white/10 transition-colors">Edit Profile</button>
                                    <button onClick={handleSignOut} className="p-2 text-red-400 rounded-full hover:bg-white/10 transition-colors md:hidden"><LogoutIcon className="w-6 h-6" /></button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleMessageUser} className="font-bold py-2 px-4 rounded-full border-2 border-white/80 text-white hover:bg-white/10 transition-colors flex items-center space-x-2"><ChatIcon className="w-5 h-5" /><span>Message</span></button>
                                    <button onClick={handleFollowToggle} disabled={isTogglingFollow} className={`font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 min-w-[120px] ${profile.is_following ? 'bg-transparent border-2 border-white/80 text-white hover:border-red-500 hover:text-red-500' : 'bg-white text-black hover:bg-gray-200'}`}>{isTogglingFollow ? <Spinner /> : (profile.is_following ? 'Following' : 'Follow')}</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-24 px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
                        <div className="lg:col-span-1 space-y-4"> 
                            <h2 className="text-xl font-bold">About {profile.full_name?.split(' ')[0] || profile.username}</h2>
                            
                            {profile.roommates && profile.roommates.length > 0 && (
                                <div className="flex items-start space-x-2">
                                    <UserGroupIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary mt-1 flex-shrink-0" />
                                    <div className="text-text-secondary-light dark:text-text-secondary">
                                        <span className="font-semibold">Roomies with: </span>
                                        {profile.roommates.map((roomie, index) => (
                                            <React.Fragment key={roomie.user_id}>
                                                <Link to={`/profile/${roomie.username}`} className="font-semibold text-text-main-light dark:text-text-main hover:underline hover:text-brand-green">
                                                    {roomie.full_name || roomie.username}
                                                </Link>
                                                {index < profile.roommates.length - 2 && ', '}
                                                {index === profile.roommates.length - 2 && ' and '}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-4 text-sm">
                                <button onClick={() => setFollowModalState({ isOpen: true, listType: 'following' })} className="hover:underline"><span className="font-bold text-text-main-light dark:text-white">{profile.following_count}</span><span className="text-text-tertiary-light dark:text-text-tertiary"> Following</span></button>
                                <button onClick={() => setFollowModalState({ isOpen: true, listType: 'followers' })} className="hover:underline"><span className="font-bold text-text-main-light dark:text-white">{profile.follower_count}</span><span className="text-text-tertiary-light dark:text-text-tertiary"> Followers</span></button>
                            </div>
                            {profile.bio && <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap">{profile.bio}</p>}
                            <hr className="border-tertiary-light dark:border-tertiary !my-6" />
                            <div className="space-y-4 text-sm">
                                <ProfileDetail label="Primary Degree" value={profile.branch} /><ProfileDetail label="B.E. Degree" value={profile.dual_degree_branch} /><ProfileDetail label="Relationship Status" value={profile.relationship_status} /><ProfileDetail label="Dorm" value={dormInfo} /><ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                            </div>
                            {!friendsLoading && friends.length > 0 && (
                                <><hr className="border-tertiary-light dark:border-tertiary !my-6" /><div><h3 className="text-lg font-bold mb-3">Friends</h3><div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">{friends.slice(0, 9).map(friend => (<Link to={`/profile/${friend.username}`} key={friend.user_id} className="flex flex-col items-center space-y-1 group" title={friend.full_name || friend.username}><img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.full_name || friend.username}`} alt={friend.username} className="w-16 h-16 rounded-full object-cover" /><p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary group-hover:underline truncate w-full">{friend.full_name || friend.username}</p></Link>))}</div></div></>
                            )}
                            {!communitiesLoading && communities.length > 0 && (
                                <><hr className="border-tertiary-light dark:border-tertiary !my-6" /><div><h3 className="text-lg font-bold mb-3">Communities</h3><div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">{communities.slice(0, 9).map(community => (
                                    <Link to={`/communities/${community.id}`} key={community.id} className="flex flex-col items-center space-y-1 group" title={community.name}>
                                        <img src={community.avatar_url || `https://ui-avatars.com/api/?name=${community.name}&background=3cfba2&color=000`} alt={community.name} className="w-16 h-16 rounded-2xl object-cover" />
                                        <div className="flex items-center gap-1.5 w-full justify-center">
                                            <p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary group-hover:underline truncate">
                                                {community.name}
                                            </p>
                                            {community.role === 'admin' && (
                                                <StarIcon className="w-3 h-3 text-yellow-400 flex-shrink-0" title="Consul" />
                                            )}
                                        </div>
                                    </Link>
                                ))}</div></div></>
                            )}
                        </div>

                        <div className="lg:col-span-2 mt-8 lg:mt-0"> 
                            {isOwnProfile && currentUserProfile && (
                                <div className="mb-6">
                                    <CreatePost onPostCreated={handlePostCreated} profile={currentUserProfile} />
                                </div>
                            )}
                            <div className="flex border-b border-tertiary-light dark:border-tertiary">
                                <TabButton label="Posts" isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                                <TabButton label="Mentions" isActive={activeTab === 'mentions'} onClick={() => setActiveTab('mentions')} />
                                <TabButton label="Media" isActive={activeTab === 'media'} onClick={() => setActiveTab('media')} />
                            </div>
                            <div className="mt-4">
                                {postsLoading ? (<div className="text-center py-8"><Spinner/></div>) : (
                                    <>
                                        {activeTab === 'posts' && (<div className="space-y-4">{posts.length > 0 ? posts.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />) : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">No posts yet.</p>}</div>)}
                                        {activeTab === 'mentions' && (<div className="space-y-4">{mentions.length > 0 ? mentions.map(post => <PostComponent key={post.id} post={post} onImageClick={setLightboxUrl} />) : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">No mentions yet.</p>}</div>)}
                                        {activeTab === 'media' && (
                                            mediaPosts.length > 0 ? (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                                    {mediaPosts.map(post => (
                                                        <Link to={`/post/${post.id}`} key={post.id} className="group relative aspect-square">
                                                            <img src={post.image_url!} alt="Post media" className="w-full h-full object-cover rounded-sm" />
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.preventDefault(); setLightboxUrl(post.image_url!); }}></div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">No media posted yet.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    // ... (This component remains unchanged)
    const { user, updateProfileContext } = useAuth();
    const [profileData, setProfileData] = useState(userProfile);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    const [cropperState, setCropperState] = useState<{
      isOpen: boolean;
      type: 'avatar' | 'banner' | null;
      src: string | null;
    }>({ isOpen: false, type: null, src: null });

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropperState({ isOpen: true, type, src: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    
    const handleCropSave = (croppedImageFile: File) => {
        const previewUrl = URL.createObjectURL(croppedImageFile);
        if (cropperState.type === 'avatar') {
            setAvatarFile(croppedImageFile);
            setAvatarPreview(previewUrl);
        } else if (cropperState.type === 'banner') {
            setBannerFile(croppedImageFile);
            setBannerPreview(previewUrl);
        }
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
                full_name: profileData.full_name, bio: profileData.bio, branch: profileData.branch,
                dual_degree_branch: profileData.dual_degree_branch || null, relationship_status: profileData.relationship_status,
                dorm_building: profileData.dorm_building, dorm_room: profileData.dorm_room, dining_hall: profileData.dining_hall,
                avatar_url, banner_url, updated_at: new Date().toISOString(),
            }).eq('user_id', user.id).select().single();

            if (updateError) throw updateError;
            
            updateProfileContext(updatedProfile);
            onSave();
            onClose();
        } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
    };
    
    if (cropperState.isOpen && cropperState.src) {
        return (
            <ImageCropper
                imageSrc={cropperState.src}
                aspect={cropperState.type === 'avatar' ? 1 : 16 / 9}
                cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
                onSave={handleCropSave}
                onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
                isSaving={isSaving}
            />
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-brand-green mb-6">Edit Profile</h2>
                    <div className="relative h-48 bg-tertiary-light dark:bg-tertiary rounded-t-lg mb-16">
                        {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-t-lg" alt="Banner Preview"/>}
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                        <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-secondary-light dark:border-secondary bg-gray-600">
                            {avatarPreview && <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Avatar Preview"/>}
                            <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 rounded-full transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                        </div>
                    </div>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="space-y-4 pt-4">
                        <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Full Name</label><input type="text" name="full_name" value={profileData.full_name || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Bio</label><textarea name="bio" value={profileData.bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Primary Degree</label>
                                <select name="branch" value={profileData.branch || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                    <option value="">Select Branch</option>
                                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {isDualDegreeStudent && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">B.E. Degree</label>
                                    <select name="dual_degree_branch" value={profileData.dual_degree_branch || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                        <option value="">Select B.E. Branch</option>
                                        {profileData.campus && BITS_BRANCHES[profileData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            )}
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Relationship Status</label><select name="relationship_status" value={profileData.relationship_status || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Status</option><option value="Single">Single</option><option value="In a relationship">In a relationship</option><option value="It's complicated">It's complicated</option><option value="Married">Married</option></select></div>
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dorm Building</label><input type="text" name="dorm_building" placeholder="e.g., Valmiki" value={profileData.dorm_building || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dorm Room</label><input type="text" name="dorm_room" placeholder="e.g., 469" value={profileData.dorm_room || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dining Hall</label><select name="dining_hall" value={profileData.dining_hall || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Mess</option><option value="Mess 1">Mess 1</option><option value="Mess 2">Mess 2</option></select></div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6"><button type="button" onClick={onClose} className="py-2 px-6 rounded-full text-text-main-light dark:text-text-main hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button><button type="submit" disabled={isSaving} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSaving ? <Spinner /> : 'Save Changes'}</button></div>
                </form>
            </div>
        </div>
    );
};

const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (<div><span className="font-semibold text-text-secondary-light dark:text-text-main">{label}: </span><span className="text-text-tertiary-light dark:text-text-tertiary">{value}</span></div>);
};

export default ProfilePage;