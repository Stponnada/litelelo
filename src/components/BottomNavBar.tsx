// src/components/BottomNavBar.tsx

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useChat } from '../hooks/useChat';
import {
  HomeIcon, BuildingLibraryIcon, ChatIcon, SearchIcon, UserGroupIcon
} from './icons';


const BottomNavBar: React.FC = () => {
  const { totalUnreadCount } = useChat();
  const pathname = usePathname();

  const activeLinkStyle = 'text-brand-green';
  const inactiveLinkStyle = 'text-text-tertiary-light dark:text-text-tertiary';

  const getLinkClass = (path: string, exact = false) => {
    const isActive = exact ? pathname === path : pathname?.startsWith(path);
    return `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary-light dark:bg-secondary border-t border-tertiary-light dark:border-tertiary z-30 flex md:hidden">
      <Link
        href="/"
        className={getLinkClass('/', true)}
      >
        <HomeIcon className="w-7 h-7" />
      </Link>
      <Link
        href="/campus"
        className={getLinkClass('/campus')}
      >
        <BuildingLibraryIcon className="w-7 h-7" />
      </Link>
      <Link
        href="/communities"
        className={getLinkClass('/communities')}
      >
        <UserGroupIcon className="w-7 h-7" />
      </Link>
      <Link
        href="/search"
        className={getLinkClass('/search')}
      >
        <SearchIcon className="w-7 h-7" />
      </Link>
      <Link
        href="/chat"
        className={getLinkClass('/chat')}
      >
        <div className="relative">
          <ChatIcon className="w-7 h-7" />
          {totalUnreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />}
        </div>
      </Link>
    </nav>
  );
};

export default BottomNavBar;