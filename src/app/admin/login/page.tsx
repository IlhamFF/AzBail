'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Use browser client
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth


export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user: authUser, loading: authLoading } = useAuth(); // Get auth state

   // Redirect if already logged in as admin
   React.useEffect(() => {
    if (!authLoading && authUser && authUser.user_metadata?.role === 'Admin') {
      router.push('/admin/dashboard'); // Or your main admin page
    }
  }, [authUser, authLoading, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use browser client
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }

      // Use the user data from the sign-in response
      const userRole = data.user?.user_metadata?.role;

      // Check if the user is an admin
      if (userRole === 'Admin') {
        toast({
          title: 'Login Admin Berhasil',
          description: 'Anda akan diarahkan ke dashboard admin.',
        });
        // AuthProvider's onAuthStateChange will handle redirection
        // Force a navigation event if needed, but usually context handles it
         router.push('/admin/dashboard');
      } else {
        // Sign out immediately if the signed-in user is not an admin
        await supabase.auth.signOut();
        toast({
          variant: 'destructive',
          title: 'Akses Ditolak',
          description: 'Akun ini tidak memiliki izin admin.',
        });
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message || 'Email atau password salah.',
      });
    } finally {
      setIsLoading(false);
    }
  };

   // Prevent rendering form if already logged in and redirecting
   if (authLoading || (authUser && authUser.user_metadata?.role === 'Admin')) {
     return <div>Loading or redirecting...</div>;
   }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login Admin</CardTitle>
          <CardDescription className="text-center">
            Masukkan email dan password admin Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
             <Link href="/login" className="underline text-accent">
               Login sebagai pengguna biasa
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
