'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Trash2, Edit, AlertTriangle, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteUser } from '@/actions/admin/deleteUser'; // Import the server action
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert component

interface ManagedUser {
  id: string; // User UUID from users table
  email: string | null;
  role: string | null;
  created_at: string;
  full_name: string | null; // From user_details
  is_verified: boolean;
}

const ITEMS_PER_PAGE = 10;
const ROLES = ['Admin', 'Guru', 'Siswa', 'Tata Usaha', 'Kepala Sekolah'];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'verified', 'unverified'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      // IMPORTANT: Ensure RLS policies allow Admins to select from 'users' and 'user_details'.
      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          is_verified,
          created_at,
          user_details ( full_name )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search
      if (searchTerm) {
        // Search by name (from user_details) or email
        query = query.or(`email.ilike.%${searchTerm}%,user_details.full_name.ilike.%${searchTerm}%`);
      }

      // Apply role filter
      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('is_verified', filterStatus === 'verified');
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Supabase fetch users error:', fetchError); // Log the detailed error
        throw fetchError; // Rethrow the error to be caught by the catch block
      }

      const formattedData: ManagedUser[] = data?.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        created_at: user.created_at,
        full_name: (user.user_details as any)?.full_name || 'Nama Tidak Tersedia',
      })) || [];

      setUsers(formattedData);
      setTotalCount(count || 0);

    } catch (err: any) {
      console.error('Error fetching users:', err);
      // Display a more specific error message
      setError(`Gagal memuat daftar pengguna: ${err.message || 'Terjadi kesalahan server.'}`);
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
  }, [currentPage, searchTerm, filterRole, filterStatus]);

  const handleDeleteUser = (userId: string, userName: string | null) => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({
          title: 'Pengguna Dihapus',
          description: `Pengguna ${userName || userId} berhasil dihapus.`,
        });
        // Refetch data for the current page after deletion
        // Check if it was the last item on the page
         if (users.length === 1 && currentPage > 1) {
           setCurrentPage(currentPage - 1);
         } else {
           fetchUsers();
         }
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Menghapus Pengguna',
          description: result.message,
        });
      }
    });
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset page on new search
  };

  const handleRoleChange = (value: string) => {
    setFilterRole(value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1); // Reset page on filter change
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
             <div>
               <CardTitle>Manajemen Pengguna</CardTitle>
               <CardDescription>Kelola akun pengguna sistem.</CardDescription>
             </div>
             {/* <Button disabled>  TODO: Implement Add User Dialog
               <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
             </Button> */}
          </div>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
             <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                   type="search"
                   placeholder="Cari nama atau email..."
                   value={searchTerm}
                   onChange={handleSearchChange}
                   className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                 />
              </div>
             <Select value={filterRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
              </SelectContent>
            </Select>
             <Select value={filterStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="verified">Terverifikasi</SelectItem>
                <SelectItem value="unverified">Belum Verifikasi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
          {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          <div className="overflow-x-auto">
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Skeleton className="h-8 w-8 inline-block" />
                        <Skeleton className="h-8 w-8 inline-block" />
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {!loading && !error && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                      Tidak ada data pengguna yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error && users.length > 0 && (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><Badge variant="secondary">{user.role || 'N/A'}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={user.is_verified ? 'default' : 'destructive'}>
                          {user.is_verified ? 'Terverifikasi' : 'Belum'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(user.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
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
                                Apakah Anda yakin ingin menghapus pengguna <strong>{user.full_name || user.email}</strong>? Tindakan ini tidak dapat diurungkan dan akan menghapus data autentikasi pengguna.
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
                  ))
                )}
              </TableBody>
            </Table>
           </div>
          {/* Pagination */}
           {totalPages > 1 && (
            <div className="flex justify-between items-center space-x-2 pt-4">
               <span className="text-sm text-muted-foreground">
                 Total {totalCount} pengguna
               </span>
                <div className="flex items-center space-x-2">
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handlePageChange(currentPage - 1)}
                       disabled={currentPage === 1 || loading || isPending}
                   >
                       <ChevronLeft className="h-4 w-4" />
                       <span className="hidden sm:inline ml-1">Sebelumnya</span>
                   </Button>
                   <span className="text-sm text-muted-foreground">
                       Halaman {currentPage} dari {totalPages}
                   </span>
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handlePageChange(currentPage + 1)}
                       disabled={currentPage === totalPages || loading || isPending}
                   >
                       <span className="hidden sm:inline mr-1">Berikutnya</span>
                       <ChevronRight className="h-4 w-4" />
                   </Button>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
