// src/components/Header.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AboutModal from './AboutModal';

interface HeaderProps {
    isSidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded }) => {
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

    return (
        <>
            {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
            <header
                // Set height to h-16 (mobile) and h-24 (desktop)
                // Center content on mobile, left-align on desktop
                className="overflow-hidden fixed top-0 left-0 right-0 bg-secondary-light dark:bg-secondary border-b border-tertiary-light dark:border-tertiary h-16 md:h-24 flex items-center justify-center md:justify-start z-20"
            >
                {/* Subtle DARK GREEN Circuit Pattern Overlay */}
                <div
                    className="absolute inset-0 bg-repeat bg-[url('/patterns/tech-circuit.svg')] text-green-950 opacity-5 dark:opacity-25 pointer-events-none"
                />

                {/* This div now controls the logo's position and sits ON TOP of the pattern */}
                <div
                    // Remove horizontal padding on mobile for centering, keep desktop logic
                    className={`transition-all duration-300 ease-in-out md:px-6 z-10 ${
                        isSidebarExpanded ? 'md:pl-48' : 'md:pl-20'
                    }`}
                >
                    <Link
                        to="/"
                        // Adjust font size for mobile vs. desktop
                        className="text-4xl md:text-5xl font-raleway font-black text-brand-green [text-shadow:-1px_-1px_0_rgba(0,0,0,0.7),_1px_1px_0_rgba(255,255,255,0.05)]"
                    >
                        litelelo.
                    </Link>
                </div>
            </header>
        </>
    );
};

export default Header;