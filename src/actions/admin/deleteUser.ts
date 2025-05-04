'use server';

import { supabaseAdmin } from '@/lib/supabase/admin'; // Use the admin client
import { createSupabaseServerClient } from '@/lib/supabase/server'; // To check admin role
import { revalidatePath } from 'next/cache';

export interface DeleteUserResult {
  success: boolean;
  message: string;
}

export async function deleteUser(userId: string): Promise<DeleteUserResult> {
  // 1. Verify the current user is an Admin using the server client
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'Admin') {
    return { success: false, message: 'Akses ditolak: Hanya admin yang dapat menghapus pengguna.' };
  }

  // Prevent admin from deleting themselves (optional but recommended)
  if (user.id === userId) {
      return { success: false, message: 'Tidak dapat menghapus akun admin sendiri.' };
  }

  // 2. Use the admin client to delete the user from Supabase Auth
  try {
    console.log(`Admin ${user.id} attempting to delete user ${userId}`);

    const { data: deletedUser, error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error(`Error deleting user ${userId}:`, error);
      // Handle specific errors, e.g., user not found
      if (error.message.includes('User not found')) {
          return { success: false, message: `Pengguna dengan ID ${userId} tidak ditemukan.` };
      }
      throw new Error(error.message || 'Gagal menghapus pengguna.');
    }

    console.log(`User ${userId} successfully deleted by admin ${user.id}`);

    // Revalidate the path to refresh the user list on the admin page
    revalidatePath('/admin/manage-users');

    return { success: true, message: 'Pengguna berhasil dihapus.' };

  } catch (error: any) {
    console.error('User deletion process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server saat menghapus pengguna.' };
  }
}
