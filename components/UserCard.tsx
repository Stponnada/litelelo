// src/components/UserCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { DirectoryProfile, Profile } from '../types';
import Spinner from './Spinner';
import { UserGroupIcon } from './icons';

interface UserCardProps {
  profile: DirectoryProfile;
  isCurrentUser: boolean;
  isToggling: boolean;
  onFollowToggle: (profile: DirectoryProfile) => void;
  onMessage: (profile: Profile) => void;
  activeTab?: string; // This is no longer used but kept for compatibility
}

const UserCard: React.FC<UserCardProps> = ({ profile, isCurrentUser, isToggling, onFollowToggle, onMessage }) => {
  const isCommunity = profile.type === 'community';

  const linkTo = isCommunity 
    ? `/communities/${profile.id}` 
    : `/profile/${profile.username}`;

  return (
    <div className="relative bg-secondary-light dark:bg-secondary rounded-2xl shadow-lg border border-tertiary-light dark:border-tertiary p-5 flex flex-col sm:flex-row items-center gap-5 transition-all duration-300 hover:border-brand-green/50">
      
      {isCommunity && (
          <div className="absolute top-3 right-3 bg-brand-green/10 text-brand-green text-xs font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1.5">
            <UserGroupIcon className="w-4 h-4" />
            Community
          </div>
      )}

      <Link to={linkTo} className="flex-shrink-0">
        <img
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || ' ')}&background=random`}
          alt={profile.name || 'avatar'}
          className="w-24 h-24 rounded-full object-cover border-4 border-tertiary-light dark:border-tertiary"
        />
      </Link>

      <div className="flex-1 text-center sm:text-left">
        <Link to={linkTo}>
          <h3 className="text-xl font-bold text-text-main-light dark:text-text-main hover:text-brand-green">{profile.name}</h3>
        </Link>
        
        {!isCommunity && profile.username && (
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{profile.username}</p>
        )}
        
        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary line-clamp-2 min-h-[40px]">
          {profile.bio || (isCommunity ? 'No description provided.' : 'No bio yet.')}
        </p>

        <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-sm text-text-tertiary-light dark:text-text-tertiary">
            {isCommunity ? (
                <div className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <strong>{profile.member_count}</strong> members
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-1">
                        <strong>{profile.follower_count || 0}</strong> followers
                    </div>
                </>
            )}
        </div>
      </div>

      {!isCurrentUser && !isCommunity && (
        <div className="flex flex-col sm:flex-row gap-2 self-stretch sm:self-center">
          <button
            onClick={() => onMessage(profile as any)}
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Message
          </button>
          <button
            onClick={() => onFollowToggle(profile)}
            disabled={isToggling}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-bold rounded-lg transition-all min-w-[100px] ${
              profile.is_following
                ? 'bg-transparent border-2 border-brand-green text-brand-green hover:bg-brand-green/10'
                : 'bg-brand-green text-black hover:bg-brand-green-darker'
            }`}
          >
            {isToggling ? <Spinner /> : profile.is_following ? 'Following' : 'Follow'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserCard;