
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
  // Supabase join structure:
  // user_details: { full_name: string }[] | { full_name: string } | null
  // To handle cases where user_details might be an array (if not unique join) or object
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
        query = query.is('target_role', null);
      }
      
      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching announcements:", fetchError);
        throw fetchError;
      }
      
      const formattedData = data?.map(ann => {
        let creatorName = 'Sistem';
        if (ann.user_details) {
          // Handle if user_details is an array (though with !inner and unique FK it should be an object)
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
  }, [user, authLoading, isAdmin, userRole]); // Re-fetch if user or role changes

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
      setFormTargetRole(null);
      setFormIsPinned(false);
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAnnouncement(null);
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
      target_role: formTargetRole,
      is_pinned: formIsPinned,
    };

    startTransition(async () => {
      const action = editingAnnouncement ? updateAnnouncement : createAnnouncement;
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
          description: result.message,
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
                     value={formTargetRole || 'Semua'}
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
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDialogOpen(ann)} disabled={isPending}>
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

    