// src/components/UserCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { DirectoryProfile, Profile } from '../types';
import Spinner from './Spinner';
import { UserGroupIcon } from './icons';
import { getResizedAvatarUrl } from '../utils/imageUtils';

// --- Icon Components ---
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const UserPlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

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
    <div className="relative bg-secondary-light dark:bg-secondary rounded-2xl shadow-lg border border-tertiary-light dark:border-tertiary p-3 flex flex-row items-center gap-3 transition-all duration-300 hover:border-brand-green/50 w-full">
      
      {isCommunity && (
          <div className="absolute top-2 right-2 bg-brand-green/10 text-brand-green text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
            <UserGroupIcon className="w-3 h-3" />
            Community
          </div>
      )}

      {/* --- PFP is now even smaller --- */}
      <Link to={linkTo} className="flex-shrink-0">
        <img
          src={getResizedAvatarUrl(profile.avatar_url, 80, 80)}
          alt={profile.name || 'avatar'}
          className="w-10 h-10 rounded-full object-cover border-2 border-tertiary-light dark:border-tertiary"
          loading="lazy"
        />
      </Link>

      <div className="flex-1 text-left min-w-0">
        <Link to={linkTo}>
          <h3 className="text-base sm:text-lg font-bold text-text-main-light dark:text-text-main hover:text-brand-green truncate">{profile.name}</h3>
        </Link>
        
        {!isCommunity && profile.username && (
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate">@{profile.username}</p>
        )}

        <div className="mt-1 flex items-center gap-4 text-xs text-text-tertiary-light dark:text-text-tertiary">
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
        // --- Buttons are replaced with icons, arranged horizontally ---
        <div className="flex flex-row gap-2 ml-auto flex-shrink-0">
          <button
            onClick={() => onMessage(profile as any)}
            aria-label="Send message"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-tertiary-light/70 dark:bg-tertiary/70 text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onFollowToggle(profile)}
            disabled={isToggling}
            aria-label={profile.is_following ? 'Unfollow user' : 'Follow user'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
              profile.is_following
                ? 'bg-transparent border border-brand-green text-brand-green hover:bg-brand-green/10'
                : 'bg-brand-green text-black hover:bg-brand-green/90'
            }`}
          >
            {isToggling ? (
              <Spinner />
            ) : profile.is_following ? (
              <UserIcon className="w-5 h-5" />
            ) : (
              <UserPlusIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserCard;