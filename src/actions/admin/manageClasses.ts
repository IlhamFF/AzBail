'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

// Define the schema for class data
const classSchema = z.object({
  name: z.string().min(3, { message: 'Nama kelas minimal 3 karakter.' }),
  homeroom_teacher_id: z.string().uuid({ message: 'ID Wali Kelas tidak valid.' }).optional().nullable(),
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

// --- Create Class Action ---
export async function createClass(
    _prevState: any, // Required for useFormState if used
    formData: z.infer<typeof classSchema>
): Promise<ActionResult> {
  const adminCheck = await verifyAdminRole();
  if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

  const validation = classSchema.safeParse(formData);
  if (!validation.success) {
    const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    return { success: false, message: `Validasi gagal: ${errorMessages}` };
  }

  const { name, homeroom_teacher_id } = validation.data;

  try {
    const { error } = await supabaseAdmin
      .from('classes')
      .insert({
        name,
        homeroom_teacher_id: homeroom_teacher_id || null, // Handle optional field
      });

    if (error) {
      console.error('Error creating class:', error);
       if (error.code === '23505') { // Unique violation for name? Add constraint if needed.
           return { success: false, message: `Nama kelas "${name}" sudah digunakan.` };
       }
      throw new Error(error.message || 'Gagal menambahkan kelas.');
    }

    revalidatePath('/admin/manage-classes');
    return { success: true, message: 'Kelas berhasil ditambahkan.' };

  } catch (error: any) {
    console.error('Create class process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server.' };
  }
}

// --- Update Class Action ---
export async function updateClass(
    classId: string | undefined,
    formData: z.infer<typeof classSchema>
): Promise<ActionResult> {
  if (!classId) return { success: false, message: 'ID Kelas tidak valid.' };

  const adminCheck = await verifyAdminRole();
  if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

  const validation = classSchema.safeParse(formData);
  if (!validation.success) {
    const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    return { success: false, message: `Validasi gagal: ${errorMessages}` };
  }

  const { name, homeroom_teacher_id } = validation.data;

  try {
    const { error } = await supabaseAdmin
      .from('classes')
      .update({
        name,
        homeroom_teacher_id: homeroom_teacher_id || null,
      })
      .eq('id', classId);

    if (error) {
      console.error(`Error updating class ${classId}:`, error);
       if (error.code === '23505') {
           return { success: false, message: `Nama kelas "${name}" sudah digunakan.` };
       }
      throw new Error(error.message || 'Gagal memperbarui kelas.');
    }

    revalidatePath('/admin/manage-classes');
    return { success: true, message: 'Kelas berhasil diperbarui.' };

  } catch (error: any) {
    console.error('Update class process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server.' };
  }
}

// --- Delete Class Action ---
export async function deleteClass(classId: string): Promise<ActionResult> {
  if (!classId) return { success: false, message: 'ID Kelas tidak valid.' };

  const adminCheck = await verifyAdminRole();
  if (!adminCheck.isAdmin) return { success: false, message: adminCheck.error! };

  try {
    // Check for related records (e.g., students assigned to this class) before deleting
    // const { count: studentCount, error: studentError } = await supabaseAdmin
    //   .from('user_details') // Assuming student class is stored here
    //   .select('id', { count: 'exact', head: true })
    //   .eq('class_id', classId);
    //
    // if (studentError) throw new Error('Gagal memeriksa siswa terkait.');
    // if (studentCount && studentCount > 0) {
    //   return { success: false, message: `Gagal menghapus: Masih ada ${studentCount} siswa di kelas ini.` };
    // }
    // Add similar checks for schedules, assignments, etc.

    const { error } = await supabaseAdmin
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) {
      console.error(`Error deleting class ${classId}:`, error);
       if (error.code === '23503') { // Foreign key violation
            return { success: false, message: 'Gagal menghapus: Kelas ini masih digunakan di jadwal, tugas, atau data lain.' };
       }
      throw new Error(error.message || 'Gagal menghapus kelas.');
    }

    revalidatePath('/admin/manage-classes');
    return { success: true, message: 'Kelas berhasil dihapus.' };

  } catch (error: any) {
    console.error('Delete class process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server.' };
  }
}
