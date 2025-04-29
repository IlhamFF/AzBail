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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

// Define roles - ensure these match your database constraints/enum
const roles = ['Guru', 'Siswa', 'Tata Usaha', 'Kepala Sekolah'] as const;
type Role = typeof roles[number];

const formSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
  confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter.' }),
  role: z.enum(roles, { required_error: 'Peran harus dipilih.' }),
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  // Add optional fields based on role later if needed
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password tidak cocok.',
  path: ['confirmPassword'], // Set the error path to confirmPassword field
});

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      fullName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          // Store role and full name in user_metadata
          // Note: is_verified will be handled by admin later
          data: {
            role: values.role,
            full_name: values.fullName,
            is_verified: false, // Default to not verified
          },
        },
      });

      if (signUpError) {
        // Handle specific errors like email already exists
        if (signUpError.message.includes('unique constraint')) {
           throw new Error('Email sudah terdaftar. Silakan gunakan email lain.');
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Gagal membuat pengguna. Silakan coba lagi.');
      }

      // 2. Optionally, insert into user_details immediately (or handle via trigger/function)
      // This depends on your architecture. If user_metadata is enough for initial display,
      // you might populate user_details after verification or upon first profile edit.
      // Example of inserting into user_details (ensure RLS allows this if done client-side):
      /*
      const { error: detailError } = await supabase
        .from('user_details')
        .insert({
          user_id: signUpData.user.id,
          full_name: values.fullName,
          // Add other fields like phone, address etc. if collected during registration
        });

      if (detailError) {
        // Consider how to handle failure here - maybe log it, but proceed with signup message
        console.error('Error inserting user details:', detailError);
      }
      */


      toast({
        title: 'Registrasi Berhasil',
        description: 'Akun Anda telah dibuat. Menunggu verifikasi admin.',
      });

      // Redirect to login or a "pending verification" page
      router.push('/login');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registrasi Gagal',
        description: error.message || 'Terjadi kesalahan saat mencoba registrasi.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Daftar Akun EduPortal</CardTitle>
          <CardDescription className="text-center">
            Lengkapi formulir di bawah ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama Lengkap Anda" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daftar Sebagai</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih peran Anda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Memproses...' : 'Daftar'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
             Sudah punya akun?{' '}
             <Link href="/login" className="underline text-accent">
               Login di sini
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
