// src/components/Header.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AboutModal from './AboutModal';

// Re-add isSidebarExpanded to the interface
interface HeaderProps {
    isSidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded }) => {
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    return (
        <>
            {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
            <header 
                // Set height to h-24 (6rem)
                className="fixed top-0 left-0 right-0 bg-secondary-light dark:bg-secondary border-b border-tertiary-light dark:border-tertiary h-24 flex items-center z-20"
            >
                {/* This div now controls the logo's position */}
                <div 
                    className={`transition-all duration-300 ease-in-out px-4 md:px-6 ${
                        isSidebarExpanded ? 'md:pl-48' : 'md:pl-20'
                    }`}
                >
                    <Link 
                        // Increase logo size to text-6xl
                        to="/" 
                        className="text-5xl font-raleway font-black text-brand-green [text-shadow:-1px_-1px_0_rgba(0,0,0,0.7),_1px_1px_0_rgba(255,255,255,0.05)]"
                    >
                        litelelo.
                    </Link>
                </div>
            </header>
        </>
    );
};

export default Header;