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
}

const UserCard: React.FC<UserCardProps> = ({ profile, isCurrentUser, isToggling, onFollowToggle, onMessage }) => {
  const isCommunity = profile.type === 'community';

  const linkTo = isCommunity 
    ? `/communities/${profile.id}` 
    : `/profile/${profile.username}`;

  return (
    // --- Main layout is now always horizontal with less padding ---
    <div className="relative bg-secondary-light dark:bg-secondary rounded-2xl shadow-lg border border-tertiary-light dark:border-tertiary p-3 sm:p-5 flex flex-row items-center gap-4 transition-all duration-300 hover:border-brand-green/50">
      
      {isCommunity && (
          <div className="absolute top-2 right-2 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
            <UserGroupIcon className="w-3 h-3" />
            Community
          </div>
      )}

      {/* --- Smaller avatar --- */}
      <Link to={linkTo} className="flex-shrink-0">
        <img
          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || ' ')}&background=random`}
          alt={profile.name || 'avatar'}
          className="w-16 h-16 rounded-full object-cover border-4 border-tertiary-light dark:border-tertiary"
        />
      </Link>

      {/* --- Text content is now always left-aligned --- */}
      <div className="flex-1 text-left min-w-0">
        <Link to={linkTo}>
          <h3 className="text-lg font-bold text-text-main-light dark:text-text-main hover:text-brand-green truncate">{profile.name}</h3>
        </Link>
        
        {!isCommunity && profile.username && (
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate">@{profile.username}</p>
        )}
        
        {/* --- Shorter bio on mobile --- */}
        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary line-clamp-1 sm:line-clamp-2">
          {profile.bio || (isCommunity ? 'No description provided.' : 'No bio yet.')}
        </p>

        <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm text-text-tertiary-light dark:text-text-tertiary">
            {isCommunity ? (
                <div className="flex items-center gap-1">
                    <UserGroupIcon className="w-4 h-4" />
                    <strong>{profile.member_count}</strong> members
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    <strong>{profile.follower_count || 0}</strong> followers
                </div>
            )}
        </div>
      </div>

      {!isCurrentUser && !isCommunity && (
        // --- Buttons are stacked vertically, smaller, and pushed to the right ---
        <div className="flex flex-col gap-2 ml-auto flex-shrink-0">
          <button
            onClick={() => onMessage(profile as any)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Message
          </button>
          <button
            onClick={() => onFollowToggle(profile)}
            disabled={isToggling}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all min-w-[80px] ${
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