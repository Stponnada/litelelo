'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import HomePage from '@/components/HomePage';
import Spinner from '@/components/Spinner';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading && !isProfileLoading && profile && !profile.profile_complete) {
      router.push('/profile-setup');
    }
  }, [user, isLoading, isProfileLoading, profile, router]);

  if (isLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <HomePage />;
}
