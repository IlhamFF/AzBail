'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { CreateUserFormData, CreateUserResult } from '@/lib/schemas/adminUserSchema';
import { createUserSchema } from '@/lib/schemas/adminUserSchema';

// This function is called from the server component, so it needs to be an async function
export async function createUserByAdmin(
  _prevState: any, // Required for useFormState if used, otherwise can be ignored for direct calls
  formData: CreateUserFormData
): Promise<CreateUserResult> {
  // 1. Verify the current user is an Admin using the server client
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser || adminUser.user_metadata?.role !== 'Admin') {
    return { success: false, message: 'Akses ditolak: Hanya admin yang dapat membuat pengguna.' };
  }

  // 2. Validate form data against schema
  const validation = createUserSchema.safeParse(formData);
  if (!validation.success) {
    // Construct a user-friendly error message from Zod errors
    const errorMessages = Object.entries(validation.error.flatten().fieldErrors)
      .map(([field, messages]) => `${field}: ${(messages ?? []).join(', ')}`)
      .join('; ');
    return { success: false, message: `Validasi gagal: ${errorMessages}` };
  }

  const { email, password, fullName, role } = validation.data;

  try {
    // 3. Create user in Supabase Auth using admin client
    const { data: newUserData, error: createAuthUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Mark email as confirmed since admin is creating
      user_metadata: {
        full_name: fullName,
        role: role,
        is_verified: true, // Mark as verified by admin
      },
    });

    if (createAuthUserError) {
      console.error('Error creating user in Auth:', createAuthUserError);
      // Provide more specific error messages if possible
      if (createAuthUserError.message.includes('unique constraint') || createAuthUserError.message.includes('already registered')) {
        return { success: false, message: `Email "${email}" sudah terdaftar.` };
      }
      return { success: false, message: `Gagal membuat pengguna di sistem autentikasi: ${createAuthUserError.message}` };
    }

    if (!newUserData || !newUserData.user) {
      return { success: false, message: 'Gagal membuat pengguna, data pengguna baru tidak diterima dari sistem autentikasi.' };
    }

    const newAuthUserId = newUserData.user.id;

    // 4. Create corresponding entry in user_details table
    // Ensure this table and its columns (user_id, full_name, email, role) exist and RLS allows admin insert
    const { error: userDetailError } = await supabaseAdmin
      .from('user_details')
      .insert({
        user_id: newAuthUserId, // This should be the FK to auth.users.id
        full_name: fullName,
        email: email, 
        role: role, 
      });

    if (userDetailError) {
      console.error('Error inserting into user_details:', userDetailError);
      return {
        success: true, 
        message: `Pengguna ${fullName} dibuat di sistem autentikasi, tetapi gagal menyimpan detail profil: ${userDetailError.message}. Harap perbarui detail secara manual.`,
        userId: newAuthUserId
      };
    }

    revalidatePath('/admin/manage-users');
    return { success: true, message: `Pengguna "${fullName}" berhasil dibuat.`, userId: newAuthUserId };

  } catch (error: any) {
    console.error('Create user process failed:', error);
    return { success: false, message: error.message || 'Terjadi kesalahan server saat membuat pengguna.' };
  }
}
