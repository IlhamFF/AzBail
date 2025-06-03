// src/actions/admin/createUserByAdmin.ts

import { createClient } from '@supabase/supabase-js';
import { type } from 'os';

type CreateUserFormData = {
  email: string;
  password: string;
  user_metadata?: { [key: string]: any };
  app_metadata?: { [key: string]: any };
};

type CreateUserResult = {
  success: boolean;
  message: string;
  user?: any; // You might want to define a more specific user type
  error?: any;
};

// Define
export async function createUserByAdmin({ email, password, user_metadata, app_metadata }: CreateUserFormData): Promise<CreateUserResult> {
  // Ensure the Supabase Service Role Key is accessed securely (e.g., via environment variable)
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Assuming NEXT_PUBLIC_SUPABASE_URL is the public URL

  if (!supabaseServiceRoleKey || !supabaseUrl) {
    return { success: false, message: 'Supabase environment variables not configured.' };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }, // Recommended settings for server-side admin client
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password, user_metadata, app_metadata });

  if (error) {
    console.error('Error creating user by admin:', error.message);
    return { success: false, message: error.message || 'Failed to create user.', error };
  }

  return { success: true, message: 'User created successfully!', user: data?.user };
}