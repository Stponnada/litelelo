// src/components/Header.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { supabase } from '../services/supabase';
import {
  UserIcon, SunIcon, MoonIcon, InformationCircleIcon, LogoutIcon,
  QuestionMarkCircleIcon, ShieldCheckIcon, LockClosedIcon, BellIcon, SearchIcon, XMarkIcon
} from './icons';
import NotificationPanel from './NotificationPanel';
import GlobalSearchBar from './GlobalSearchBar';

interface HeaderProps {
    isSidebarExpanded: boolean;
    onOpenAboutModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded, onOpenAboutModal }) => {
    const { profile } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
    const { unreadCount } = useNotifications();

    const menuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header
            className="fixed top-0 left-0 right-0 h-16 md:h-20 z-50 
            bg-secondary-light/70 dark:bg-secondary/70 backdrop-blur-xl 
            border-b border-tertiary-light/50 dark:border-white/5 transition-all duration-300"
        >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-repeat bg-[url('/patterns/tech-circuit.svg')] opacity-5 dark:opacity-10 pointer-events-none" />
            
            {/* --- MOBILE SEARCH OVERLAY --- */}
            {isSearchOverlayOpen && (
                <div className="fixed inset-0 z-[100] bg-secondary-light/95 dark:bg-[#0B101B]/95 backdrop-blur-xl p-4 animate-fadeIn">
                    <div className="flex justify-end mb-4">
                        <button 
                            onClick={() => setIsSearchOverlayOpen(false)}
                            className="p-2 rounded-full bg-tertiary-light dark:bg-white/10 text-text-main-light dark:text-white"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="mt-4">
                        <GlobalSearchBar />
                    </div>
                </div>
            )}

            {/* --- MOBILE HEADER LAYOUT --- */}
            <div className="md:hidden h-full w-full flex items-center justify-between px-4 relative z-20">
                {/* Left Item (Avatar Menu) */}
                <div className="flex-1 flex justify-start items-center gap-3">
                    {profile && (
                        <div ref={menuRef} className="relative">
                             <div className={`absolute top-full mt-3 w-64 bg-secondary-light dark:bg-secondary rounded-xl shadow-2xl border border-tertiary-light dark:border-tertiary transition-all duration-300 ease-in-out origin-top-left left-0 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                <div className="p-2">
                                    <Link to={`/profile/${profile.username}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"><UserIcon className="w-5 h-5" /> Profile</Link>
                                    <button onClick={toggleTheme} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">{theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}<span>{theme === 'light' ? 'Dark Mode' : theme === 'dark' ? 'Monochrome' : 'Light Mode'}</span></button>
                                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                                    <Link to="/help" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"><QuestionMarkCircleIcon className="w-5 h-5" /> Help Center</Link>
                                    <button onClick={() => { onOpenAboutModal(); setMenuOpen(false); }} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"><InformationCircleIcon className="w-5 h-5" /> About litelelo.</button>
                                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                                    <Link to="/terms" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"><ShieldCheckIcon className="w-5 h-5" /> Terms of Service</Link>
                                    <Link to="/privacy" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"><LockClosedIcon className="w-5 h-5" /> Privacy Policy</Link>
                                    <div className="my-1 h-px bg-tertiary-light dark:bg-tertiary/50" />
                                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10"><LogoutIcon className="w-5 h-5"/> Logout</button>
                                </div>
                            </div>
                            <button onClick={() => setMenuOpen(prev => !prev)} className="w-9 h-9 rounded-full overflow-hidden border border-tertiary-light dark:border-tertiary">
                                <img src={profile.avatar_url || ''} alt="My Profile" className="w-full h-full object-cover" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Center Item (Logo) - Increased size */}
                <div className="">
                    <Link to="/" className="text-4xl font-raleway font-black text-brand-green tracking-tighter">
                        litelelo.
                    </Link>
                </div>

                {/* Right Item (Search & Notifications) */}
                <div className="flex-1 flex justify-end items-center gap-1">
                    <button 
                        onClick={() => setIsSearchOverlayOpen(true)} 
                        className="p-2 rounded-full hover:bg-tertiary-light dark:hover:bg-white/5 transition-colors"
                    >
                        <SearchIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary" />
                    </button>

                    <div ref={notificationRef} className="relative">
                        <button onClick={() => setNotificationsOpen(p => !p)} className="p-2 relative rounded-full hover:bg-tertiary-light dark:hover:bg-white/5 transition-colors">
                            <BellIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary" />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-secondary-light dark:ring-secondary" />}
                        </button>
                        <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
                    </div>
                </div>
            </div>

            {/* --- DESKTOP HEADER LAYOUT --- */}
            <div className="hidden md:flex h-full w-full items-center justify-between px-8 relative z-20">
                {/* Logo Area - Adjusted to match sidebar width logic from layout */}
                <div className={`transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-20'} flex items-center`}>
                    <Link to="/" className="flex items-center gap-3 text-brand-green relative z-10">
                        {/* Show full logo if expanded, or just icon logic if preferred. Here we keep it simple */}
                        <span className="text-5xl font-raleway font-black tracking-tight">
                            {isSidebarExpanded ? 'litelelo.' : 'litelelo.'}
                        </span>
                    </Link>
                </div>

                {/* Right Side Controls */}
                <div ref={notificationRef} className="relative">
                    <button 
                        onClick={() => setNotificationsOpen(p => !p)} 
                        className="p-2.5 relative rounded-full hover:bg-tertiary-light/50 dark:hover:bg-white/5 transition-colors"
                    >
                        <BellIcon className="w-6 h-6 text-text-secondary-light dark:text-text-secondary" />
                        {unreadCount > 0 && <span className="absolute top-2 right-2.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-secondary-light dark:ring-secondary" />}
                    </button>
                    <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setNotificationsOpen(false)} />
                </div>
            </div>
        </header>
    );
};

export default Header;