// src/pages/CommunityPage.tsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Post as PostType, CommunityDetails as CommunityDetailsType, ConversationSummary, Profile } from '../types';
import Spinner from '../components/Spinner';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import ImageCropper from '../components/ImageCropper';
import LightBox from '../components/lightbox';
import { UserGroupIcon, ArrowLeftIcon, CameraIcon, LockClosedIcon, PlusIcon } from '../components/icons';
import Conversation from '../components/Conversation';
import CreateSubcommunityModal from '../components/CreateSubcommunityModal';

// This interface is a combination of the details for a subcommunity, which includes a conversation_id
interface Subcommunity extends CommunityDetailsType {
    conversation_id: string;
}

const CommunityPage: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const { user, profile: currentUserProfile } = useAuth();
    const navigate = useNavigate();

    const [community, setCommunity] = useState<CommunityDetailsType | null>(null);
    const [subcommunities, setSubcommunities] = useState<Subcommunity[]>([]);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedAccessType, setEditedAccessType] = useState<'public' | 'restricted'>('public');

    // 'private' for member posts, 'public' for public posts, or a subcommunity ID for conversations
    const [activeView, setActiveView] = useState<'private' | 'public' | string>('private'); 
    
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const [cropperState, setCropperState] = useState<{ isOpen: boolean; type: 'avatar' | 'banner' | null; src: string | null; }>({ isOpen: false, type: null, src: null });
    const [isSaving, setIsSaving] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [isCreateSubcommunityModalOpen, setCreateSubcommunityModalOpen] = useState(false);
    
    const fetchCommunityData = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch community details, posts, and subcommunities in parallel for speed
            const communityPromise = supabase.rpc('get_community_details', { p_community_id: communityId }).single();
            const postsPromise = supabase.rpc('get_posts_for_community', { p_community_id: communityId });
            const subcommunitiesPromise = supabase.rpc('get_subcommunities', { p_parent_id: communityId });

            const [communityResult, postsResult, subcommunitiesResult] = await Promise.all([communityPromise, postsPromise, subcommunitiesPromise]);

            if (communityResult.error) throw communityResult.error;
            setCommunity(communityResult.data);

            if (postsResult.error) throw postsResult.error;
            setPosts((postsResult.data as any) || []);

            if (subcommunitiesResult.error) throw subcommunitiesResult.error;
            setSubcommunities(subcommunitiesResult.data || []);

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
        } catch (err: any) {
            console.error(`Failed to upload ${fileType}:`, err);
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
        if (data) setCommunity(prev => ({...prev!, ...data}));
        setIsSaving(false);
        setIsEditing(false);
    };
    
    const handleJoinToggle = async (targetCommunityId: string, accessType: 'public' | 'restricted', isMember: boolean, hasPendingRequest: boolean) => {
        if (!user) return;
        const isSubcommunity = targetCommunityId !== community?.id;
        
        const updateState = (updater: (c: any) => any) => {
            if (isSubcommunity) {
                setSubcommunities(prev => prev.map(sc => sc.id === targetCommunityId ? updater(sc) : sc));
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
            } catch (err) {
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

    const selectedSubcommunityConversation = useMemo(() => {
        const sub = subcommunities.find(sc => sc.id === activeView);
        if (!sub || !sub.conversation_id) return null;
        
        return {
            conversation_id: sub.conversation_id,
            type: 'group',
            name: sub.name,
            participants: [],
            last_message_content: null, last_message_at: null, last_message_sender_id: null, unread_count: 0
        } as ConversationSummary;
    }, [activeView, subcommunities]);

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
    const publicPosts = posts.filter(p => p.is_public);
    const privatePosts = posts.filter(p => !p.is_public);
    
    return (
        <div className="w-full min-h-screen bg-gradient-to-b from-transparent via-brand-green/5 to-transparent dark:via-brand-green/10">
            {cropperState.isOpen && cropperState.src && <ImageCropper imageSrc={cropperState.src} aspect={cropperState.type === 'avatar' ? 1 : 16 / 6} cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'} onSave={handleCropSave} onClose={() => setCropperState({ isOpen: false, type: null, src: null })} isSaving={isSaving} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
            {isCreateSubcommunityModalOpen && <CreateSubcommunityModal parentCommunityId={community.id} onClose={() => setCreateSubcommunityModalOpen(false)} onSubcommunityCreated={fetchCommunityData} />}

            <div className="max-w-7xl mx-auto px-4 py-6">
                <Link to="/communities" className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary hover:text-brand-green dark:hover:text-brand-green transition-colors mb-6 group">
                    <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to all communities
                </Link>

                <div className="bg-white/80 dark:bg-secondary/80 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden mb-8">
                    <div className="relative h-48 md:h-56 bg-gradient-to-br from-brand-green/30 via-brand-green/20 to-tertiary-light dark:to-tertiary group">
                        {community.banner_url && <img src={community.banner_url} alt="Banner" className="w-full h-full object-cover"/>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        {isOwner && (<>
                            <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="w-10 h-10 text-white" />
                            </button>
                            <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                        </>)}
                    </div>

                    <div className="px-6 md:px-8 pt-4">
                        <div className="flex justify-between items-end -mt-28 md:-mt-32">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-brand-green/30 blur-2xl rounded-full"></div>
                                <img src={community.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=3cfba2&color=000`} alt={community.name} className="relative w-32 h-32 md:w-36 md:h-36 rounded-3xl border-4 border-white dark:border-secondary object-cover shadow-2xl"/>
                                 {isOwner && (<>
                                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                                        <CameraIcon className="w-8 h-8 text-white" />
                                    </button>
                                    <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                                </>)}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 transform translate-y-8">
                                {isEditing ? (<>
                                    <button onClick={handleCancelEdit} className="font-semibold py-2.5 px-6 rounded-xl bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors">Cancel</button>
                                    <button onClick={handleSaveChanges} disabled={isSaving} className="font-bold py-2.5 px-6 rounded-xl bg-brand-green text-black hover:bg-brand-green-darker transition-colors">{isSaving ? <Spinner /> : 'Save'}</button>
                                </>) : isOwner ? (
                                    <button onClick={handleStartEdit} className="font-semibold py-2.5 px-6 rounded-full bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-tertiary-light/80 dark:hover:bg-tertiary/80 transition-colors">Edit Community</button>
                                ) : (
                                    <button onClick={() => handleJoinToggle(community.id, community.access_type, community.is_member, community.has_pending_request)} className={`font-bold py-2.5 px-6 rounded-full transition-all disabled:opacity-50 min-w-[150px] ${community.is_member ? 'bg-transparent border-2 border-tertiary-light dark:border-tertiary text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500 hover:bg-red-500/5' : community.has_pending_request ? 'bg-tertiary-light/60 dark:bg-tertiary/60 text-text-secondary-light dark:text-text-secondary cursor-not-allowed' : 'bg-brand-green text-black hover:bg-brand-green-darker shadow-lg shadow-brand-green/20'}`} disabled={!community.is_member && community.has_pending_request}>
                                        {community.is_member ? 'Leave' : (community.has_pending_request ? 'Request Sent' : (community.access_type === 'public' ? 'Join' : 'Request to Join'))}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 md:p-8 pt-4">
                        <div className="mt-6">
                            {isEditing ? (
                                <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="w-full text-3xl sm:text-4xl font-black bg-tertiary-light dark:bg-tertiary rounded-lg p-2 mb-4" />
                            ) : (
                                <h1 className="text-3xl md:text-4xl font-black text-text-main-light dark:text-text-main mb-2">{community.name}</h1>
                            )}
                            <Link to={`/communities/${community.id}/members`} className="inline-flex items-center gap-2 bg-brand-green/10 rounded-full px-4 py-2 border border-brand-green/20 hover:bg-brand-green/20 hover:border-brand-green/30 transition-colors cursor-pointer">
                                <UserGroupIcon className="w-5 h-5 text-brand-green" />
                                <span className="text-sm font-bold text-text-main-light dark:text-text-main">{community.member_count}</span>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary">{community.member_count === 1 ? 'member' : 'members'}</span>
                            </Link>
                            
                            {isEditing ? (<>
                                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full mt-4 text-text-secondary-light dark:text-text-secondary text-base leading-relaxed max-w-3xl bg-tertiary-light dark:bg-tertiary rounded-lg p-2" rows={3}/>
                                <div className="mt-4"><label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2">Access Type</label><select value={editedAccessType} onChange={(e) => setEditedAccessType(e.target.value as 'public' | 'restricted')} className="w-full bg-tertiary-light dark:bg-tertiary rounded-lg p-3"><option value="public">Public (Anyone can join)</option><option value="restricted">Restricted (Join by approval)</option></select></div>
                            </>) : community.description && (
                                <p className="mt-4 text-text-secondary-light dark:text-text-secondary text-base leading-relaxed max-w-3xl">{community.description}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
                        <div className="bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl p-4 border-2 border-tertiary-light/50 dark:border-tertiary/50 sticky top-6">
                            <h3 className="font-bold mb-2 px-2 text-text-main-light dark:text-text-main">Channels</h3>
                            <div className="space-y-1">
                                <SubcommunityLink label="Member Posts" isActive={activeView === 'private'} onClick={() => setActiveView('private')} />
                                <SubcommunityLink label="Public Feed" isActive={activeView === 'public'} onClick={() => setActiveView('public')} />
                            </div>
                            <hr className="my-3 border-tertiary-light/50 dark:border-tertiary/50" />
                            <div className="flex justify-between items-center mb-2 px-2">
                                <h4 className="font-bold text-text-main-light dark:text-text-main">Subcommunities</h4>
                                {isOwner && <button onClick={() => setCreateSubcommunityModalOpen(true)} className="p-1 rounded-md hover:bg-tertiary-light dark:hover:bg-tertiary"><PlusIcon className="w-4 h-4 text-brand-green"/></button>}
                            </div>
                            <div className="space-y-1">
                                {subcommunities.map(sub => <SubcommunityLink key={sub.id} subcommunity={sub} isActive={activeView === sub.id} onClick={() => setActiveView(sub.id)} onJoinToggle={handleJoinToggle} />)}
                            </div>
                        </div>
                    </aside>

                    <main className="flex-1 min-w-0">
                        {selectedSubcommunityConversation ? (
                            <div className="h-[calc(100vh-200px)] bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-tertiary-light/50 dark:border-tertiary/50">
                               <Conversation conversation={selectedSubcommunityConversation} onConversationCreated={() => {}} />
                            </div>
                        ) : !community.is_member ? (
                            <div className="text-center py-24 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50">
                                <div className="relative inline-block mb-6">
                                    <div className="absolute inset-0 bg-brand-green/20 blur-2xl rounded-full"></div>
                                    <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/10 border-2 border-brand-green/30 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3">Join to see posts</h3>
                                <p className="text-text-secondary-light dark:text-text-secondary mb-6 max-w-md mx-auto">Become a member to view and create posts in this community.</p>
                                <button onClick={() => handleJoinToggle(community.id, community.access_type, community.is_member, community.has_pending_request)} className="bg-brand-green text-black font-bold py-3 px-8 rounded-xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 hover:shadow-xl hover:shadow-brand-green/30">Join Community</button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {canPostInCurrentView && currentUserProfile && <div className="mb-6"><CreatePost onPostCreated={fetchCommunityData} profile={currentUserProfile} communityId={community.id} isPublicPost={activeView === 'public'} placeholderText={placeholderText} /></div>}
                                
                                {activeView === 'private' && privatePosts.map((post, i) => <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}><PostComponent post={post} onImageClick={setLightboxUrl} /></div>)}
                                {activeView === 'public' && publicPosts.map((post, i) => <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}><PostComponent post={post} onImageClick={setLightboxUrl} /></div>)}
                                
                                {(activeView === 'private' && privatePosts.length === 0) && <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50"><p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">No member posts yet</p><p className="text-text-secondary-light dark:text-text-secondary">Be the first to share something with the community!</p></div>}
                                {(activeView === 'public' && publicPosts.length === 0) && <div className="text-center py-20 px-6 bg-white/60 dark:bg-secondary/60 backdrop-blur-sm rounded-2xl border-2 border-tertiary-light/50 dark:border-tertiary/50"><p className="text-xl font-bold text-text-main-light dark:text-text-main mb-2">No public posts yet</p><p className="text-text-secondary-light dark:text-text-secondary">This community hasn't shared anything publicly yet.</p></div>}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

const SubcommunityLink: React.FC<{ label?: string, subcommunity?: Subcommunity, isActive: boolean, onClick: () => void, onJoinToggle?: (...args: any) => void }> = ({ label, subcommunity, isActive, onClick, onJoinToggle }) => {
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
                {isChannel ? <span className="text-lg font-semibold text-text-tertiary-light dark:text-text-tertiary">#</span> : <UserGroupIcon className="w-5 h-5 text-text-tertiary-light dark:text-text-tertiary"/>}
                <span className={`font-semibold truncate ${isActive ? 'text-brand-green' : 'text-text-secondary-light dark:text-text-secondary'}`}>{name}</span>
                {subcommunity?.access_type === 'restricted' && <LockClosedIcon className="w-3 h-3 text-text-tertiary-light dark:text-text-tertiary flex-shrink-0"/>}
            </div>
            {!isChannel && !subcommunity?.is_member && onJoinToggle && (
                <button onClick={handleJoinClick} disabled={subcommunity.has_pending_request} className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${subcommunity.has_pending_request ? 'text-text-tertiary-light dark:text-text-tertiary' : 'text-brand-green hover:bg-brand-green/10'}`}>
                    {subcommunity.has_pending_request ? 'Pending' : 'Join'}
                </button>
            )}
        </div>
    );
};

export default CommunityPage;