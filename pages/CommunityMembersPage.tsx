// src/pages/CommunityMembersPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import { UserGroupIcon } from '../components/icons';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const MemberCard: React.FC<{ profile: Profile }> = ({ profile }) => (
    <Link 
      to={`/profile/${profile.username}`} 
      className="bg-secondary-light dark:bg-secondary p-4 rounded-lg flex items-center space-x-4 hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors border border-tertiary-light dark:border-tertiary"
    >
        <img 
            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`} 
            alt={profile.username}
            className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-grow overflow-hidden">
            <h3 className="font-bold text-text-main-light dark:text-text-main text-md truncate">{profile.full_name || profile.username}</h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">@{profile.username}</p>
        </div>
    </Link>
);

const CommunityMembersPage: React.FC = () => {
    const { communityId } = useParams<{ communityId: string }>();
    const navigate = useNavigate();
    const [communityInfo, setCommunityInfo] = useState<{ name: string } | null>(null);
    const [members, setMembers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCommunityMembers = async () => {
            if (!communityId) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch community name
                const { data: communityData, error: commError } = await supabase
                    .from('communities')
                    .select('name')
                    .eq('id', communityId)
                    .single();
                if (commError || !communityData) throw new Error("Community not found.");
                setCommunityInfo(communityData);

                // Fetch members
                const { data: membersData, error: membersError } = await supabase
                    .from('community_members')
                    .select('profiles(*)')
                    .eq('community_id', communityId);
                
                if (membersError) throw membersError;
                
                const memberProfiles = membersData.map((m: any) => m.profiles).filter(Boolean);
                setMembers(memberProfiles as Profile[]);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunityMembers();
    }, [communityId]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">Error: {error}</div>;
    }

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
                {members.map(member => (
                    <MemberCard key={member.user_id} profile={member} />
                ))}
            </div>
        </div>
    );
};

export default CommunityMembersPage;