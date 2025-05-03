'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

// Define the schema for subject data (reuse from the client component or define separately)
const subjectSchema = z.object({
  subject_name: z.string().min(3),
  subject_code: z.string().min(2).regex(/^[A-Z0-9-]+$/),
  description: z.string().optional().nullable(),
});

interface ActionResult {
  success: boolean;
  message: string;
}

// Helper function to check admin role
async function verifyAdminRole(): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'Admin') {
    return { isAdmin: false, error: 'Akses ditolak: Hanya admin yang berwenang.' };
  }
  return { isAdmin: true };
}

// --- Create Subject Action ---
export async function createSubject(
    _prevState: any, // Required for useFormState if used, otherwise can be ignored
    formData: z.infer<typeof subjectSchema>
    ): Promise<ActionResult> {
    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

    // Validate incoming data
    const validation = subjectSchema.safeParse(formData);
    if (!validation.success) {
        return { success: false, message: `Validasi gagal: ${validation.error.flatten().fieldErrors}` };
    }

    const { subject_name, subject_code, description } = validation.data;

    try {
        // Use supabaseAdmin for insertion
        const { error } = await supabaseAdmin
        .from('subjects')
        .insert({
            subject_name,
            subject_code,
            description,
        });

        if (error) {
            console.error('Error creating subject:', error);
            // Handle potential unique constraint violation
            if (error.code === '23505') { // Unique violation code in PostgreSQL
                return { success: false, message: `Kode mata pelajaran "${subject_code}" sudah digunakan.` };
            }
            throw new Error(error.message || 'Gagal menambahkan mata pelajaran.');
        }

        revalidatePath('/admin/manage-subjects');
        return { success: true, message: 'Mata pelajaran berhasil ditambahkan.' };

    } catch (error: any) {
        console.error('Create subject process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}


// --- Update Subject Action ---
export async function updateSubject(
    subjectId: string | undefined, // Can be undefined if not editing
    formData: z.infer<typeof subjectSchema>
    ): Promise<ActionResult> {
    if (!subjectId) return { success: false, message: 'ID Mata Pelajaran tidak valid.' };

    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

    const validation = subjectSchema.safeParse(formData);
    if (!validation.success) {
        // Consider a more structured error message format if needed
        return { success: false, message: `Validasi gagal.` };
    }

    const { subject_name, subject_code, description } = validation.data;

    try {
        const { error } = await supabaseAdmin
        .from('subjects')
        .update({
            subject_name,
            subject_code,
            description,
            updated_at: new Date().toISOString(), // Update timestamp
        })
        .eq('id', subjectId);

        if (error) {
            console.error(`Error updating subject ${subjectId}:`, error);
             if (error.code === '23505') {
                return { success: false, message: `Kode mata pelajaran "${subject_code}" sudah digunakan.` };
            }
            throw new Error(error.message || 'Gagal memperbarui mata pelajaran.');
        }

        revalidatePath('/admin/manage-subjects');
        return { success: true, message: 'Mata pelajaran berhasil diperbarui.' };

    } catch (error: any) {
        console.error('Update subject process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}


// --- Delete Subject Action ---
export async function deleteSubject(subjectId: string): Promise<ActionResult> {
    if (!subjectId) return { success: false, message: 'ID Mata Pelajaran tidak valid.' };

    const adminCheck = await verifyAdminRole();
    if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

    try {
        // Check for related records before deleting (optional but good practice)
        // e.g., check if subject is used in schedules, assignments, etc.
        // If dependencies exist, return an error message preventing deletion.

        const { error } = await supabaseAdmin
        .from('subjects')
        .delete()
        .eq('id', subjectId);

        if (error) {
            console.error(`Error deleting subject ${subjectId}:`, error);
             // Handle potential foreign key constraints if not handled above
             if (error.code === '23503') { // Foreign key violation
                 return { success: false, message: 'Gagal menghapus: Mata pelajaran ini masih digunakan di jadwal, tugas, atau data lain.' };
             }
            throw new Error(error.message || 'Gagal menghapus mata pelajaran.');
        }

        revalidatePath('/admin/manage-subjects');
        return { success: true, message: 'Mata pelajaran berhasil dihapus.' };

    } catch (error: any) {
        console.error('Delete subject process failed:', error);
        return { success: false, message: error.message || 'Terjadi kesalahan server.' };
    }
}
