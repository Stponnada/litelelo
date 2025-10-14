// src/pages/CommunityPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Post as PostType } from '../types';
import Spinner from '../components/Spinner';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import ImageCropper from '../components/ImageCropper';
import LightBox from '../components/lightbox';
import { UserGroupIcon, ChatBubbleLeftRightIcon, ArrowLeftIcon, CameraIcon } from '../components/icons';

interface CommunityDetails {
    id: string;
    name: string;
    description: string;
    campus: string;
    avatar_url: string | null;
    banner_url: string | null;
    created_by: string;
    member_count: number;
    is_member: boolean;
    is_admin: boolean; // Using 'is_admin' to match the SQL function
    conversation_id: string | null;
}


const CommunityPage: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const { user, profile: currentUserProfile } = useAuth();
    const navigate = useNavigate();

    const [community, setCommunity] = useState<CommunityDetails | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'private' | 'public'>('private');
    
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const [cropperState, setCropperState] = useState<{
        isOpen: boolean;
        type: 'avatar' | 'banner' | null;
        src: string | null;
    }>({ isOpen: false, type: null, src: null });
    const [isSaving, setIsSaving] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    
    const fetchCommunityData = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        setError(null);
        try {
            const { data: communityData, error: communityError } = await supabase
                .rpc('get_community_details', { p_community_id: communityId })
                .single();
            if (communityError) throw communityError;
            setCommunity(communityData);

            const { data: postsData, error: postsError } = await supabase
                .rpc('get_posts_for_community', { p_community_id: communityId });
            
            if (postsError) throw postsError;
            setPosts((postsData as any) || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    useEffect(() => {
        fetchCommunityData();
    }, [fetchCommunityData]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropperState({ isOpen: true, type, src: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Reset input
    };

    const handleCropSave = async (croppedImageFile: File) => {
        if (!community || !cropperState.type || !user) return;
        setIsSaving(true);
    
        const fileType = cropperState.type;
        const filePath = `${user.id}/community-assets/${community.id}/${fileType}.${croppedImageFile.name.split('.').pop()}`;
        const columnToUpdate = fileType === 'avatar' ? 'avatar_url' : 'banner_url';

        try {
            const { error: uploadError } = await supabase.storage
                .from('community-assets') 
                .upload(filePath, croppedImageFile, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('community-assets')
                .getPublicUrl(filePath);
            const newUrl = `${publicUrl}?t=${new Date().getTime()}`;

            const { error: dbError } = await supabase
                .from('communities')
                .update({ [columnToUpdate]: newUrl })
                .eq('id', community.id);
            if (dbError) throw dbError;

            setCommunity(prev => prev ? { ...prev, [columnToUpdate]: newUrl } : null);
            
        } catch (err: any) {
            console.error(`Failed to upload ${fileType}:`, err);
        } finally {
            setIsSaving(false);
            setCropperState({ isOpen: false, type: null, src: null });
        }
    };

    const handleJoinToggle = async () => {
        if (!community || !user) return;
        const isCurrentlyMember = community.is_member;
        
        setCommunity({ ...community, is_member: !isCurrentlyMember, member_count: community.member_count + (!isCurrentlyMember ? 1 : -1) });

        try {
            if (isCurrentlyMember) {
                await supabase.from('community_members').delete().match({ community_id: community.id, user_id: user.id });
            } else {
                await supabase.from('community_members').insert({ community_id: community.id, user_id: user.id });
            }
        } catch (err) {
             setCommunity({ ...community, is_member: isCurrentlyMember, member_count: community.member_count });
            console.error("Failed to toggle community membership:", err);
        }
    };

    
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
    
    // Use the is_admin flag to determine edit permissions
    const canEdit = community.is_admin;
    const privatePosts = posts.filter(p => !p.is_public);
    const publicPosts = posts.filter(p => p.is_public);
    const canPost = community.is_member;
    const placeholderText = activeTab === 'public'
        ? "Share something with everyone..."
        : "What's on your mind, member?";

    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-transparent via-brand-green/5 to-transparent dark:via-brand-green/10">
            {cropperState.isOpen && cropperState.src && (
                <ImageCropper
                    imageSrc={cropperState.src}
                    aspect={cropperState.type === 'avatar' ? 1 : 16 / 6}
                    cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
                    onSave={handleCropSave}
                    onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
                    isSaving={isSaving}
                />
            )}
            
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            <div className="max-w-5xl mx-auto px-4 py-6">
                <Link 
                    to="/communities" 
                    className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green transition-colors mb-6 group"
                >
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to all communities
                </Link>

                <div className="bg-white/80 dark:bg-secondary/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden mb-8">
                    <div className="relative h-48 md:h-56 bg-gradient-to-br from-brand-green/30 via-brand-green/20 to-tertiary-light dark:to-tertiary group">
                        {community.banner_url && (
                            <img 
                                src={community.banner_url} 
                                alt="Banner" 
                                className="w-full h-full object-cover"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        {canEdit && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <CameraIcon className="w-10 h-10 text-white" />
                                </button>
                                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                            </>
                        )}
                    </div>

                    <div className="p-6 md:p-8">
                        <div className="flex justify-between items-end -mt-28 md:-mt-32">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full"></div>
                                <img 
                                    src={community.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=3cfba2&color=000`} 
                                    alt={community.name} 
                                    className="relative w-32 h-32 md:w-36 md:h-36 rounded-3xl border-4 border-white dark:border-secondary object-cover shadow-2xl"
                                />
                                 {canEdit && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => avatarInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"
                                        >
                                            <CameraIcon className="w-8 h-8 text-white" />
                                        </button>
                                        <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleJoinToggle} 
                                    className={`font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-lg ${
                                        community.is_member 
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500/30 hover:border-red-500/50' 
                                            : 'bg-brand-green text-black hover:bg-brand-green/90 border-2 border-brand-green/30 hover:shadow-xl hover:shadow-brand-green/30'
                                    }`}
                                >
                                    {community.is_member ? 'Leave Community' : 'Join Community'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h1 className="text-3xl md:text-4xl font-black text-text-main-light dark:text-text-main mb-2">
                                {community.name}
                            </h1>
                            <Link 
                                to={`/communities/${community.id}/members`}
                                className="inline-flex items-center gap-2 bg-brand-green/10 rounded-full px-4 py-2 border border-brand-green/20 hover:bg-brand-green/20 hover:border-brand-green/30 transition-colors cursor-pointer"
                            >
                                <UserGroupIcon className="w-5 h-5 text-brand-green" />
                                <span className="text-sm font-bold text-text-main-light dark:text-text-main">
                                    {community.member_count}
                                </span>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary">
                                    {community.member_count === 1 ? 'member' : 'members'}
                                </span>
                            </Link>
                            {community.description && (
                                <p className="mt-4 text-text-secondary-light dark:text-text-secondary text-base leading-relaxed max-w-3xl">
                                    {community.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="flex gap-2 mb-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm border-2 border-tertiary-light/50 dark:border-tertiary/50 rounded-2xl p-2 shadow-lg w-fit">
                        <button 
                            onClick={() => setActiveTab('private')} 
                            className={`px-6 py-3 font-bold rounded-xl transition-all ${
                                activeTab === 'private' 
                                    ? 'bg-brand-green text-black shadow-lg' 
                                    : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30'
                            }`}
                        >
                            Member Posts
                        </button>
                        <button 
                            onClick={() => setActiveTab('public')} 
                            className={`px-6 py-3 font-bold rounded-xl transition-all ${
                                activeTab === 'public' 
                                    ? 'bg-brand-green text-black shadow-lg' 
                                    : 'text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main hover:bg-tertiary-light/30 dark:hover:bg-tertiary/30'
                            }`}
                        >
                            Public Feed
                        </button>
                    </div>
                    
                    <div className="mt-6">
                        {canPost ? (
                            <>
                                {currentUserProfile && (
                                    <div className="mb-6">
                                        <CreatePost 
                                            profile={currentUserProfile} 
                                            onPostCreated={fetchCommunityData} 
                                            communityId={community.id}
                                            isPublicPost={activeTab === 'public'}
                                            placeholderText={placeholderText}
                                        />
                                    </div>
                                )}
                                
                                <div className="space-y-5">
                                    {(activeTab === 'private' ? privatePosts : publicPosts).map((post: any, index: number) => {
                                        let postToRender: PostType = post;
                                        if (activeTab === 'private') {
                                            postToRender = {
                                                ...post,
                                                author: {
                                                    author_id: post.original_poster_user_id,
                                                    author_type: 'user',
                                                    author_name: post.original_poster_full_name,
                                                    author_username: post.original_poster_username,
                                                    author_avatar_url: post.original_poster_avatar_url,
                                                },
                                                original_poster_username: null,
                                            };
                                        }
                                        
                                        return (
                                            <div 
                                                key={post.id}
                                                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                                                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
                                            >
                                                <PostComponent post={postToRender} onImageClick={setLightboxUrl}/>
                                            </div>
                                        );
                                    })}
                                    
                                    {(activeTab === 'private' && privatePosts.length === 0) && (
                                        <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green/10 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">
                                                No member posts yet
                                            </p>
                                            <p className="text-text-secondary-light dark:text-text-secondary">
                                                Be the first to share something with the community!
                                            </p>
                                        </div>
                                    )}
                                    
                                    {(activeTab === 'public' && publicPosts.length === 0) && (
                                        <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-green/10 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">
                                                No public posts yet
                                            </p>
                                            <p className="text-text-secondary-light dark:text-text-secondary">
                                                This community hasn't shared anything publicly yet.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-24 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-brand-green/20 blur-2xl rounded-full"></div>
                                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/10 border-2 border-brand-green/30 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3">
                                    Join to see posts
                                </h3>
                                <p className="text-text-secondary-light dark:text-text-secondary mb-6 max-w-md mx-auto">
                                    Become a member to view and create posts in this community
                                </p>
                                <button 
                                    onClick={handleJoinToggle} 
                                    className="bg-brand-green text-black font-bold py-3 px-8 rounded-xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30"
                                >
                                    Join Community
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;