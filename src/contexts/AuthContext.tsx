'use client';
// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  updateProfileContext: (newProfile: Profile | null) => void;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateProfileContext = (newProfile: Profile | null) => {
    setProfile(newProfile);
  };

  // Helper to manually refresh session data
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn("Session refresh warning:", error.message);
        if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } else if (data.session) {
        if (data.session.access_token !== session?.access_token) {
          setSession(data.session);
          setUser(data.session.user);
        }
      }
    } catch (err) {
      console.error("Unexpected error checking session:", err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.warn("Error fetching profile:", error.message);
        }

        if (mounted) setProfile(profileData as Profile | null);
      } catch (err) {
        console.error("Unexpected profile fetch error:", err);
      }
    };

    // 1. Initial Session Fetch with Safety Timeout
    const initSession = async () => {
      try {
        // Race between getSession and a 5-second timeout to prevent eternal hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 5000)
        );

        const { data: { session: initialSession } } = await Promise.race([
          sessionPromise,
          // If getSession hangs, we fall back to null so the app can at least render (likely redirecting to login)
          timeoutPromise
        ]);

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Ensure we fetch profile safely inside a try/catch block
        try {
          if (!profile || profile.user_id !== session.user.id) {
            await fetchProfile(session.user.id);
          }
        } catch (err) {
          console.error("Profile update error in auth listener:", err);
        }
      } else {
        setProfile(null);
      }

      // ALWAYS turn off loading, even if profile fetch fails
      setIsLoading(false);
    });

    // 3. Window Focus Revalidation
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshSession, profile]);

  const value = {
    session,
    user,
    profile,
    isLoading,
    updateProfileContext,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};