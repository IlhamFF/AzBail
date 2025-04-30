'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client'; // Use browser client
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Helper functions (assuming these exist or are adapted)
const getUserRole = (user: any): string | null => user?.user_metadata?.role || null;
const getUserFullName = (user: any): string => user?.user_metadata?.full_name || user?.email || 'Pengguna';
const getUserAvatarUrl = (user: any): string | undefined => user?.user_metadata?.avatar_url;

// Define the form schema for profile update
const profileSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(), // Store as string YYYY-MM-DD for input type="date"
  bio: z.string().optional().nullable(),
  // NIS/NIP are typically not editable by the user directly, managed by admin/staff
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [profileData, setProfileData] = useState<any>(null); // Store fetched profile details
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

   const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      birthDate: '',
      bio: '',
    },
  });

  useEffect(() => {
    const fetchProfileDetails = async () => {
      if (user) {
        setLoadingProfile(true);
        try {
          // Fetch from user_details table based on user_id using browser client
          const { data, error } = await supabase
            .from('user_details')
            .select('*')
            .eq('user_id', user.id)
            .single(); // Assuming one detail record per user

          if (error && error.code !== 'PGRST116') { // PGRST116: row not found is ok
            throw error;
          }

          if (data) {
             setProfileData(data);
             // Pre-fill form with fetched data
             form.reset({
               fullName: data.full_name || getUserFullName(user), // Fallback to metadata name
               phone: data.phone || '',
               address: data.address || '',
               birthDate: data.birth_date || '',
               bio: data.bio || '',
             });
          } else {
             // If no details found, pre-fill with metadata
             form.reset({
                fullName: getUserFullName(user),
                phone: '', address: '', birthDate: '', bio: '',
             });
             setProfileData({}); // Set empty object to indicate no details but fetch completed
          }

        } catch (error: any) {
          console.error('Error fetching profile details:', error);
          toast({
            variant: 'destructive',
            title: 'Gagal Memuat Detail Profil',
            description: error.message,
          });
           // Pre-fill with metadata as fallback
           form.reset({ fullName: getUserFullName(user) });
           setProfileData({});
        } finally {
          setLoadingProfile(false);
        }
      } else {
         setLoadingProfile(false); // No user, no profile to load
      }
    };

    if (!authLoading) {
       fetchProfileDetails();
    }

  }, [user, authLoading, toast, form]);


   async function onSubmit(values: ProfileFormData) {
     if (!user) return;
     setIsUpdating(true);

     try {
       // 1. Update user_metadata in Supabase Auth (only full_name and potentially avatar_url) using browser client
       const { data: updatedUser, error: userMetadataError } = await supabase.auth.updateUser({
         data: {
           full_name: values.fullName,
           // Add avatar_url update logic if you implement avatar uploads
         }
       });

       if (userMetadataError) throw userMetadataError;

       // 2. Upsert (update or insert) into user_details table using browser client
       const { error: detailsError } = await supabase
         .from('user_details')
         .upsert({
           user_id: user.id, // Make sure user_id is the primary key or unique constraint
           full_name: values.fullName,
           phone: values.phone || null,
           address: values.address || null,
           birth_date: values.birthDate || null,
           bio: values.bio || null,
           // update existing id if present, otherwise let db generate/handle it
           id: profileData?.id, // Pass existing id if updating
         }, { onConflict: 'user_id' }); // Adjust conflict resolution as needed

       if (detailsError) throw detailsError;


       toast({
         title: 'Profil Berhasil Diperbarui',
       });
       setIsEditing(false);
       // Refresh profile data state (optional, depends if UI updates automatically)
       setProfileData((prev: any) => ({ ...prev, ...values, full_name: values.fullName })); // Update local state optimistically


     } catch (error: any) {
       console.error('Error updating profile:', error);
       toast({
         variant: 'destructive',
         title: 'Gagal Memperbarui Profil',
         description: error.message,
       });
     } finally {
       setIsUpdating(false);
     }
   }


  if (authLoading || loadingProfile) {
    return (
       <Card className="w-full max-w-2xl mx-auto mt-10">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                 <Skeleton className="h-4 w-48" />
                 <Skeleton className="h-4 w-32" />
              </div>
           </div>
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-20 w-full" />
        </CardContent>
         <CardFooter className="flex justify-end">
            <Skeleton className="h-10 w-24" />
         </CardFooter>
      </Card>
    );
  }

  if (!user) {
    return <Card><CardContent>User tidak ditemukan.</CardContent></Card>;
  }

  const userRole = getUserRole(user);
  const userAvatar = getUserAvatarUrl(user);
  // Use form.getValues() for display when not editing, or profileData for static fields
  const displayData = isEditing ? form.getValues() : {
     ...form.getValues(), // Base values
     // Override with potentially non-editable or derived data for display only
     email: user.email,
     role: userRole,
     nis: profileData?.nis, // Example: Display NIS/NIP if exists
     nip: profileData?.nip,
     joinDate: profileData?.join_date ? new Date(profileData.join_date).toLocaleDateString('id-ID') : '-', // Format date
  };


  return (
    <Card className="w-full max-w-2xl mx-auto mt-6 mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Profil Pengguna</CardTitle>
        <CardDescription>Lihat dan perbarui informasi profil Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userAvatar} alt={displayData.fullName} />
            <AvatarFallback>{displayData.fullName?.charAt(0).toUpperCase() || 'P'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{displayData.fullName}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {userRole && <p className="text-sm text-muted-foreground">Peran: {userRole}</p>}
             {displayData.nis && <p className="text-sm text-muted-foreground">NIS: {displayData.nis}</p>}
             {displayData.nip && <p className="text-sm text-muted-foreground">NIP: {displayData.nip}</p>}
          </div>
        </div>

        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telepon</FormLabel>
                    <FormControl><Input type="tel" placeholder="Nomor telepon" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Lahir</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl><Textarea placeholder="Alamat lengkap" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio Singkat</FormLabel>
                    <FormControl><Textarea placeholder="Tentang Anda..." {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex justify-end gap-2 pt-4">
                 <Button type="button" variant="outline" onClick={() => {
                    setIsEditing(false);
                    // Reset form to original fetched data when cancelling
                     form.reset({
                        fullName: profileData?.full_name || getUserFullName(user),
                        phone: profileData?.phone || '',
                        address: profileData?.address || '',
                        birthDate: profileData?.birth_date || '',
                        bio: profileData?.bio || '',
                     });
                 }} disabled={isUpdating}>
                   Batal
                 </Button>
                 <Button type="submit" disabled={isUpdating}>
                    {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Simpan Perubahan
                 </Button>
               </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div><Label>Nama Lengkap</Label><p>{displayData.fullName}</p></div>
            <div><Label>Email</Label><p>{user.email}</p></div>
            {userRole && <div><Label>Peran</Label><p>{userRole}</p></div>}
            {displayData.nis && <div><Label>NIS</Label><p>{displayData.nis}</p></div>}
            {displayData.nip && <div><Label>NIP</Label><p>{displayData.nip}</p></div>}
            <div><Label>Telepon</Label><p>{displayData.phone || '-'}</p></div>
             <div><Label>Tanggal Lahir</Label><p>{displayData.birthDate ? new Date(displayData.birthDate + 'T00:00:00').toLocaleDateString('id-ID') : '-'}</p></div>
             <div><Label>Alamat</Label><p className="whitespace-pre-wrap">{displayData.address || '-'}</p></div>
             <div><Label>Bio</Label><p className="whitespace-pre-wrap">{displayData.bio || '-'}</p></div>
             <div><Label>Tanggal Bergabung</Label><p>{displayData.joinDate}</p></div>
          </div>
        )}
      </CardContent>
       {!isEditing && (
         <CardFooter className="flex justify-end pt-6">
           <Button onClick={() => setIsEditing(true)}>Edit Profil</Button>
         </CardFooter>
       )}
    </Card>
  );
}
