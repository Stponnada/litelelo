'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/WelcomeScreen';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, isLoading, isProfileLoading } = useAuth();

  // Redirect if not logged in or profile not complete
  React.useEffect(() => {
    if (!isLoading && !isProfileLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (profile && !profile.profile_complete) {
        router.push('/profile-setup');
        return;
      }
    }
  }, [user, profile, isLoading, isProfileLoading, router]);

  if (isLoading || isProfileLoading || !user || !profile || !profile.profile_complete) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  return (
    <WelcomeScreen
      onComplete={() => {
        router.push('/');
      }}
    />
  );
}

