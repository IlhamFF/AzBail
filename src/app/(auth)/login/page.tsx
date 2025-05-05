'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Label } from '@/components/ui/label'; // Import Label component

const formSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
});

// Loading Placeholder Component
const LoadingPlaceholder = () => (
  <div className="flex min-h-screen items-center justify-center">
     <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">EduPortal Login</CardTitle>
        <CardDescription className="text-center">
          Loading...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input placeholder="contoh@email.com" disabled />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="******" disabled />
          </div>
          <Button className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="mt-4 text-center text-sm">
          Loading links...
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
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
      console.log("Login attempt:", values.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("Supabase sign-in error:", error.message);
        throw error;
      }

      console.log("Login success:", data);

      const userRole = data.user?.user_metadata?.role;

      if (userRole === 'Admin') {
        toast({
          title: 'Login Berhasil (Admin)',
          description: 'Mengalihkan ke dashboard admin...',
        });
        router.push('/admin/dashboard');
      } else {
        toast({
          title: 'Login Berhasil',
          description: 'Anda akan diarahkan ke dashboard.',
        });
        router.push('/dashboard');
      }
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
    return <LoadingPlaceholder />; // Use the LoadingPlaceholder component
  }

  // Don't render login form if user is already logged in (and redirection hasn't happened yet)
  if (user) {
     return <div className="flex min-h-screen items-center justify-center">Redirecting...</div>;
  }

  return (
    // Remove the outer flex container
    <Card className="w-full max-w-md shadow-lg mx-auto my-20"> {/* Use mx-auto and my-20 for centering */}
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
  );
}
