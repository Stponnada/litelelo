// src/components/FloatingFooter.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { InformationCircleIcon, XMarkIcon } from './icons';

interface FloatingFooterProps {
    onOpenAboutModal: () => void;
}

const FloatingFooter: React.FC<FloatingFooterProps> = ({ onOpenAboutModal }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <div 
            ref={menuRef}
            className="hidden md:block fixed bottom-2 md:bottom-1 left-4 md:left-auto md:right-1 z-40"
        >
            {/* The pop-up menu */}
            <div className={`
                absolute bottom-full mb-3 w-64 bg-secondary-light dark:bg-secondary 
                rounded-xl shadow-2xl border border-tertiary-light dark:border-tertiary 
                transition-all duration-300 ease-in-out
                ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                left-0 md:left-auto md:right-0 
            `}>
                <div className="p-2">
                    <a href="/help" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">Help Center</a>
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">Terms of Service</a>
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">Privacy Policy</a>
                    <button 
                        onClick={() => {
                            onOpenAboutModal();
                            setMenuOpen(false);
                        }} 
                        className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary"
                    >
                        About litelelo.
                    </button>
                </div>
                <div className="border-t border-tertiary-light dark:border-tertiary px-5 py-3">
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary">
                        © {new Date().getFullYear()} litelelo. All rights reserved.
                    </p>
                </div>
            </div>

            {/* The trigger button */}
            <button
                onClick={() => setMenuOpen(prev => !prev)}
                className="w-14 h-14 rounded-full bg-secondary-light dark:bg-secondary shadow-lg hover:shadow-xl border border-tertiary-light dark:border-tertiary flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-100"
                aria-label="Open footer menu"
            >
                {isMenuOpen ? (
                    <XMarkIcon className="w-7 h-7 text-text-main-light dark:text-text-main" />
                ) : (
                    <InformationCircleIcon className="w-8 h-8 text-text-secondary-light dark:text-text-secondary" />
                )}
            </button>
        </div>
    );
};

export default FloatingFooter;