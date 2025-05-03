'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUser } from '@/actions/admin/deleteUser'; // Import the server action

interface ManagedUser {
  id: string; // User UUID from users table
  email: string | null;
  role: string | null;
  created_at: string;
  full_name: string | null; // From user_details
  is_verified: boolean;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch users and join with user_details
      // Note: RLS must allow admins to select from users and user_details
      const { data, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          is_verified,
          created_at,
          user_details ( full_name )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Map data to flatten the structure
      const formattedData: ManagedUser[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
        // Safely access nested full_name, provide fallback
        full_name: (user.user_details as any)?.full_name || 'Nama Tidak Tersedia',
      })) || [];

      setUsers(formattedData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Gagal memuat daftar pengguna.');
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
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only once on mount

  const handleDeleteUser = (userId: string, userName: string | null) => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({
          title: 'Pengguna Dihapus',
          description: `Pengguna ${userName || userId} berhasil dihapus.`,
        });
        // Optimistic update or refetch
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        // await fetchUsers(); // Or refetch the list
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Menghapus Pengguna',
          description: result.message,
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
        <Button disabled> {/* TODO: Implement Add User Dialog */}
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Kelola akun pengguna sistem.</CardDescription>
          {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
          {loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Skeleton className="h-8 w-8 inline-block" />
                      <Skeleton className="h-8 w-8 inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {error && (
            <p className="text-destructive text-center">{error}</p>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Tidak ada data pengguna.</p>
          )}

          {!loading && !error && users.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status Verifikasi</TableHead>
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
                    <TableCell>
                      <Badge variant={user.is_verified ? 'default' : 'outline'}>
                        {user.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(user.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled> {/* TODO: Implement Edit */}
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Hapus</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="text-destructive" /> Konfirmasi Penghapusan
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus pengguna <strong>{user.full_name || user.email}</strong>? Tindakan ini tidak dapat diurungkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              disabled={isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Add Pagination component here */}
        </CardContent>
      </Card>
    </div>
  );
}
