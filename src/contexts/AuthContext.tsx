'use client';
// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  updateProfileContext: (newProfile: Profile | null) => void;
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
          }

          setProfile(profileData as Profile | null);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          setProfile(data as Profile | null);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    isLoading,
    updateProfileContext
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