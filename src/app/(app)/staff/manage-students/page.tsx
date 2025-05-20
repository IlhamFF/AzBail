
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2, AlertTriangle, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Student {
  id: string; // user_details.id
  user_id: string; // auth.users.id
  nis: string | null;
  full_name: string;
  class_name: string | null; 
  is_active: boolean; 
}

export default function StaffManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch students by joining user_details, users (auth.users), and classes
      // We select from 'user_details' and join other tables.
      // The role 'Siswa' is assumed to be stored in 'user_details.role' or in 'users.raw_user_meta_data->>"role"'
      // For this example, let's assume 'user_details' has a 'role' column. If not, the query needs adjustment.
      // Or, more robustly, filter by 'users.role' if that's where it's consistently stored.

      const { data, error: fetchError } = await supabase
        .from('user_details')
        .select(`
          id,
          user_id,
          nis,
          full_name,
          classes ( name ),
          users ( role, is_active ) 
        `)
        .eq('users.role', 'Siswa') // Filter by role from the joined users (auth.users) table
        .order('full_name', { ascending: true });

      if (fetchError) {
        console.error("Error fetching students:", fetchError);
        let detailedMessage = `Gagal mengambil data siswa: ${fetchError.message}`;
        if (fetchError.code === 'PGRST200' && fetchError.message.includes("relationship")) {
             detailedMessage += ` (Pastikan ada relasi (foreign key) yang benar antara 'user_details' dan 'users' (via user_details.user_id -> users.id), serta 'user_details' dan 'classes' (via user_details.class_id -> classes.id). Cek juga nama join di select query).`;
        }
        throw new Error(detailedMessage);
      }

      const formattedStudents = data?.map(s => {
        // Safely access nested properties
        const className = (s.classes as { name: string } | null)?.name || 'Belum ada kelas';
        const userRole = (s.users as { role: string } | null)?.role; // Not strictly needed if filtering by 'Siswa'
        // is_active might be directly on 'users' or within 'raw_user_meta_data'
        // Assuming 'is_active' is a direct column on 'users' table for simplicity, or that RLS handles this.
        // If 'is_active' is in metadata: (s.users as any)?.raw_user_meta_data?.is_active
        const isActive = (s.users as { is_active: boolean } | null)?.is_active === undefined ? true : (s.users as { is_active: boolean } | null)?.is_active;

        return {
          id: s.id,
          user_id: s.user_id,
          nis: s.nis,
          full_name: s.full_name,
          class_name: className,
          is_active: isActive,
        };
      }) || [];
      
      setStudents(formattedStudents);

    } catch (err: any) {
      console.error('Error processing students:', err);
      setError(err.message || 'Terjadi kesalahan server saat memuat data siswa.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Siswa',
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredStudents = students.filter(student =>
    (student.nis && student.nis.toLowerCase().includes(searchTerm)) ||
    student.full_name.toLowerCase().includes(searchTerm) ||
    (student.class_name && student.class_name.toLowerCase().includes(searchTerm))
  );

  const renderSkeletonRows = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
        <TableCell className="text-right space-x-1">
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Manajemen Data Siswa</h1>
        <div className="flex gap-2 flex-wrap">
           <div className="relative w-full sm:w-auto grow sm:grow-0">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                type="search"
                placeholder="Cari siswa (NIS/Nama/Kelas)..." 
                className="pl-8 w-full sm:w-[250px]"
                value={searchTerm}
                onChange={handleSearch}
               />
           </div>
            <Button disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Siswa
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>Kelola data induk siswa.</CardDescription>
        </CardHeader>
        <CardContent>
           {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Memuat Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIS</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? renderSkeletonRows() : 
                filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.nis || '-'}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.class_name}</TableCell>
                  <TableCell>
                     <Badge variant={student.is_active ? 'default' : 'destructive'}>
                       {student.is_active ? 'Aktif' : 'Non-Aktif'}
                     </Badge>
                   </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled>
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Hapus</span>
                     </Button>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        <div className="flex flex-col items-center justify-center">
                          <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                          {searchTerm ? "Tidak ada siswa yang cocok dengan pencarian Anda." : "Tidak ada data siswa."}
                        </div>
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
          {/* TODO: Add Pagination if many students */}
        </CardContent>
      </Card>
    </div>
  );
}
    