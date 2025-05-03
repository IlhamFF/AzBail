'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use browser client
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale'; // Import Indonesian locale
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement, pinAnnouncement } from '@/actions/admin/manageAnnouncements'; // Import server actions
import type { AnnouncementResult } from '@/actions/admin/manageAnnouncements';
import { Switch } from '@/components/ui/switch'; // Import Switch for pinning

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  target_role: string | null;
  created_by_name?: string;
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
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select(`
          id,
          title,
          content,
          created_at,
          is_pinned,
          target_role,
          user_details ( full_name )
        `)
        // Filter based on target_role only if user is not admin
        .or(isAdmin ? '' : `target_role.is.null,target_role.eq.${userRole}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedData = data?.map(ann => ({
        ...ann,
        created_by_name: (ann.user_details as any)?.full_name || 'Sistem',
      })) || [];

      setAnnouncements(formattedData);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError('Gagal memuat pengumuman. Pastikan Anda memiliki koneksi internet dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (user || !isAdmin)) { // Fetch if logged in OR if not admin (to see public ones)
      fetchAnnouncements();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Anda harus login untuk melihat pengumuman.");
    }
  }, [user, authLoading, isAdmin, userRole]); // Add isAdmin dependency

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
    // Reset form state
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
      const result: AnnouncementResult = await action(editingAnnouncement ? editingAnnouncement.id : undefined, formData);

      if (result.success) {
        toast({
          title: editingAnnouncement ? 'Update Berhasil' : 'Pengumuman Dibuat',
          description: result.message,
        });
        handleDialogClose();
        fetchAnnouncements(); // Refresh the list
      } else {
        toast({
          variant: 'destructive',
          title: editingAnnouncement ? 'Update Gagal' : 'Gagal Membuat Pengumuman',
          description: result.message,
        });
      }
    });
  };

  const handleDelete = (announcement: Announcement) => {
    if (!isAdmin) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(announcement.id);
      if (result.success) {
        toast({
          title: 'Hapus Berhasil',
          description: result.message,
        });
        fetchAnnouncements(); // Refresh the list
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
         fetchAnnouncements(); // Refresh the list
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Pengumuman</h1>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogOpen()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={handleDialogClose}>
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
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="target_role">Target Peran (Opsional)</Label>
                   <Select
                     value={formTargetRole || 'Semua'}
                     onValueChange={(value) => setFormTargetRole(value === 'Semua' ? null : value)}
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
                       <SelectItem value="Admin">Admin</SelectItem> {/* Include Admin if needed */}
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="flex items-center space-x-2">
                   <Switch
                     id="is_pinned"
                     checked={formIsPinned}
                     onCheckedChange={setFormIsPinned}
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

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && announcements.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Tidak ada pengumuman yang relevan untuk Anda saat ini.
          </CardContent>
        </Card>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className={`relative ${ann.is_pinned ? 'border-2 border-accent' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle>{ann.title}</CardTitle>
                  {ann.is_pinned && <Badge variant="default" className="bg-accent text-accent-foreground">Penting</Badge>}
                </div>
                <CardDescription>
                  Diposting oleh {ann.created_by_name} • {' '}
                  {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: id })}
                </CardDescription>
                {ann.target_role && (
                  <Badge variant="secondary" className="w-fit mt-1">Untuk: {ann.target_role}</Badge>
                )}
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {ann.content}
              </CardContent>
              {isAdmin && (
                <CardFooter className="flex justify-end gap-1 absolute bottom-2 right-2">
                  {/* Pin/Unpin Button */}
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePinToggle(ann)} disabled={isPending} title={ann.is_pinned ? 'Lepas Pin' : 'Sematkan'}>
                      {isPending && editingAnnouncement?.id === ann.id ? <Loader2 className="h-4 w-4 animate-spin"/> : ann.is_pinned ? <PinOff className="h-4 w-4"/> : <Pin className="h-4 w-4"/> }
                      <span className="sr-only">{ann.is_pinned ? 'Lepas Pin' : 'Sematkan'}</span>
                   </Button>
                  {/* Edit Button */}
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDialogOpen(ann)} disabled={isPending}>
                       <Edit className="h-4 w-4" />
                       <span className="sr-only">Edit</span>
                   </Button>
                  {/* Delete Button */}
                   <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={isPending}>
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
                               <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                               <AlertDialogAction
                                   onClick={() => handleDelete(ann)}
                                   disabled={isPending}
                                   className="bg-destructive hover:bg-destructive/90"
                               >
                                   {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
