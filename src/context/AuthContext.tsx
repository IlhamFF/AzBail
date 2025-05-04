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
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Supabase auth event: ${event}`);
        const currentUser = session?.user ?? null;
        const currentUserRole = currentUser?.user_metadata?.role;

        setSession(session);
        setUser(currentUser);
        setLoading(false);

        // Redirect logic based on auth state and current path
        const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
        const isAdminRoute = pathname.startsWith('/admin');
        const isAdminLoginPage = pathname === '/admin/login';
        const isGeneralDashboard = pathname === '/dashboard';

        if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && currentUser)) {
             // If Admin logged in or already logged in
             if (currentUserRole === 'Admin') {
                 // If Admin is on a non-admin route (and not admin login), redirect to admin dashboard
                 if (!isAdminRoute && !isAdminLoginPage) {
                     console.log("AuthContext: Redirecting Admin to /admin/dashboard");
                     router.replace('/admin/dashboard');
                 }
             }
             // If Non-Admin logged in
             else {
                 // If Non-Admin tries to access any admin route, redirect to general dashboard (or login if forced logout)
                 if (isAdminRoute && !isAdminLoginPage) {
                     console.log("AuthContext: Redirecting Non-Admin from admin route to /dashboard");
                     router.replace('/dashboard');
                     // Optionally sign them out if access should be strictly denied
                     // await supabase.auth.signOut();
                     // router.replace('/login');
                 }
                 // If Non-Admin is on an auth page, redirect to general dashboard
                 else if (isAuthPage) {
                      console.log("AuthContext: Redirecting logged-in Non-Admin from auth page to /dashboard");
                     router.replace('/dashboard');
                 }
             }
        } else if (event === 'SIGNED_OUT') {
           // Redirect logged-out users trying to access protected areas (non-auth pages, non-root)
           if (!isAuthPage && pathname !== '/') {
              console.log("AuthContext: Redirecting signed out user to /login");
              router.replace('/login');
           }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]); // Add router and pathname as dependencies

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
        toast({ variant: 'destructive', title: 'Gagal Keluar', description: error.message }); // Assuming toast is available or handle error differently
    }
    // State updates will be handled by onAuthStateChange
    // setLoading(false); // Let onAuthStateChange handle loading state
    router.replace('/login'); // Explicitly redirect to login after sign out
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
    return <div>Loading application...</div>;
  }

  // Prevent rendering protected pages if loading or no user (let useEffect handle redirect)
  if (!loading && !user && !isPublicPage) {
      // Don't render children, allow redirect logic in useEffect to execute
      return <div>Redirecting...</div>; // Or a loading spinner
  }

  // If user is Admin but not yet on an admin route, show loading/redirecting until useEffect handles it
  if (!loading && user?.user_metadata?.role === 'Admin' && !pathname.startsWith('/admin') && pathname !== '/admin/login') {
      return <div>Redirecting to Admin Dashboard...</div>;
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
