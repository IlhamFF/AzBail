'use client';

import * as React from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client'; // Use browser client
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const formSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth(); // Get user and loading state

  // Redirect if already logged in
  React.useEffect(() => {
    if (!loading && user) {
        // Check role for appropriate redirection
        const userRole = user.user_metadata?.role;
        if (userRole === 'Admin') {
            router.push('/admin/dashboard');
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, loading, router]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Use the browser client
      const { error, data } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // Check role after successful sign-in
      const userRole = data.user?.user_metadata?.role;

      if (userRole === 'Admin') {
         toast({
            title: 'Login Berhasil (Admin)',
            description: 'Mengalihkan ke dashboard admin...',
         });
         // Redirect explicitly here or let AuthContext handle it
         router.push('/admin/dashboard');
      } else {
         toast({
           title: 'Login Berhasil',
           description: 'Anda akan diarahkan ke dashboard.',
         });
         // Redirect explicitly here or let AuthContext handle it
         router.push('/dashboard');
      }
      // AuthProvider's onAuthStateChange might also handle redirection, ensure consistency

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Gagal',
        description: error.message || 'Terjadi kesalahan saat mencoba login.',
      });
    } finally {
      setIsLoading(false);
    }
  }

    // Show loading state while checking auth status
    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    // Don't render login form if user is already logged in (and redirection hasn't happened yet)
    if (user) {
        return <div className="flex min-h-screen items-center justify-center">Redirecting...</div>;
    }


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">EduPortal Login</CardTitle>
          <CardDescription className="text-center">
            Masukkan email dan password Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Memproses...' : 'Login'}
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
             Belum punya akun?{' '}
             <Link href="/register" className="underline text-accent">
               Daftar di sini
             </Link>
              {' | '}
             <Link href="/admin/login" className="underline text-accent">
               Login Admin
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
