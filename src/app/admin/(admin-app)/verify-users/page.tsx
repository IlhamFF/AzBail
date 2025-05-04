'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use browser client for fetching initial list
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle } from 'lucide-react';
import { verifyUser } from '@/actions/admin/verifyUser'; // Import the server action
import type { VerifyUserResult } from '@/actions/admin/verifyUser';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UnverifiedUser {
  id: string; // User UUID from users table
  email: string | null;
  role: string | null;
  created_at: string;
  full_name: string | null; // From user_details
}

export default function VerifyUsersPage() {
  const [users, setUsers] = useState<UnverifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnverifiedUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users where is_verified is false, join with user_details
      // Note: RLS must allow admins to select from users and user_details
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          created_at,
          user_details ( full_name )
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Map data to flatten the structure and handle potential null details
      const formattedData: UnverifiedUser[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
        // Safely access nested full_name, provide fallback
        full_name: (user.user_details as any)?.full_name || 'Nama Tidak Tersedia',
      })) || [];

      setUsers(formattedData);
    } catch (err: any) {
      console.error('Error fetching unverified users:', err);
      setError('Gagal memuat daftar pengguna yang belum diverifikasi.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Data',
        description: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnverifiedUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only once on mount

  const handleVerify = async (userId: string) => {
    setVerifyingId(userId);
    const result: VerifyUserResult = await verifyUser(userId); // Call server action
    setVerifyingId(null);

    if (result.success) {
      toast({
        title: 'Verifikasi Berhasil',
        description: result.message,
      });
      // Optimistic update or refetch
       setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      // await fetchUnverifiedUsers(); // Or refetch the list
    } else {
      toast({
        variant: 'destructive',
        title: 'Verifikasi Gagal',
        description: result.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verifikasi Pengguna Baru</CardTitle>
        <CardDescription>Daftar pengguna yang menunggu verifikasi akun.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border-b">
                 <div className='space-y-1'>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                 </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-destructive text-center">{error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Tidak ada pengguna yang menunggu verifikasi.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Badge variant="secondary">{user.role || 'N/A'}</Badge></TableCell>
                  <TableCell>{format(new Date(user.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleVerify(user.id)}
                      disabled={verifyingId === user.id}
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {verifyingId === user.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                         <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {verifyingId === user.id ? 'Memproses...' : 'Verifikasi'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
