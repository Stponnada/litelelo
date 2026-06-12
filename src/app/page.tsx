'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import HomePage from '@/components/HomePage';
import Spinner from '@/components/Spinner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';

function PageContent() {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const router = useRouter();
  // Once we see a complete profile, remember it as state so the render layer
  // can use it too. This prevents a stale Redis-cached profile_complete=false
  // from bouncing an already-setup user back to profile-setup on token refresh.
  const [profileWasComplete, setProfileWasComplete] = useState(false);

  useEffect(() => {
    if (profile?.profile_complete) {
      setProfileWasComplete(true);
    }
  }, [profile]);

  useEffect(() => {
    if (user && !isLoading && !isProfileLoading) {
      if (!profile && !profileWasComplete) {
        // Genuinely broken/deleted account — never seen a complete profile.
        supabase.auth.signOut();
      } else if (profile && !profile.profile_complete && !profileWasComplete) {
        // Incomplete profile and this user has never completed setup.
        router.push('/profile-setup');
      }
    }
  }, [user, isLoading, isProfileLoading, profile, profileWasComplete, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  // Once we've confirmed a complete profile, render home immediately —
  // never block on background re-fetches (token refresh on tab focus etc.)
  if (profileWasComplete) return <HomePage />;

  // First-time load: wait until we know the profile state
  if (isProfileLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
        <Spinner />
      </div>
    );
  }

  // Profile loaded but incomplete — useEffect will redirect to /profile-setup
  return (
    <div className="flex items-center justify-center h-screen bg-primary-light dark:bg-primary">
      <Spinner />
    </div>
  );
}

export default function Page() {
  return <PageContent />;
}
