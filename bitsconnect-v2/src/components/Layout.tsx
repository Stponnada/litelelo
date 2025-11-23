// src/components/Layout.tsx
'use client';

import { useState, useEffect } from 'react';
// FIXED: Removed Outlet, useLocation. Added usePathname.
import { usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar';
import AboutModal from './AboutModal';
// unused: import FloatingFooter from './FloatingFooter';

// FIXED: Layout now accepts children
interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  // FIXED: usePathname
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  // FIXED: use pathname instead of location.pathname
  const isChatPage = pathname?.startsWith('/chat');

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
        if (data) setUsername(data.username);
      }
    };
    fetchUsername();
  }, [user]);

  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary">
      {/* Background Texture */}
      <div className="bg-texture"></div>

      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}

      <Header isSidebarExpanded={isSidebarExpanded} onOpenAboutModal={() => setIsAboutModalOpen(true)} />

      <LeftSidebar
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        username={username}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
      />

      {/* 
         FIXED: Padding logic 
         - Mobile: pt-16 (for header) pb-20 (for bottom nav)
         - Desktop: pt-20 (header). pl-20 (collapsed sidebar) or pl-64 (expanded sidebar)
      */}
      <main
        className={`
          min-h-screen
          pt-16 md:pt-20 
          pb-20 md:pb-0
          transition-all duration-300 ease-in-out 
          ${isSidebarExpanded ? 'md:pl-64' : 'md:pl-20'}
        `}
      >
        <div className={isChatPage ? 'h-full' : 'p-4 md:p-8 max-w-7xl mx-auto'}>
          {/* FIXED: Render children instead of Outlet */}
          {children}
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
};

export default Layout;