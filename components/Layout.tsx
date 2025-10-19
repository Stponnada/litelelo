// src/components/Layout.tsx

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar';
import AboutModal from './AboutModal';
import FloatingFooter from './FloatingFooter';

const Layout = () => {
  const { user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

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
    <div>
      {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
      
      {/* A single Header component handles both mobile and desktop */}
      <Header isSidebarExpanded={isSidebarExpanded} onOpenAboutModal={() => setIsAboutModalOpen(true)} />
      
      {/* Sidebar is hidden on mobile by default */}
      <LeftSidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
        username={username}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
      />

      <main 
        className={`pt-16 md:pt-24 transition-all duration-300 ease-in-out 
                    pb-20 md:pb-0
                    ${isSidebarExpanded ? 'md:pl-48' : 'md:pl-20'}`}
      >
        <div className="p-4 md:p-6"> {/* Adjusted padding for consistency */}
          <Outlet />
        </div>
      </main>

      <BottomNavBar />
      <FloatingFooter onOpenAboutModal={() => setIsAboutModalOpen(true)} />
    </div>
  );
};

export default Layout;