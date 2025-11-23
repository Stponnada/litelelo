'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import LandingPage from '@/components/LandingPage';
import HomePage from '@/components/HomePage';
import Spinner from '@/components/Spinner';

export default function Page() {
  const { user, isLoading } = useAuth();

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

  return <HomePage />;
}
