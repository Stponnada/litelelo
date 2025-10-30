// src/components/BottomNavBar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useChat } from '../hooks/useChat.ts';
import { 
  HomeIcon, BuildingLibraryIcon, ChatIcon, SearchIcon, GlobeIcon, UserGroupIcon, MapIcon
} from './icons';


const BottomNavBar: React.FC = () => {
  const { totalUnreadCount } = useChat();
  
  const activeLinkStyle = 'text-brand-green';
  const inactiveLinkStyle = 'text-text-tertiary-light dark:text-text-tertiary';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary-light dark:bg-secondary border-t border-tertiary-light dark:border-tertiary z-30 flex md:hidden">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <HomeIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/campus" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BuildingLibraryIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/campus/map" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <MapIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/communities" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <UserGroupIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/search" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <SearchIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/chat" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <div className="relative">
          <ChatIcon className="w-7 h-7" />
          {totalUnreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />}
        </div>
      </NavLink>
      <NavLink 
        to="/directory" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <GlobeIcon className="w-7 h-7" />
      </NavLink>
    </nav>
  );
};

export default BottomNavBar;