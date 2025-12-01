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

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
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
      console.error("Error checking session:", err);
    }
  }, [session?.access_token]);

  useEffect(() => {
    let mounted = true;

    // Independent function to fetch profile without blocking the UI
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && mounted) console.warn("Error loading profile:", error.message);
        if (data && mounted) setProfile(data as Profile);
      } catch (error) {
        console.error("Profile fetch error", error);
      }
    };

    const initializeAuth = async () => {
      try {
        // 1. Get Session from Supabase (fast, from local storage)
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }

        // 2. Stop the spinner IMMEDIATELY after we know if we have a user or not.
        // We do NOT await the profile here. We let it load in the background.
        if (mounted) setIsLoading(false);

        // 3. Fetch Profile in background if user exists
        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }

      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // 4. Safety Valve: Force loading to stop after 2 seconds max
    // This prevents the "infinite spinner" if Supabase hangs or network is weird.
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn("Forcing loading completion via safety timeout");
        setIsLoading(false);
      }
    }, 2000);

    // 5. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoading(false);
      } else if (session?.user && event !== 'INITIAL_SESSION') {
        // On sign-in or token refresh, ensure profile is up to date
        // We don't set isLoading(true) here to avoid flashing
        fetchProfile(session.user.id);
      }
    });

    // 6. Window Focus Logic (Kept from previous fix)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshSession]); // Dependencies reduced to avoid loops

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