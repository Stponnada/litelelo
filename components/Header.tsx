// src/components/Header.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import { 
  UserIcon, SunIcon, MoonIcon, InformationCircleIcon, LogoutIcon,
  QuestionMarkCircleIcon, ShieldCheckIcon, LockClosedIcon 
} from './icons';

interface HeaderProps {
    isSidebarExpanded: boolean;
    onOpenAboutModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded, onOpenAboutModal }) => {
    const { profile } = useAuth();
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

    return (
        <header
            className="overflow-visible fixed top-0 left-0 right-0 bg-secondary-light dark:bg-secondary border-b border-tertiary-light dark:border-tertiary h-16 md:h-24 flex items-center justify-between px-4 md:justify-start md:px-0 z-20"
        >
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-repeat bg-[url('/patterns/tech-circuit.svg')] text-green-950 opacity-5 dark:opacity-25 pointer-events-none" />

            {/* Mobile Profile Menu (Left Item) */}
            {profile && (
                <div ref={menuRef} className="relative md:hidden z-20">
                    {/* The pop-up menu */}
                    <div className={`
                        absolute top-full mt-3 w-64 bg-secondary-light dark:bg-secondary 
                        rounded-xl shadow-2xl border border-tertiary-light dark:border-tertiary 
                        transition-all duration-300 ease-in-out origin-top-left left-0
                        ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
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

            {/* Logo (Center Item) */}
            <div
                className={`transition-all duration-300 ease-in-out md:px-6 z-10 ${
                    isSidebarExpanded ? 'md:pl-48' : 'md:pl-20'
                }`}
            >
                <Link
                    to="/"
                    className="text-4xl md:text-5xl font-raleway font-black text-brand-green [text-shadow:-1px_-1px_0_rgba(0,0,0,0.7),_1px_1px_0_rgba(255,255,255,0.05)]"
                >
                    litelelo.
                </Link>
            </div>

            {/* Spacer for Mobile (Right Item) */}
            <div className="w-9 h-9 md:hidden" />

        </header>
    );
};

export default Header;