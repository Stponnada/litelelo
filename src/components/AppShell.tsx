'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LeftSidebar from '@/components/LeftSidebar';
import BottomNavBar from '@/components/BottomNavBar';
import AboutModal from '@/components/AboutModal';
import Spinner from '@/components/Spinner';
import { supabase } from '@/services/supabase';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [username, setUsername] = useState<string | null>(null);

    // Logic to hide layout on Login/Landing/Profile Setup pages
    const isAuthPage = pathname === '/login' || pathname === '/profile-setup';
    const isChatPage = pathname?.startsWith('/chat');
    const isFullWidthPage = isChatPage || pathname?.startsWith('/campus');

    useEffect(() => {
        const fetchUsername = async () => {
            if (user) {
                const { data } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
                if (data) setUsername(data.username);
            }
        };
        fetchUsername();
    }, [user]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }

    if (isAuthPage) {
        return <>{children}</>;
    }

    // Basic protection for app routes
    if (!user) {
        // In a real app, use middleware, but this works for migration
        return <>{children}</>;
    }

    return (
        <div className={`min-h-screen ${isFullWidthPage ? 'bg-white dark:bg-black' : 'bg-primary-light dark:bg-primary'}`}>
            <div className="bg-texture"></div>
            {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}

            <LeftSidebar
                isExpanded={isSidebarExpanded}
                setIsExpanded={setIsSidebarExpanded}
                username={username}
                onOpenAboutModal={() => setIsAboutModalOpen(true)}
            />

            <main
                className={`
          min-h-screen
          pt-0
          pb-20 md:pb-0
          transition-all duration-300 ease-in-out 
          ${isSidebarExpanded ? 'md:pl-[280px]' : 'md:pl-20'}
        `}
            >
                <div className={isFullWidthPage ? 'h-full' : 'px-4 py-4 md:pt-8 md:px-8 md:pb-8 max-w-7xl mx-auto'}>
                    {children}
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}
