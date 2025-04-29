'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginPage from './(auth)/login/page';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    // You can show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  // This part should ideally not be reached if redirection works correctly
  return <div>Redirecting...</div>;
}
