// src/components/BottomNavBar.tsx

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { supabase } from '../services/supabase';
import { 
  HomeIcon, BuildingLibraryIcon, ChatIcon, SearchIcon, BookOpenIcon, 
  UserIcon, SunIcon, MoonIcon, InformationCircleIcon, LogoutIcon, XMarkIcon,
  QuestionMarkCircleIcon, ShieldCheckIcon, LockClosedIcon 
} from './icons';

interface BottomNavBarProps {
  onOpenAboutModal: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onOpenAboutModal }) => {
  const { user, profile } = useAuth();
  const { totalUnreadCount } = useChat();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const activeLinkStyle = 'text-brand-green';
  const inactiveLinkStyle = 'text-text-tertiary-light dark:text-text-tertiary';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary-light dark:bg-secondary border-t border-tertiary-light dark:border-tertiary z-30 flex md:hidden">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <HomeIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/campus" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BuildingLibraryIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/search" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <SearchIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/chat" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <div className="relative">
          <ChatIcon className="w-7 h-7" />
          {totalUnreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />}
        </div>
      </NavLink>
      <NavLink 
        to="/directory" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BookOpenIcon className="w-7 h-7" />
      </NavLink>

      {profile && (
        <div ref={menuRef} className="flex-1 flex items-center justify-center relative">
            {/* The pop-up menu */}
            <div className={`
                absolute bottom-full mb-3 w-64 bg-secondary-light dark:bg-secondary 
                rounded-xl shadow-2xl border border-tertiary-light dark:border-tertiary 
                transition-all duration-300 ease-in-out right-2
                ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
            `}>
                <div className="p-2">
                    <Link to={`/profile/${profile.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      <UserIcon className="w-5 h-5" /> Profile
                    </Link>
                    <button onClick={toggleTheme} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                      <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                    <Link to="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      <QuestionMarkCircleIcon className="w-5 h-5" /> Help Center
                    </Link>
                    <button onClick={() => { onOpenAboutModal(); setMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      <InformationCircleIcon className="w-5 h-5" /> About litelelo.
                    </button>
                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                    <Link to="/terms" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      <ShieldCheckIcon className="w-5 h-5" /> Terms of Service
                    </Link>
                    <Link to="/privacy" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                      <LockClosedIcon className="w-5 h-5" /> Privacy Policy
                    </Link>
                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10">
                        <LogoutIcon className="w-5 h-5"/> Logout
                    </button>
                </div>
            </div>

            {/* The trigger button with Avatar */}
            <button onClick={() => setMenuOpen(prev => !prev)} className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-secondary-light dark:ring-offset-secondary ring-transparent ui-focus-visible:ring-brand-green transition-shadow">
                <img src={profile.avatar_url || ''} alt="My Profile" className="w-full h-full object-cover" />
            </button>
        </div>
      )}
    </nav>
  );
};

export default BottomNavBar;