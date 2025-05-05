'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client'; // Use the browser client
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Import useToast

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
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast(); // Get toast function

  useEffect(() => {
    // Flag to prevent setting state after unmount
    let isMounted = true;

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false); // Set loading to false only after getting session
        }
      } catch (e) {
        console.error("Exception in getSession:", e);
        if (isMounted) setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return; // Don't update state if unmounted

        console.log(`Supabase auth event: ${event}`);
        const currentUser = session?.user ?? null;
        const currentUserRole = currentUser?.user_metadata?.role;

        setSession(session);
        setUser(currentUser);
        // Ensure loading is false after auth state change, unless it's the initial load
        // getSession() will handle the initial setLoading(false)
        if (event !== 'INITIAL_SESSION') {
             setLoading(false);
        }


        // --- REDIRECT LOGIC ---
        const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
        const isAdminRoute = pathname.startsWith('/admin');
        const isAdminLoginPage = pathname === '/admin/login';

        if (currentUser) { // User is signed in
          if (currentUserRole === 'Admin') {
            // If Admin is on a non-admin route (and not admin login page), redirect to admin dashboard
            if (!isAdminRoute && !isAdminLoginPage) {
              console.log("AuthContext: Redirecting Admin to /admin/dashboard");
              router.replace('/admin/dashboard');
            }
            // If Admin is somehow on a general auth page (not admin login), redirect to admin dashboard
            else if (isAuthPage && !isAdminLoginPage) {
                console.log("AuthContext: Redirecting logged-in Admin from general auth page to /admin/dashboard");
                router.replace('/admin/dashboard');
            }
          } else { // Non-Admin user
            // If Non-Admin tries to access any admin route, redirect to general dashboard
            if (isAdminRoute) {
              console.log("AuthContext: Redirecting Non-Admin from admin route to /dashboard");
              router.replace('/dashboard');
            }
            // If Non-Admin is on an auth page, redirect to general dashboard
            else if (isAuthPage) {
              console.log("AuthContext: Redirecting logged-in Non-Admin from auth page to /dashboard");
              router.replace('/dashboard');
            }
          }
        } else { // User is signed out
          // Redirect logged-out users trying to access protected areas (non-auth pages, non-root)
          if (!isAuthPage && pathname !== '/') {
            console.log("AuthContext: Redirecting signed out user to /login");
            router.replace('/login');
          }
        }
        // --- END REDIRECT LOGIC ---
      }
    );

    // Cleanup function
    return () => {
      isMounted = false; // Set flag when component unmounts
      authListener?.subscription.unsubscribe();
    };
  }, [router, pathname]); // Dependencies

  const signOut = async () => {
    // setLoading(true); // Optional: Set loading during sign out
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      toast({ variant: 'destructive', title: 'Gagal Keluar', description: error.message });
    }
    // No need to manually set user/session to null, onAuthStateChange will handle it
    // router.replace('/login'); // onAuthStateChange should handle redirect
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  // Return the provider without internal conditional rendering
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
