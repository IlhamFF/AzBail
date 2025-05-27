
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Trash2, Edit, AlertTriangle, Search, ChevronLeft, ChevronRight, Filter, PlusCircle, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { deleteUser } from '@/actions/admin/deleteUser';
import { createUserByAdmin, type CreateUserFormData, type CreateUserResult } from '@/actions/admin/createUserByAdmin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ManagedUser {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string;
  full_name: string | null;
  is_verified: boolean;
}

const ITEMS_PER_PAGE = 10;
const ROLES = ['Admin', 'Guru', 'Siswa', 'Tata Usaha', 'Kepala Sekolah'];

const createUserFormSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
  role: z.enum(ROLES as [string, ...string[]], { // Ensure zod enum gets a non-empty array
    required_error: 'Peran harus dipilih.',
  }),
});

export default function ManageUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitionPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: undefined,
    },
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
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

      if (searchTerm) {
        query = query.or(`email.ilike.%${searchTerm}%,user_details.full_name.ilike.%${searchTerm}%`);
      }
      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }
      if (filterStatus !== 'all') {
        query = query.eq('is_verified', filterStatus === 'verified');
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Supabase fetch users error:', fetchError);
        if (fetchError.message.includes("relationship between 'users' and 'user_details'")) {
          throw new Error(`Gagal memuat daftar pengguna: Supabase tidak dapat menemukan relasi antara 'users' dan 'user_details'. 
                          Pastikan foreign key dari 'user_details.user_id' ke 'auth.users.id' sudah benar di database Supabase Anda. 
                          Cek Table Editor di Supabase, pilih tabel 'user_details', kolom 'user_id', dan pastikan Foreign Key merujuk ke 'auth.users' kolom 'id'. 
                          Setelah itu, coba refresh schema cache di Supabase (Settings -> API).`);
        }
        throw fetchError;
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
      setError(err.message || 'Terjadi kesalahan server.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Data Pengguna',
        description: err.message,
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

  async function onCreateUserSubmit(values: CreateUserFormData) {
    startTransition(async () => {
      const result: CreateUserResult = await createUserByAdmin(undefined, values);
      if (result.success) {
        toast({
          title: 'Pengguna Dibuat',
          description: `Pengguna ${values.fullName} berhasil dibuat.`,
        });
        setIsCreateUserDialogOpen(false);
        createUserForm.reset();
        fetchUsers();
      } else {
        toast({
          variant: 'destructive',
          title: 'Gagal Membuat Pengguna',
          description: result.message,
        });
      }
    });
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setFilterRole(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
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
            <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Tambah Pengguna Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => { if (isTransitionPending) e.preventDefault(); }} onCloseAutoFocus={() => createUserForm.reset()}>
                <DialogHeader>
                  <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                  <DialogDescription>
                    Admin membuat akun baru. Pengguna akan langsung terverifikasi.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createUserForm}>
                  <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={createUserForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl><Input placeholder="Nama Lengkap Pengguna" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl><Input type="password" placeholder="Minimal 6 karakter" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peran</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih peran pengguna" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ROLES.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isTransitionPending}>Batal</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isTransitionPending}>
                        {isTransitionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Simpan Pengguna
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Memuat Data</AlertTitle>
              <AlertDescription>
                {error.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </AlertDescription>
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
                {!loading && !error && users.map((user) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isTransitionPending}>
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
                            <AlertDialogCancel disabled={isTransitionPending}>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.full_name)}
                              disabled={isTransitionPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isTransitionPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          </div>
          {totalPages > 1 && !loading && !error && (
            <div className="flex justify-between items-center space-x-2 pt-4">
              <span className="text-sm text-muted-foreground">
                Total {totalCount} pengguna
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || isTransitionPending}
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
                  disabled={currentPage === totalPages || loading || isTransitionPending}
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

    