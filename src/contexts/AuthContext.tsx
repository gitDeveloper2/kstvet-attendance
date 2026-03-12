'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const hydrateSeq = useRef(0);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(t);
          reject(e);
        });
    });
  };

  const hydrateFromSession = async (session: any) => {
    const seq = ++hydrateSeq.current;

    if (!session?.user) {
      setUser(null);
      return;
    }

    const meta = (session.user.user_metadata ?? {}) as any;
    const fallbackUser: User = {
      id: session.user.id,
      email: session.user.email ?? '',
      name: meta?.name ?? '',
      role: (meta?.role ?? 'trainee') as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Do not block rendering on a potentially slow/hanging profile request.
    // Set a best-effort user immediately from auth metadata.
    setUser(fallbackUser);

    // Fetch user profile from our users table
    void (async () => {
      try {
        const profilePromise = supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single() as any as Promise<{ data: any; error: any }>;

        const { data: profile, error: profileError } = await withTimeout(profilePromise, 6000);

        if (hydrateSeq.current !== seq) {
          return;
        }

        if (profileError) {
          console.log('[auth] users profile fetch error, falling back to auth metadata', {
            error: profileError.message,
          });
          return;
        }

        const merged: User = {
          ...(profile as any),
          role: (meta?.role ?? (profile as any)?.role ?? 'trainee') as any,
          name: meta?.name ?? (profile as any)?.name ?? '',
        };
        setUser(merged);
      } catch (e: any) {
        if (hydrateSeq.current !== seq) {
          return;
        }

        console.log('[auth] users profile fetch timed out or failed; using auth metadata', {
          error: e?.message ?? String(e),
        });
      }
    })();
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();

        await hydrateFromSession(session);
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
        setLoading(true);
        try {
          await hydrateFromSession(session);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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
      setLoading(true);
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
