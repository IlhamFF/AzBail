'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect logic based on auth state and current path
        const isAuthPage = pathname === '/login' || pathname === '/register';

        if (event === 'SIGNED_IN' && isAuthPage) {
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT' && pathname !== '/login' && pathname !== '/register' && pathname !== '/') {
           // Allow staying on landing page '/'
           if (pathname !== '/') {
             router.push('/login');
           }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
    router.push('/login'); // Redirect to login after sign out
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  // Prevent rendering children on auth pages if user is already logged in (avoids flash of content)
  const isAuthPage = pathname === '/login' || pathname === '/register';
   if (loading && !isAuthPage) {
     return <div>Loading application...</div>; // Or a proper loading component
   }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
