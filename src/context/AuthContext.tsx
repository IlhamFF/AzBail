'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client'; // Use the browser client
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
      // Use the imported browser client
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Use the imported browser client for the listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect logic based on auth state and current path
        const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
        const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';

        if (event === 'SIGNED_IN') {
            // Redirect non-admins trying to access admin routes
            if (isAdminRoute && session?.user?.user_metadata?.role !== 'Admin') {
                await supabase.auth.signOut(); // Sign them out
                router.push('/login'); // Redirect to general login
            }
            // Redirect logged-in users away from auth pages (unless it's admin login for admin)
            else if (isAuthPage && !(pathname === '/admin/login' && session?.user?.user_metadata?.role === 'Admin')) {
                 router.push('/dashboard');
            }
        } else if (event === 'SIGNED_OUT') {
           // Redirect logged-out users trying to access protected areas
           if (!isAuthPage && pathname !== '/') {
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
    await supabase.auth.signOut(); // Use the imported browser client
    setUser(null);
    setSession(null);
    // No need to setLoading(false) here, onAuthStateChange will handle it
    router.push('/login'); // Redirect to login after sign out
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  // Show loading state while determining auth status, except on public/auth pages
  const isPublicPage = pathname === '/login' || pathname === '/register' || pathname === '/admin/login' || pathname === '/';
   if (loading && !isPublicPage) {
     return <div>Loading application...</div>; // Or a proper loading component
   }

  // Prevent rendering protected pages if loading or no user (let useEffect handle redirect)
   if (!loading && !user && !isPublicPage) {
       return <div>Redirecting...</div>; // Or loading state
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
