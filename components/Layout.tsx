// src/components/Layout.tsx

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar';
import AboutModal from './AboutModal';
import FloatingFooter from './FloatingFooter';

const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const isChatPage = location.pathname.startsWith('/chat');

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
          <Outlet />
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
};

export default Layout;