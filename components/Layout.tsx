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
      
      <div className="hidden md:block">
        <Header isSidebarExpanded={isSidebarExpanded} />
        <LeftSidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded} 
          username={username}
          onOpenAboutModal={() => setIsAboutModalOpen(true)}
        />
      </div>
      
      <div className="md:hidden">
        <Header isSidebarExpanded={false} />
      </div>

      <main 
        className={`pt-24 transition-all duration-300 ease-in-out 
                    pb-20 md:pb-0
                    ${isSidebarExpanded ? 'md:pl-48' : 'md:pl-20'}`}
      >
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      <BottomNavBar onOpenAboutModal={() => setIsAboutModalOpen(true)} />
      <FloatingFooter onOpenAboutModal={() => setIsAboutModalOpen(true)} />
    </div>
  );
};

export default Layout;