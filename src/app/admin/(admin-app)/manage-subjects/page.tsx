'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle, BookOpen, Edit, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createSubject, updateSubject, deleteSubject } from '@/actions/admin/manageSubjects'; // Import server actions

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const subjectSchema = z.object({
  subject_name: z.string().min(3, { message: 'Nama mata pelajaran minimal 3 karakter.' }),
  subject_code: z.string().min(2, { message: 'Kode mata pelajaran minimal 2 karakter.' }).regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf kapital, angka, dan strip.'),
  description: z.string().optional().nullable(),
});

type SubjectFormData = z.infer<typeof subjectSchema>;

export default function ManageSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      subject_name: '',
      subject_code: '',
      description: '',
    },
  });

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('subjects')
        .select('*')
        .order('subject_name', { ascending: true });

      if (fetchError) throw fetchError;
      setSubjects(data || []);
    } catch (err: any) {
      setError('Gagal memuat data mata pelajaran.');
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDialogOpen = (subject: Subject | null = null) => {
    setEditingSubject(subject);
    if (subject) {
      form.reset({
        subject_name: subject.subject_name,
        subject_code: subject.subject_code,
        description: subject.description || '',
      });
    } else {
      form.reset({ subject_name: '', subject_code: '', description: '' }); // Reset for new subject
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    form.reset(); // Reset form on close
  };

  async function onSubmit(values: SubjectFormData) {
    startTransition(async () => {
      const action = editingSubject ? updateSubject : createSubject;
      const result = await action(editingSubject ? editingSubject.id : undefined, values);

      if (result.success) {
        toast({
          title: editingSubject ? 'Update Berhasil' : 'Tambah Berhasil',
          description: `Mata pelajaran "${values.subject_name}" berhasil ${editingSubject ? 'diperbarui' : 'ditambahkan'}.`,
        });
        handleDialogClose();
        fetchSubjects(); // Refresh the list
      } else {
        toast({
          variant: 'destructive',
          title: editingSubject ? 'Update Gagal' : 'Tambah Gagal',
          description: result.message,
        });
      }
    });
  }

  const handleDelete = (subject: Subject) => {
    startTransition(async () => {
      const result = await deleteSubject(subject.id);
      if (result.success) {
        toast({
          title: 'Hapus Berhasil',
          description: `Mata pelajaran "${subject.subject_name}" berhasil dihapus.`,
        });
        fetchSubjects(); // Refresh the list
      } else {
        toast({
          variant: 'destructive',
          title: 'Hapus Gagal',
          description: result.message,
        });
      }
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manajemen Mata Pelajaran</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button onClick={() => handleDialogOpen()}>
               <PlusCircle className="mr-2 h-4 w-4" /> Tambah Mata Pelajaran
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={handleDialogClose}> {/* Prevent closing on outside click */}
             <DialogHeader>
               <DialogTitle>{editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}</DialogTitle>
               <DialogDescription>
                 {editingSubject ? 'Ubah detail mata pelajaran.' : 'Masukkan detail untuk mata pelajaran baru.'}
               </DialogDescription>
             </DialogHeader>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="subject_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Mata Pelajaran</FormLabel>
                      <FormControl><Input placeholder="Contoh: Matematika Wajib" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="subject_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Mata Pelajaran</FormLabel>
                      <FormControl><Input placeholder="Contoh: MTK-W" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl><Textarea placeholder="Deskripsi singkat mata pelajaran..." {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <DialogFooter>
                     {/* Use DialogClose for Cancel button */}
                    <DialogClose asChild>
                       <Button type="button" variant="outline" disabled={isPending}>Batal</Button>
                    </DialogClose>
                   <Button type="submit" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {editingSubject ? 'Simpan Perubahan' : 'Simpan'}
                   </Button>
                 </DialogFooter>
              </form>
            </Form>
           </DialogContent>
         </Dialog>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
          <CardDescription>Kelola mata pelajaran yang diajarkan di sekolah.</CardDescription>
          {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
           {loading && (
              <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Kode</TableHead>
                        <TableHead>Nama Mata Pelajaran</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {[...Array(3)].map((_, i) => (
                       <TableRow key={i}>
                         <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                         <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                         <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                         <TableCell className="text-right space-x-2">
                           <Skeleton className="h-8 w-8 inline-block" />
                           <Skeleton className="h-8 w-8 inline-block" />
                         </TableCell>
                       </TableRow>
                     ))}
                  </TableBody>
               </Table>
           )}
           {error && <p className="text-destructive text-center">{error}</p>}
           {!loading && !error && subjects.length === 0 && (
             <p className="text-muted-foreground text-center py-4">Belum ada data mata pelajaran.</p>
           )}
           {!loading && !error && subjects.length > 0 && (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Kode</TableHead>
                   <TableHead>Nama Mata Pelajaran</TableHead>
                   <TableHead>Deskripsi</TableHead>
                   <TableHead className="text-right">Aksi</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {subjects.map((subject) => (
                   <TableRow key={subject.id}>
                     <TableCell className="font-medium">{subject.subject_code}</TableCell>
                     <TableCell>{subject.subject_name}</TableCell>
                     <TableCell className="text-sm text-muted-foreground">{subject.description || '-'}</TableCell>
                     <TableCell className="text-right space-x-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDialogOpen(subject)}>
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
                               Apakah Anda yakin ingin menghapus mata pelajaran <strong>{subject.subject_name} ({subject.subject_code})</strong>? Tindakan ini tidak dapat diurungkan.
                             </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                             <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                             <AlertDialogAction
                               onClick={() => handleDelete(subject)}
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
