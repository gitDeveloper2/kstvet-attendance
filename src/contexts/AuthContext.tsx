'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'trainer' | 'trainee'
  ) => Promise<{ error: any; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // In the browser we can safely fetch the verified user to get authoritative metadata
          const { data: verifiedUserData } = await supabase.auth.getUser();

          // Fetch user profile from our users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const meta = (verifiedUserData.user?.user_metadata ?? session.user.user_metadata) as any;

          if (profileError) {
            console.log('[auth] users profile fetch error, falling back to auth metadata', {
              error: profileError.message,
            });

            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email ?? '',
              name: meta?.name ?? '',
              role: (meta?.role ?? 'trainee') as any,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            setUser(fallbackUser);
          } else {
            const merged: User = {
              ...(profile as any),
              role: (meta?.role ?? (profile as any)?.role ?? 'trainee') as any,
              name: meta?.name ?? (profile as any)?.name ?? '',
            };
            setUser(merged);
          }
        }
      } catch (e: any) {
        console.log('[auth] getInitialSession error', {
          error: e?.message ?? String(e),
        });
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            // In the browser we can safely fetch the verified user to get authoritative metadata
            const { data: verifiedUserData } = await supabase.auth.getUser();

            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const meta = (verifiedUserData.user?.user_metadata ?? session.user.user_metadata) as any;

            if (profileError) {
              console.log('[auth] users profile fetch error (onAuthStateChange), falling back to auth metadata', {
                event,
                error: profileError.message,
              });

              const fallbackUser: User = {
                id: session.user.id,
                email: session.user.email ?? '',
                name: meta?.name ?? '',
                role: (meta?.role ?? 'trainee') as any,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              setUser(fallbackUser);
            } else {
              const merged: User = {
                ...(profile as any),
                role: (meta?.role ?? (profile as any)?.role ?? 'trainee') as any,
                name: meta?.name ?? (profile as any)?.name ?? '',
              };
              setUser(merged);
            }
          } else {
            setUser(null);
          }
        } catch (e: any) {
          console.log('[auth] onAuthStateChange handler error', {
            event,
            error: e?.message ?? String(e),
          });
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (e: any) {
      return {
        error: {
          message: e?.message ?? 'Failed to sign in',
        },
      };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: 'trainer' | 'trainee') => {
    // First create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { error: authError, needsEmailConfirmation: false };

    // Then create user profile (server-side, bypassing RLS safely)
    if (authData.user) {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: authData.user.id,
          email,
          name,
          role,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok) {
        return {
          error: {
            message: result?.error ?? 'Failed to create user profile',
          },
          needsEmailConfirmation: false,
        };
      }
    }

    return { error: null, needsEmailConfirmation: !authData.session };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
