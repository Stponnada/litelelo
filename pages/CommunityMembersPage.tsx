// src/pages/CommunityMembersPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import { UserGroupIcon, StarIcon } from '../components/icons';

interface CommunityMember extends Profile {
    role: 'member' | 'admin';
}

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const MemberCard: React.FC<{ 
    member: CommunityMember; 
    isViewingUserConsul: boolean;
    onRoleChange: (targetUserId: string, newRole: 'member' | 'admin') => void;
}> = ({ member, isViewingUserConsul, onRoleChange }) => {
    const { user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const isSelf = user?.id === member.user_id;

    return (
        <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg flex items-center space-x-4 hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors border border-tertiary-light dark:border-tertiary relative">
            <Link to={`/profile/${member.username}`}>
                <img 
                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name || member.username}`} 
                    alt={member.username}
                    className="w-12 h-12 rounded-full object-cover"
                />
            </Link>
            <div className="flex-grow overflow-hidden">
                <div className="flex items-center gap-2">
                    <Link to={`/profile/${member.username}`} className="font-bold text-text-main-light dark:text-text-main text-md truncate hover:underline">{member.full_name || member.username}</Link>
                    {member.role === 'admin' && (
                        <div className="flex-shrink-0 flex items-center gap-1 bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-semibold" title="Consul">
                           <StarIcon className="w-3 h-3"/> Consul
                        </div>
                    )}
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">@{member.username}</p>
            </div>
            
            {isViewingUserConsul && !isSelf && (
                 <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" /></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-tertiary-light dark:border-gray-700 rounded-md shadow-lg z-10">
                            {member.role === 'member' ? (
                                <button onClick={() => { onRoleChange(member.user_id, 'admin'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Make Consul</button>
                            ) : (
                                <button onClick={() => { onRoleChange(member.user_id, 'member'); setMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">Remove as Consul</button>
                            )}
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};

const CommunityMembersPage: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [communityInfo, setCommunityInfo] = useState<{ name: string } | null>(null);
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [isViewingUserConsul, setIsViewingUserConsul] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCommunityMembers = useCallback(async () => {
        if (!communityId) return;
        setLoading(true);
        setError(null);
        try {
            const { data: communityData, error: commError } = await supabase.from('communities').select('name').eq('id', communityId).single();
            if (commError || !communityData) throw new Error("Community not found.");
            setCommunityInfo(communityData);

            const { data: membersData, error: membersError } = await supabase.from('community_members').select('role, profiles(*)').eq('community_id', communityId);
            if (membersError) throw membersError;
            
            const memberProfiles = membersData.map((m: any) => ({ ...m.profiles, role: m.role })).filter(Boolean);
            setMembers(memberProfiles as CommunityMember[]);

            const viewingUser = memberProfiles.find(m => m.user_id === user?.id);
            setIsViewingUserConsul(viewingUser?.role === 'admin');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [communityId, user?.id]);

    useEffect(() => {
        fetchCommunityMembers();
    }, [fetchCommunityMembers]);

    const handleRoleChange = async (targetUserId: string, newRole: 'member' | 'admin') => {
        setMembers(prev => prev.map(m => m.user_id === targetUserId ? { ...m, role: newRole } : m));
        try {
            const { error } = await supabase.rpc('set_community_member_role', {
                p_community_id: communityId!,
                p_target_user_id: targetUserId,
                p_new_role: newRole
            });
            if (error) throw error;
        } catch (err) {
            console.error("Failed to change role:", err);
            await fetchCommunityMembers(); // Refetch to revert state on error
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner /></div>;
    if (error) return <div className="text-center p-8 text-red-400">Error: {error}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <header className="flex items-center p-2 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary">
                    <BackIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold ml-4 text-text-main-light dark:text-text-main">{communityInfo?.name || 'Community Members'}</h1>
            </header>

            <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary mb-8">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 flex items-center justify-center">
                        <UserGroupIcon className="w-10 h-10 text-brand-green" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">{communityInfo?.name}</h2>
                        <p className="text-text-tertiary-light dark:text-text-tertiary">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-4 text-text-main-light dark:text-text-main">Members</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.sort((a, b) => a.role === 'admin' ? -1 : 1).map(member => (
                    <MemberCard 
                        key={member.user_id} 
                        member={member} 
                        isViewingUserConsul={isViewingUserConsul}
                        onRoleChange={handleRoleChange}
                    />
                ))}
            </div>
        </div>
    );
};

export default CommunityMembersPage;