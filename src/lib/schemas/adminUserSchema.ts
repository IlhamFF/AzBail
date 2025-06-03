
import * as z from 'zod';

// Ensure ROLES is exported if it's used in the page component
export const ROLES = ['Admin', 'Guru', 'Siswa', 'Tata Usaha', 'Kepala Sekolah'] as const;

export const createUserSchema = z.object({
  fullName: z.string().min(3, { message: 'Nama lengkap minimal 3 karakter.' }),
  email: z.string().email({ message: 'Format email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter.' }),
  role: z.enum(ROLES, { // Use the exported ROLES
    required_error: 'Peran harus dipilih.',
  }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export interface CreateUserResult {
  success: boolean;
  message: string;
  userId?: string; // Optional: if you want to return the new user's ID
}

    