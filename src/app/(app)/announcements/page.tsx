
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client'; 
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PlusCircle, Edit, Trash2, Pin, PinOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, pinAnnouncement } from '@/actions/admin/manageAnnouncements'; 
import type { AnnouncementResult } from '@/actions/admin/manageAnnouncements';
import { Switch } from '@/components/ui/switch'; 

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  target_role: string | null;
  created_by_name?: string; 
  user_details?: { full_name: string } | { full_name: string }[] | null;
}

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const { toast } = useToast();
  const userRole = user?.user_metadata?.role;
  const isAdmin = userRole === 'Admin';

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTargetRole, setFormTargetRole] = useState<string | null>(null);
  const [formIsPinned, setFormIsPinned] = useState(false);

  /**
   * Penjelasan Mekanisme Fetch Data untuk Fitur Pengumuman (Contoh untuk Fitur Siswa)
   * 
   * Fungsi `fetchAnnouncements` bertanggung jawab untuk mengambil data pengumuman dari database Supabase.
   * Berikut adalah langkah-langkah utama dalam proses fetching data:
   * 
   * 1. Inisialisasi State:
   *    - `setLoading(true)`: Menandakan bahwa proses pengambilan data sedang berlangsung. Ini biasanya digunakan untuk menampilkan UI loading (misalnya, skeleton).
   *    - `setError(null)`: Mengatur ulang state error sebelum melakukan fetch baru.
   * 
   * 2. Membuat Query ke Supabase:
   *    - `supabase.from('announcements')`: Memulai query dari tabel 'announcements' di database Supabase.
   *    - `.select(...)`: Menentukan kolom-kolom yang ingin diambil.
   *      - `id, title, content, created_at, is_pinned, target_role`: Kolom-kolom dasar dari tabel 'announcements'.
   *      - `user_details!inner ( full_name )`: Ini adalah contoh join (relasi) dengan tabel 'user_details'.
   *        - `!inner`: Menandakan inner join. Hanya pengumuman yang memiliki relasi dengan `user_details` (yaitu, `created_by` valid) yang akan diambil.
   *        - `( full_name )`: Mengambil kolom `full_name` dari tabel `user_details`. Ini berguna untuk menampilkan nama pembuat pengumuman.
   *    - `.order('is_pinned', { ascending: false })`: Mengurutkan hasil berdasarkan kolom `is_pinned` secara descending (pengumuman yang dipin akan tampil di atas).
   *    - `.order('created_at', { ascending: false })`: Mengurutkan hasil lebih lanjut berdasarkan kolom `created_at` secara descending (pengumuman terbaru akan tampil di atas).
   * 
   * 3. Filter Berdasarkan Peran Pengguna (Role-Based Filtering):
   *    - Logic ini memastikan bahwa pengguna hanya melihat pengumuman yang relevan dengan perannya.
   *    - `if (!isAdmin && userRole)`: Jika pengguna bukan admin dan memiliki peran (userRole terdefinisi).
   *      - `query = query.or(...)`: Menggunakan klausa `or` untuk mengambil pengumuman yang:
   *        - `target_role.is.null`: Pengumuman yang `target_role`-nya NULL (ditujukan untuk semua peran).
   *        - `target_role.eq.${userRole}`: Pengumuman yang `target_role`-nya sama dengan peran pengguna saat ini.
   *    - `else if (!isAdmin && !userRole)`: Jika pengguna bukan admin dan tidak memiliki peran (misalnya, pengguna anonim jika diizinkan).
   *      - `query = query.is('target_role', null)`: Hanya mengambil pengumuman yang ditujukan untuk semua peran.
   *    - Jika pengguna adalah admin, tidak ada filter peran tambahan yang diterapkan, sehingga admin dapat melihat semua pengumuman.
   * 
   * 4. Eksekusi Query dan Penanganan Hasil:
   *    - `const { data, error: fetchError } = await query;`: Mengeksekusi query ke Supabase. Hasilnya adalah objek yang berisi `data` (array pengumuman) dan `error` (jika ada kesalahan).
   *    - `if (fetchError)`: Jika terjadi kesalahan saat fetch, error tersebut akan ditangkap dan ditampilkan.
   * 
   * 5. Pemformatan Data (Formatting Data):
   *    - `const formattedData = data?.map(...) || [];`: Jika data berhasil diambil (`data` tidak null), data tersebut diproses untuk memformat nama pembuat pengumuman.
   *      - `user_details`: Karena adanya join, `user_details` bisa berupa objek tunggal atau array (tergantung konfigurasi join). Kode ini menangani kedua kasus tersebut untuk mendapatkan `full_name`.
   *      - Jika `user_details` tidak ada, nama pembuat diatur sebagai "Sistem".
   * 
   * 6. Mengatur State Aplikasi:
   *    - `setAnnouncements(formattedData)`: Menyimpan data pengumuman yang sudah diformat ke dalam state `announcements`, yang kemudian akan dirender oleh komponen.
   * 
   * 7. Penanganan Kesalahan (Error Handling):
   *    - `catch (err: any)`: Menangkap kesalahan umum yang mungkin terjadi selama proses (misalnya, kesalahan jaringan).
   *    - `setError(...)`: Mengatur state error dengan pesan yang informatif.
   *    - `toast(...)`: Menampilkan notifikasi error kepada pengguna.
   * 
   * 8. Mengatur State Loading Selesai:
   *    - `finally { setLoading(false); }`: Menandakan bahwa proses pengambilan data telah selesai, baik berhasil maupun gagal.
   * 
   * Cara Kerja Umum Fetching Data di Proyek Ini:
   * - Sebagian besar pengambilan data dari Supabase dilakukan secara client-side menggunakan Supabase JS Client (`@supabase/supabase-js`).
   * - Fungsi `useEffect` digunakan untuk memicu pengambilan data saat komponen pertama kali dimuat atau ketika dependensi tertentu (seperti `user` atau `userRole`) berubah.
   * - State (seperti `loading`, `error`, dan data itu sendiri) digunakan untuk mengelola siklus hidup pengambilan data dan merender UI yang sesuai.
   * - Untuk operasi yang memerlukan otorisasi lebih tinggi atau modifikasi data (Create, Update, Delete), Next.js Server Actions digunakan (`src/actions/...`). Server Actions ini berjalan di server dan dapat menggunakan Supabase Admin Client untuk keamanan yang lebih baik.
   */
  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          is_pinned,
          target_role,
          user_details!inner ( full_name ) 
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (!isAdmin && userRole) {
        query = query.or(`target_role.is.null,target_role.eq.${userRole}`);
      } else if (!isAdmin && !userRole) {
        // Hanya tampilkan pengumuman yang target_role nya null jika pengguna tidak login / tidak punya role
        query = query.is('target_role', null);
      }
      // Admin melihat semua pengumuman, jadi tidak ada filter tambahan untuk admin
      
      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching announcements:", fetchError);
        throw fetchError;
      }
      
      const formattedData = data?.map(ann => {
        let creatorName = 'Sistem'; // Default jika user_details tidak ada
        if (ann.user_details) {
          // user_details akan menjadi objek karena !inner join pada foreign key yang unik (created_by)
          // Namun, untuk kehati-hatian, kita tetap bisa mengecek jika itu array.
          creatorName = Array.isArray(ann.user_details) 
                        ? (ann.user_details[0]?.full_name || 'Sistem') 
                        : (ann.user_details.full_name || 'Sistem');
        }
        return {
          ...ann,
          created_by_name: creatorName,
        };
      }) || [];
      
      setAnnouncements(formattedData);
    } catch (err: any) {
      console.error('Error processing announcements:', err);
      setError('Gagal memuat pengumuman. Pastikan Anda memiliki koneksi internet dan coba lagi.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Pengumuman',
        description: err.message || 'Terjadi kesalahan saat mengambil data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) { 
      fetchAnnouncements();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, isAdmin, userRole]);

  const handleDialogOpen = (announcement: Announcement | null = null) => {
    setEditingAnnouncement(announcement);
    if (announcement) {
      setFormTitle(announcement.title);
      setFormContent(announcement.content);
      setFormTargetRole(announcement.target_role);
      setFormIsPinned(announcement.is_pinned);
    } else {
      setFormTitle('');
      setFormContent('');
      setFormTargetRole(null); // Default ke null (Semua Peran)
      setFormIsPinned(false);
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
    // Reset form fields
    setFormTitle('');
    setFormContent('');
    setFormTargetRole(null);
    setFormIsPinned(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const formData = {
      title: formTitle,
      content: formContent,
      target_role: formTargetRole, // Ini akan null jika 'Semua Peran' dipilih
      is_pinned: formIsPinned,
    };

    startTransition(async () => {
      const action = editingAnnouncement ? updateAnnouncement : createAnnouncement;
      // Untuk createAnnouncement, ID tidak diperlukan, jadi kita kondisikan
      const result: AnnouncementResult = await action(
        editingAnnouncement ? editingAnnouncement.id : (action === createAnnouncement ? undefined : editingAnnouncement?.id), 
        formData
      );

      if (result.success) {
        toast({
          title: editingAnnouncement ? 'Update Berhasil' : 'Pengumuman Dibuat',
          description: result.message,
        });
        handleDialogClose();
        fetchAnnouncements(); 
      } else {
        toast({
          variant: 'destructive',
          title: editingAnnouncement ? 'Update Gagal' : 'Gagal Membuat Pengumuman',
          description: result.message,
        });
      }
    });
  };

  const handleDelete = (announcementId: string, announcementTitle: string) => {
    if (!isAdmin) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(announcementId);
      if (result.success) {
        toast({
          title: 'Hapus Berhasil',
          description: `Pengumuman "${announcementTitle}" telah dihapus.`,
        });
        fetchAnnouncements(); 
      } else {
        toast({
          variant: 'destructive',
          title: 'Hapus Gagal',
          description: result.message,
        });
      }
    });
  };

  const handlePinToggle = (announcement: Announcement) => {
     if (!isAdmin) return;
     // Simpan ID pengumuman yang sedang diproses untuk loader
     setEditingAnnouncement(announcement); 
     startTransition(async () => {
       const result = await pinAnnouncement(announcement.id, !announcement.is_pinned);
       if (result.success) {
         toast({
           title: `Pengumuman ${!announcement.is_pinned ? 'Dipin' : 'Dilepas'}`,
           description: result.message,
         });
         fetchAnnouncements(); 
       } else {
         toast({
           variant: 'destructive',
           title: 'Gagal Mengubah Pin',
           description: result.message,
         });
       }
       setEditingAnnouncement(null); // Reset setelah selesai
     });
   };


  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Pengumuman</h1>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) handleDialogClose(); 
            else setIsDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogOpen()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => {
                // Mencegah dialog ditutup saat proses submit sedang berjalan
                if (isPending) e.preventDefault(); 
            }} onCloseAutoFocus={handleDialogClose}>
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}</DialogTitle>
                <DialogDescription>
                  {editingAnnouncement ? 'Ubah detail pengumuman.' : 'Isi detail pengumuman baru.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Judul pengumuman"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Isi Pengumuman</Label>
                  <Textarea
                    id="content"
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Isi pengumuman..."
                    required
                    rows={5}
                    disabled={isPending}
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="target_role">Target Peran (Opsional)</Label>
                   <Select
                     value={formTargetRole || 'Semua'} // Jika null, tampilkan 'Semua'
                     onValueChange={(value) => setFormTargetRole(value === 'Semua' ? null : value)}
                     disabled={isPending}
                   >
                     <SelectTrigger id="target_role">
                       <SelectValue placeholder="Pilih target peran" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Semua">Semua Peran</SelectItem>
                       <SelectItem value="Guru">Guru</SelectItem>
                       <SelectItem value="Siswa">Siswa</SelectItem>
                       <SelectItem value="Tata Usaha">Tata Usaha</SelectItem>
                       <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
                       <SelectItem value="Admin">Admin</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Switch
                     id="is_pinned"
                     checked={formIsPinned}
                     onCheckedChange={setFormIsPinned}
                     disabled={isPending}
                   />
                   <Label htmlFor="is_pinned">Sematkan (Pin) Pengumuman</Label>
                 </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isPending}>Batal</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingAnnouncement ? 'Simpan Perubahan' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && announcements.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Tidak ada pengumuman yang tersedia saat ini.
          </CardContent>
        </Card>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className={`relative shadow-md hover:shadow-lg transition-shadow duration-200 ${ann.is_pinned ? 'border-2 border-accent' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg">{ann.title}</CardTitle>
                  {ann.is_pinned && <Badge variant="default" className="bg-accent text-accent-foreground shrink-0">Penting</Badge>}
                </div>
                <CardDescription className="text-xs">
                  Diposting oleh {ann.created_by_name} • {' '}
                  {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: id })}
                </CardDescription>
                {ann.target_role && (
                  <Badge variant="secondary" className="w-fit mt-1 text-xs">Untuk: {ann.target_role}</Badge>
                )}
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {ann.content}
              </CardContent>
              {isAdmin && (
                <CardFooter className="flex justify-end gap-1 pt-2 pb-2 pr-2">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePinToggle(ann)} disabled={isPending && editingAnnouncement?.id === ann.id} title={ann.is_pinned ? 'Lepas Pin' : 'Sematkan'}>
                      {(isPending && editingAnnouncement?.id === ann.id && editingAnnouncement?.is_pinned !== ann.is_pinned) ? <Loader2 className="h-4 w-4 animate-spin"/> : ann.is_pinned ? <PinOff className="h-4 w-4 text-accent"/> : <Pin className="h-4 w-4"/> }
                      <span className="sr-only">{ann.is_pinned ? 'Lepas Pin' : 'Sematkan'}</span>
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDialogOpen(ann)} disabled={isPending && editingAnnouncement?.id === ann.id}>
                       <Edit className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                   </Button>
                   <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isPending && editingAnnouncement?.id === ann.id }>
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Hapus</span>
                           </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                           <AlertDialogHeader>
                               <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                               <AlertDialogDescription>
                                   Apakah Anda yakin ingin menghapus pengumuman "{ann.title}"? Tindakan ini tidak dapat diurungkan.
                               </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                               <AlertDialogCancel disabled={isPending && editingAnnouncement?.id === ann.id}>Batal</AlertDialogCancel>
                               <AlertDialogAction
                                   onClick={() => handleDelete(ann.id, ann.title)}
                                   disabled={isPending && editingAnnouncement?.id === ann.id}
                                   className="bg-destructive hover:bg-destructive/90"
                               >
                                   {(isPending && editingAnnouncement?.id === ann.id && !editingAnnouncement?.is_pinned) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                   Hapus
                               </AlertDialogAction>
                           </AlertDialogFooter>
                       </AlertDialogContent>
                   </AlertDialog>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    