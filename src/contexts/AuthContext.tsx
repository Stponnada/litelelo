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
  isProfileLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

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
        setIsProfileLoading(true);

        // Use our new Redis-cached API route
        const response = await fetch(`/api/profile/by-id/${userId}`);
        const data = await response.json();

        if (response.ok) {
          if (data.fromCache) {
            console.log('%c[Redis] Own Profile Cache HIT', 'color: #00ff00; font-weight: bold;');
          } else {
            console.log('%c[Supabase] Own Profile Cache MISS', 'color: #ff9900; font-weight: bold;');
          }
          if (mounted) setProfile(data as Profile);
        } else {
          // Fallback to direct Supabase if API fails or profile not found
          console.log('%c[Supabase] API Failed, Falling back to direct database query', 'color: #ff0000;');
          const { data: directData, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error && mounted) console.warn("Error loading profile directly:", error.message);
          if (directData && mounted) setProfile(directData as Profile);
        }
      } catch (error) {
        console.error("Profile fetch error", error);
      } finally {
        if (mounted) setIsProfileLoading(false);
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
        } else {
          if (mounted) setIsProfileLoading(false);
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
        setIsProfileLoading(false);
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
        setIsProfileLoading(false);
      } else if (session?.user && event !== 'INITIAL_SESSION') {
        // On sign-in or token refresh, ensure profile is up to date
        // We do NOT set isLoading(true) here to avoid flashing
        // We also do NOT set profile to null before fetching
        fetchProfile(session.user.id);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // Dependencies reduced to avoid loops

  const value = {
    session,
    user,
    profile,
    isLoading,
    updateProfileContext,
    refreshSession,
    isProfileLoading
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