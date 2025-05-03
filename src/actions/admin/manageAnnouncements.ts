'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

// Define the schema for announcement data
const announcementSchema = z.object({
  title: z.string().min(3, { message: 'Judul minimal 3 karakter.' }),
  content: z.string().min(10, { message: 'Isi pengumuman minimal 10 karakter.' }),
  target_role: z.string().optional().nullable(),
  is_pinned: z.boolean().optional(),
});

export interface AnnouncementResult {
  success: boolean;
  message: string;
}

// Helper function to check admin role
async function verifyAdminRole(): Promise<{ isAdmin: boolean; error?: string; userId?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'Admin') {
    return { isAdmin: false, error: 'Akses ditolak: Hanya admin yang berwenang.' };
  }
  return { isAdmin: true, userId: user.id };
}

// --- Create Announcement Action ---
export async function createAnnouncement(
    _prevState: any, // Required for useFormState if used, otherwise can be ignored
    formData: z.infer<typeof announcementSchema>
): Promise<AnnouncementResult> {
    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin || !adminCheck.userId) return { success: false, message: adminCheck.error! };

    const validation = announcementSchema.safeParse(formData);
    if (!validation.success) {
        // Construct a user-friendly error message
        const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
                                  .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                                  .join('; ');
        return { success: false, message: `Validasi gagal: ${errorMessages}` };
    }

    const { title, content, target_role, is_pinned } = validation.data;

    try {
        const { error } = await supabaseAdmin
        .from('announcements')
        .insert({
            title,
            content,
            target_role,
            created_by: adminCheck.userId, // Set the creator ID
            is_pinned: is_pinned ?? false, // Default is_pinned to false if not provided
        });

        if (error) {
            console.error('Error creating announcement:', error);
            throw new Error(error.message || 'Gagal menambahkan pengumuman.');
        }

        revalidatePath('/announcements');
        revalidatePath('/admin/dashboard'); // Revalidate dashboard if needed
        return { success: true, message: 'Pengumuman berhasil ditambahkan.' };

    } catch (error: any) {
        console.error('Create announcement process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}


// --- Update Announcement Action ---
export async function updateAnnouncement(
    announcementId: string | undefined,
    formData: z.infer<typeof announcementSchema>
): Promise<AnnouncementResult> {
    if (!announcementId) return { success: false, message: 'ID Pengumuman tidak valid.' };

    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

    const validation = announcementSchema.safeParse(formData);
    if (!validation.success) {
       const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
                                 .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                                 .join('; ');
        return { success: false, message: `Validasi gagal: ${errorMessages}` };
    }

    const { title, content, target_role, is_pinned } = validation.data;

    try {
        const { error } await supabaseAdmin
        .from('announcements')
        .update({
            title,
            content,
            target_role,
            is_pinned: is_pinned ?? false, // Update is_pinned
            // updated_at is handled automatically by Supabase
        })
        .eq('id', announcementId);

        if (error) {
            console.error(`Error updating announcement ${announcementId}:`, error);
            throw new Error(error.message || 'Gagal memperbarui pengumuman.');
        }

        revalidatePath('/announcements');
         revalidatePath('/admin/dashboard');
        return { success: true, message: 'Pengumuman berhasil diperbarui.' };

    } catch (error: any) {
        console.error('Update announcement process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}


// --- Delete Announcement Action ---
export async function deleteAnnouncement(announcementId: string): Promise<AnnouncementResult> {
    if (!announcementId) return { success: false, message: 'ID Pengumuman tidak valid.' };

    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

    try {
        const { error } await supabaseAdmin
        .from('announcements')
        .delete()
        .eq('id', announcementId);

        if (error) {
            console.error(`Error deleting announcement ${announcementId}:`, error);
            throw new Error(error.message || 'Gagal menghapus pengumuman.');
        }

        revalidatePath('/announcements');
         revalidatePath('/admin/dashboard');
        return { success: true, message: 'Pengumuman berhasil dihapus.' };

    } catch (error: any) {
        console.error('Delete announcement process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}

// --- Pin/Unpin Announcement Action ---
export async function pinAnnouncement(announcementId: string, pinStatus: boolean): Promise<AnnouncementResult> {
   if (!announcementId) return { success: false, message: 'ID Pengumuman tidak valid.' };

   const adminCheck = await verifyAdminRole();
   if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

   try {
       const { error } await supabaseAdmin
       .from('announcements')
       .update({ is_pinned: pinStatus })
       .eq('id', announcementId);

       if (error) {
           console.error(`Error updating pin status for announcement ${announcementId}:`, error);
           throw new Error(error.message || 'Gagal mengubah status pin pengumuman.');
       }

       revalidatePath('/announcements');
        revalidatePath('/admin/dashboard');
       return { success: true, message: `Pengumuman berhasil ${pinStatus ? 'disematkan' : 'dilepas'}.` };

   } catch (error: any) {
       console.error('Pin/unpin announcement process failed:', error);
       return { success: false, message: error.message || 'Terjadi kesalahan server.' };
   }
}
