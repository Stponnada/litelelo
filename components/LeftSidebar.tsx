// src/components/LeftSidebar.tsx

import React, { useEffect, useState } from 'react';
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
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  SettingsCogIcon,
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
  
  const [sidebarMode, setSidebarMode] = useState<'hover' | 'expanded' | 'collapsed'>('hover');

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string }> = ({
    to,
    icon,
    text,
  }) => (
    <Link
      to={to}
      className="group flex items-center p-3 my-1 space-x-4 rounded-xl text-text-secondary-light dark:text-text-secondary hover:bg-brand-green/10 hover:text-brand-green transition-all duration-200"
    >
      <div className="flex-shrink-0 transition-colors duration-200 group-hover:text-brand-green">
        {icon}
      </div>
      <span
        className={`whitespace-nowrap font-medium transition-all duration-300 origin-left
          ${isExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-4 scale-95 w-0 overflow-hidden'}
        `}
      >
        {text}
      </span>
    </Link>
  );

  useEffect(() => {
    const key = 'litelelo.sidebarMode';
    const fromStorage = localStorage.getItem(key) as 'hover' | 'expanded' | 'collapsed' | null;
    if (fromStorage) {
        setSidebarMode(fromStorage);
        if (fromStorage === 'expanded') setIsExpanded(true);
        if (fromStorage === 'collapsed') setIsExpanded(false);
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === key && e.newValue) setSidebarMode(e.newValue as any);
    };
    
    const handleCustomChange = (e: Event) => {
        const mode = (e as CustomEvent).detail;
        setSidebarMode(mode);
        if (mode === 'expanded') setIsExpanded(true);
        if (mode === 'collapsed') setIsExpanded(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('litelelo:sidebar-mode-changed', handleCustomChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('litelelo:sidebar-mode-changed', handleCustomChange);
    };
  }, [setIsExpanded]);

  const handleMouseEnter = () => {
    if (sidebarMode === 'hover') setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (sidebarMode === 'hover') setIsExpanded(false);
  };

  return (
    <aside
      className={`hidden md:flex flex-col fixed top-0 left-0 h-screen pt-20
      bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl 
      border-r border-tertiary-light/50 dark:border-tertiary/50 z-40
      transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
      overflow-visible
      ${isExpanded ? 'w-64 shadow-2xl' : 'w-20'}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col h-full p-3 overflow-visible">
        {/* Navigation Links - Scrollable Area */}
        <nav className="flex-grow space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <NavLink to="/" icon={<HomeIcon className="w-7 h-7" />} text="Home" />
          <NavLink to="/campus" icon={<BuildingLibraryIcon className="w-7 h-7" />} text="Campus" />
          <NavLink to="/communities" icon={<UserGroupIcon className="w-7 h-7" />} text="Communities" />
          <NavLink to="/search" icon={<SearchIcon className="w-7 h-7" />} text="Search" />
          <NavLink
            to="/chat"
            icon={
              <div className="relative">
                <ChatIcon className="w-7 h-7" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
                  </span>
                )}
              </div>
            }
            text="Chat"
          />
          <NavLink to="/directory" icon={<GlobeIcon className="w-7 h-7" />} text="Directory" />
          {username && (
            <NavLink
              to={`/profile/${username}`}
              icon={<UserIcon className="w-7 h-7" />}
              text="Profile"
            />
          )}
        </nav>

        {/* Bottom Section - Profile & Menu */}
        <div className="mt-auto pt-4 border-t border-tertiary-light/50 dark:border-white/5 pb-4">
            <div className="relative group">
                {/* Popover Menu - Adaptive Positioning */}
                <div className={`
                    absolute w-64 mb-2 p-2 z-50
                    bg-secondary-light/95 dark:bg-[#0B101B]/95 backdrop-blur-xl
                    border border-tertiary-light dark:border-white/10 
                    rounded-2xl shadow-2xl 
                    transition-all duration-200 
                    opacity-0 invisible scale-95
                    group-hover:opacity-100 group-hover:visible group-hover:scale-100
                    ${!isExpanded 
                        ? 'left-full bottom-0 ml-4 origin-bottom-left' // Collapsed: Pop Right
                        : 'bottom-full left-0 mb-2 origin-bottom'      // Expanded: Pop Up
                    }
                `}>
                    {profile?.username && (
                        <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-tertiary-light dark:hover:bg-white/5 transition-colors mb-1">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-brand-green/30">
                                <img src={profile.avatar_url || ''} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text-main-light dark:text-text-main truncate">{profile.full_name}</p>
                                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{profile.username}</p>
                            </div>
                        </Link>
                    )}
                    
                    <div className="space-y-1">
                        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                        </button>
                        <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            <SettingsCogIcon className="w-5 h-5" /> Settings
                        </Link>
                        <Link to="/help" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            <QuestionMarkCircleIcon className="w-5 h-5" /> Help Center
                        </Link>
                        <button onClick={onOpenAboutModal} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            <InformationCircleIcon className="w-5 h-5" /> About
                        </button>
                        <Link to="/terms" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            <ShieldCheckIcon className="w-5 h-5" /> Terms
                        </Link>
                        <Link to="/privacy" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-white/5 rounded-lg transition-colors">
                            <LockClosedIcon className="w-5 h-5" /> Privacy
                        </Link>
                        <div className="h-px bg-tertiary-light dark:bg-white/10 my-1" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                            <LogoutIcon className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </div>

                {/* User Avatar Button */}
                <div className={`flex items-center p-2 rounded-xl hover:bg-brand-green/10 dark:hover:bg-white/5 cursor-pointer transition-all duration-300 ${!isExpanded ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-brand-green transition-all">
                         <img
                            src={profile?.avatar_url || ''}
                            alt="profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className={`ml-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <p className="text-sm font-bold text-text-main-light dark:text-text-main truncate max-w-[150px]">{profile?.full_name}</p>
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate">@{profile?.username}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;