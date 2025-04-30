'use server';

import { supabaseAdmin } from '@/lib/supabase/admin'; // Use the admin client
import { createSupabaseServerClient } from '@/lib/supabase/server'; // To check admin role
import { revalidatePath } from 'next/cache';

export interface VerifyUserResult {
  success: boolean;
  message: string;
}

export async function verifyUser(userId: string): Promise<VerifyUserResult> {
  // 1. Verify the current user is an Admin using the server client
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'Admin') {
    return { success: false, message: 'Akses ditolak: Hanya admin yang dapat memverifikasi pengguna.' };
  }

  // 2. Use the admin client to update the target user's verification status
  try {
    console.log(`Admin ${user.id} attempting to verify user ${userId}`);

    // Option 1: Update the custom `is_verified` column in the `users` table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_verified: true, updated_at: new Date().toISOString() }) // Also update updated_at
      .eq('id', userId)
      .select() // Important: select() helps to check if the row was actually updated
      .single(); // Expecting only one user

    if (updateError) {
        console.error(`Error updating user ${userId} verification status:`, updateError);
        if (updateError.code === 'PGRST116') { // Row not found
           return { success: false, message: `Pengguna dengan ID ${userId} tidak ditemukan.` };
        }
      throw new Error(updateError.message || 'Gagal memperbarui status verifikasi pengguna.');
    }

    // Option 2 (Alternative): Update user_metadata in Auth (less common for verification flags)
    // const { data: updatedUserData, error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
    //   userId,
    //   { user_metadata: { is_verified: true } }
    // );
    // if (metadataError) {
    //    console.error(`Error updating user ${userId} metadata:`, metadataError);
    //   throw new Error(metadataError.message || 'Gagal memperbarui metadata pengguna.');
    // }

    console.log(`User ${userId} successfully verified by admin ${user.id}`);

    // Revalidate the path to refresh the user list on the admin page
    revalidatePath('/admin/verify-users');

    return { success: true, message: 'Pengguna berhasil diverifikasi.' };

  } catch (error: any) {
    console.error('Verification process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server.' };
  }
}
