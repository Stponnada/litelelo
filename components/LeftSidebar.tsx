// src/components/LeftSidebar.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import {
  HomeIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  GlobeIcon,
  SearchIcon,
  InformationCircleIcon
} from './icons';

interface LeftSidebarProps {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  username: string | null;
  onOpenAboutModal: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isExpanded,
  setIsExpanded,
  username,
  onOpenAboutModal,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { totalUnreadCount } = useChat();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string }> = ({
    to,
    icon,
    text,
  }) => (
    <Link
      to={to}
      className="flex items-center p-3 my-1 space-x-4 rounded-lg text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors duration-200"
    >
      {icon}
      <span
        className={`whitespace-nowrap transform transition-all duration-300 ease-in-out
          ${isExpanded ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-3 delay-0'}
        `}
      >
        {text}
      </span>
    </Link>
  );

  return (
    <aside
      className={`fixed top-24 left-0 h-[calc(100vh-theme(space.24))] bg-gray-100 dark:bg-secondary border-r border-tertiary-light dark:border-tertiary z-30 overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-48' : 'w-20'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full p-3 pt-6">
        {/* Navigation Links */}
        <nav className="flex-grow">
          <NavLink to="/" icon={<HomeIcon className="w-7 h-7 flex-shrink-0" />} text="Home" />
          <NavLink to="/campus" icon={<BuildingLibraryIcon className="w-7 h-7 flex-shrink-0" />} text="Campus" />
          <NavLink to="/communities" icon={<UserGroupIcon className="w-7 h-7 flex-shrink-0" />} text="Communities" />
          <NavLink to="/search" icon={<SearchIcon className="w-7 h-7 flex-shrink-0" />} text="Search" />
          <NavLink
            to="/chat"
            icon={
              <div className="relative">
                <ChatIcon className="w-7 h-7 flex-shrink-0" />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />
                )}
              </div>
            }
            text="Messages"
          />
          <NavLink to="/directory" icon={<GlobeIcon className="w-7 h-7 flex-shrink-0" />} text="Directory" />
          {username && (
            <NavLink
              to={`/profile/${username}`}
              icon={<UserIcon className="w-7 h-7 flex-shrink-0" />}
              text="Profile"
            />
          )}
        </nav>

        {/* Profile + Settings */}
        <div className="relative mt-auto group">
          <div className="absolute bottom-full left-0 w-full mb-2 bg-secondary-light dark:bg-primary border border-tertiary-light dark:border-tertiary rounded-lg shadow-lg py-1 transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
            {profile?.username && (
              <Link
                to={`/profile/${profile.username}`}
                className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"
              >
                <UserIcon className="w-5 h-5" /> Profile
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"
            >
              <span className="flex items-center gap-3">
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              </span>
            </button>
            <button
              onClick={onOpenAboutModal}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"
            >
              <InformationCircleIcon className="w-5 h-5" />
              <span>About</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-tertiary-light dark:hover:bg-tertiary"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Profile Summary */}
          <div className="flex items-center w-full p-2 space-x-3 rounded-lg hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors cursor-pointer">
            <img
              src={profile?.avatar_url || ''}
              alt="profile"
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
            <div
              className={`flex-1 text-left min-w-0 transform transition-all duration-300 ease-in-out ${
                isExpanded ? 'opacity-100 translate-x-0 delay-200' : 'opacity-0 -translate-x-3 delay-0'
              }`}
            >
              <p className="font-bold text-sm text-text-main-light dark:text-text-main truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">
                @{profile?.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
