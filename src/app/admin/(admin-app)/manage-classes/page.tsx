'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, PlusCircle, Edit, Trash2, Users, User, AlertTriangle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createClass, updateClass, deleteClass } from '@/actions/admin/manageClasses'; // Import server actions

interface Class {
  id: string;
  name: string;
  homeroom_teacher_id: string | null;
  homeroom_teacher_name?: string; // Optional, populated after join
  student_count?: number; // Optional, populated after join/count
  user_details?: { full_name: string } | null; // Structure from join
}

interface Teacher {
    id: string;
    full_name: string;
}

const classSchema = z.object({
  name: z.string().min(3, { message: 'Nama kelas minimal 3 karakter.' }),
  homeroom_teacher_id: z.string().uuid({ message: 'ID Wali Kelas tidak valid.' }).optional().nullable(),
});

type ClassFormData = z.infer<typeof classSchema>;

export default function ManageClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const { toast } = useToast();

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      homeroom_teacher_id: null,
    },
  });

   const fetchTeachers = async () => {
        try {
             // Fetch users with the 'Guru' role from the auth.users table
             // and join with user_details to get their full names
            const { data, error: fetchError } = await supabase
                .from('users') // Query the auth.users table
                .select(`
                    id,
                    user_details ( user_id, full_name )
                `)
                .eq('role', 'Guru'); // Filter by role in the users table

            if (fetchError) throw fetchError;

            // Map to the expected Teacher interface structure
            // Filter out teachers who might not have details yet
            const validTeachers = data
                ?.filter(t => t.user_details) // Ensure user_details is not null
                .map(t => ({
                    id: t.id, // Use the id from auth.users
                    full_name: (t.user_details as any)?.full_name || 'Nama Guru Tidak Tersedia' // Access nested name
                 })) || [];

            setTeachers(validTeachers);
        } catch (err: any) {
             console.error('Error fetching teachers:', err);
             toast({ variant: 'destructive', title: 'Error', description: 'Gagal memuat daftar guru.' });
        }
    };


  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
       // Fetch classes and join with user_details via homeroom_teacher_id
        const { data, error: fetchError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          homeroom_teacher_id,
          user_details ( user_id, full_name )
        `)
        // Optionally fetch student count per class (more complex query or separate queries)
        .order('name', { ascending: true });


      if (fetchError) throw fetchError;

        // Adjust mapping based on the direct join from classes to user_details
       const formattedData: Class[] = data?.map(cls => ({
           id: cls.id,
           name: cls.name,
           homeroom_teacher_id: cls.homeroom_teacher_id,
           // The join brings user_details directly if homeroom_teacher_id matches a user_id
           homeroom_teacher_name: (cls.user_details as any)?.full_name || '-',
       })) || [];


      setClasses(formattedData);
    } catch (err: any) {
      setError('Gagal memuat data kelas.');
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers(); // Fetch teachers for the select dropdown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDialogOpen = (cls: Class | null = null) => {
    setEditingClass(cls);
    if (cls) {
      form.reset({
        name: cls.name,
        homeroom_teacher_id: cls.homeroom_teacher_id,
      });
    } else {
      form.reset({ name: '', homeroom_teacher_id: null }); // Reset for new class
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    form.reset(); // Reset form on close
  };

  async function onSubmit(values: ClassFormData) {
    startTransition(async () => {
      const action = editingClass ? updateClass : createClass;
      // If homeroom_teacher_id is "null", pass actual null to the action
      const payload = {
        ...values,
        homeroom_teacher_id: values.homeroom_teacher_id === "null" ? null : values.homeroom_teacher_id,
      };
      const result = await action(editingClass ? editingClass.id : undefined, payload);


      if (result.success) {
        toast({
          title: editingClass ? 'Update Berhasil' : 'Tambah Berhasil',
          description: `Kelas "${values.name}" berhasil ${editingClass ? 'diperbarui' : 'ditambahkan'}.`,
        });
        handleDialogClose();
        fetchClasses(); // Refresh the list
      } else {
        toast({
          variant: 'destructive',
          title: editingClass ? 'Update Gagal' : 'Tambah Gagal',
          description: result.message,
        });
      }
    });
  }

  const handleDelete = (cls: Class) => {
    startTransition(async () => {
      const result = await deleteClass(cls.id);
      if (result.success) {
        toast({
          title: 'Hapus Berhasil',
          description: `Kelas "${cls.name}" berhasil dihapus.`,
        });
        fetchClasses(); // Refresh the list
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
        <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogTrigger asChild>
             <Button onClick={() => handleDialogOpen()}>
               <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kelas Baru
             </Button>
           </DialogTrigger>
           <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={handleDialogClose}>
             <DialogHeader>
               <DialogTitle>{editingClass ? 'Edit Kelas' : 'Tambah Kelas Baru'}</DialogTitle>
               <DialogDescription>
                 {editingClass ? 'Ubah detail kelas.' : 'Masukkan detail untuk kelas baru.'}
               </DialogDescription>
             </DialogHeader>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kelas</FormLabel>
                      <FormControl><Input placeholder="Contoh: Kelas 10A" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="homeroom_teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wali Kelas (Opsional)</FormLabel>
                      <Select
                         onValueChange={field.onChange}
                         // Use "null" string for the "Tidak Ada" option
                         value={field.value ?? "null"}
                       >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Wali Kelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="null">-- Tidak Ada --</SelectItem>
                           {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                          {teachers.length === 0 && <div className="p-2 text-muted-foreground text-sm">Belum ada data guru.</div>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <DialogFooter>
                    <DialogClose asChild>
                       <Button type="button" variant="outline" disabled={isPending}>Batal</Button>
                    </DialogClose>
                   <Button type="submit" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {editingClass ? 'Simpan Perubahan' : 'Simpan'}
                   </Button>
                 </DialogFooter>
              </form>
            </Form>
           </DialogContent>
         </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>Kelola kelas, wali kelas, dan siswa di setiap kelas.</CardDescription>
          {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
           {error && <p className="text-destructive text-center">{error}</p>}
           {!loading && !error && classes.length === 0 && (
             <p className="text-muted-foreground text-center py-4">Belum ada data kelas.</p>
           )}
           {!loading && !error && classes.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {classes.map((cls) => (
                 <Card key={cls.id}>
                   <CardHeader>
                     <CardTitle>{cls.name}</CardTitle>
                     <CardDescription className="flex items-center gap-1 pt-1">
                       <User className="h-4 w-4" /> Wali Kelas: {cls.homeroom_teacher_name}
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="flex justify-between items-center">
                      {/* Display student count if available */}
                      {cls.student_count !== undefined && (
                         <div className="flex items-center gap-1 text-sm text-muted-foreground">
                           <Users className="h-4 w-4" /> {cls.student_count} Siswa
                         </div>
                      )}
                      {cls.student_count === undefined && (
                         <div className="text-sm text-muted-foreground italic">...</div>
                      )}
                     <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDialogOpen(cls)} disabled={isPending}>
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
                                    <AlertTriangle className="text-destructive" /> Konfirmasi Hapus
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus kelas <strong>{cls.name}</strong>? Tindakan ini tidak dapat diurungkan dan dapat mempengaruhi data siswa, jadwal, dan nilai terkait.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => handleDelete(cls)}
                                    disabled={isPending}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Hapus
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
          {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Modal/Dialog for assigning students to a class could be added here */}
    </div>
  );
}
