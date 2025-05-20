# Mekanisme Registrasi, Verifikasi Email, dan Ganti Password dengan Supabase Auth

Dokumen ini menjelaskan alur pendaftaran pengguna baru, proses verifikasi email, dan mekanisme reset password menggunakan Supabase Auth dalam aplikasi Next.js dengan TypeScript.

## 1. Registrasi Pengguna Baru

Proses registrasi melibatkan pembuatan akun baru di Supabase Auth dengan email dan password yang diberikan oleh pengguna.

### Langkah-langkah:

1.  **Buat Formulir Registrasi:** Sediakan formulir di frontend yang meminta input email dan password dari pengguna.
2.  **Panggil Supabase Auth Sign-up:** Saat formulir disubmit, gunakan fungsi `supabase.auth.signUp()` untuk membuat pengguna baru.

### Contoh Kode (src/app/(auth)/register/page.tsx - Sisi Client):
```
typescript
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`, // URL untuk redirect setelah verifikasi
      },
    });
    if (error) {
      console.error('Error signing up:', error.message);
      // Tampilkan pesan error ke pengguna
    } else {
      // Beri tahu pengguna untuk memeriksa email mereka untuk verifikasi
      alert('Check your email to complete the registration process.');
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```
### Penjelasan:

*   `createClientComponentClient()`: Membuat instance client Supabase yang dapat digunakan di sisi client.
*   `supabase.auth.signUp({ email, password, options: { emailRedirectTo: ... } })`: Memanggil fungsi sign-up Supabase. `emailRedirectTo` adalah URL di aplikasi Anda yang akan dikunjungi pengguna setelah mengklik tautan verifikasi di email.

## 2. Verifikasi Email

Setelah pengguna mendaftar, Supabase akan mengirimkan email verifikasi ke alamat email yang mereka berikan. Pengguna harus mengklik tautan di email tersebut untuk memverifikasi akun mereka.

### Mekanisme:

1.  **Supabase Mengirim Email:** Secara otomatis, Supabase mengirimkan email dengan tautan verifikasi yang berisi token unik.
2.  **Pengguna Mengklik Tautan:** Pengguna mengklik tautan verifikasi. Tautan ini akan mengarahkan mereka kembali ke aplikasi Anda di URL yang ditentukan di `emailRedirectTo` (misalnya, `/auth/callback`).
3.  **Penanganan Callback:** Di halaman callback (`/auth/callback`), aplikasi Anda akan memproses token verifikasi dari URL dan menyelesaikan proses verifikasi menggunakan Supabase Auth.

### Contoh Kode (src/app/auth/callback/route.ts - Route Handler):
```
typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Verifikasi berhasil, arahkan pengguna ke halaman utama atau dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-error`);
}
```
### Penjelasan:

*   `createRouteHandlerClient({ cookies })`: Membuat instance client Supabase untuk digunakan dalam Route Handler (API route). Mengakses cookies untuk mengelola sesi pengguna.
*   `requestUrl.searchParams.get('code')`: Mengambil kode verifikasi dari parameter URL.
*   `supabase.auth.exchangeCodeForSession(code)`: Menggunakan kode verifikasi untuk menukar sesi pengguna yang terverifikasi.
*   Redirect ke halaman yang sesuai (dashboard atau halaman error) setelah verifikasi.

## 3. Ganti Password (Reset Password)

Jika pengguna lupa password mereka, mereka dapat meminta tautan reset password melalui email.

### Langkah-langkah:

1.  **Buat Formulir Permintaan Reset Password:** Sediakan formulir di frontend yang meminta pengguna untuk memasukkan email mereka.
2.  **Panggil Supabase Auth Reset Password:** Saat formulir disubmit, gunakan fungsi `supabase.auth.resetPasswordForEmail()` untuk mengirimkan email reset password.
3.  **Pengguna Mengklik Tautan Reset Password:** Supabase mengirimkan email dengan tautan reset password. Pengguna mengklik tautan ini.
4.  **Buat Halaman Reset Password:** Tautan reset password akan mengarahkan pengguna ke halaman di aplikasi Anda (misalnya, `/reset-password`) yang memungkinkan mereka memasukkan password baru. Halaman ini akan menerima token dan ID pengguna dari URL.
5.  **Panggil Supabase Auth Update User:** Di halaman reset password, gunakan fungsi `supabase.auth.updateUser()` dengan password baru.

### Contoh Kode (Langkah 1 & 2 - Sisi Client, Halaman Permintaan Reset):
```
typescript
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const supabase = createClientComponentClient();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/reset-password`, // URL untuk halaman reset password
    });
    if (error) {
      console.error('Error resetting password:', error.message);
      // Tampilkan pesan error
    } else {
      alert('Check your email for the password reset link.');
    }
  };

  return (
    <form onSubmit={handleResetPassword}>
      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send Reset Link</button>
    </form>
  );
}
```
### Contoh Kode (Langkah 4 & 5 - Sisi Client, Halaman Reset Password):
```
typescript
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Supabase handles token and user ID automatically in the URL after clicking the reset link
  // We just need to call updateUser with the new password

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError.message);
      setError('Failed to update password.');
    } else {
      setSuccess(true);
      // Opsional: Arahkan pengguna ke halaman login setelah berhasil
      setTimeout(() => {
        router.push('/login');
      }, 3000); // Redirect setelah 3 detik
    }
  };

  return (
    <div>
      {success ? (
        <p>Your password has been reset successfully. Redirecting to login...</p>
      ) : (
        <form onSubmit={handleUpdatePassword}>
          <h2>Reset Your Password</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <label htmlFor="password">New Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Reset Password</button>
        </form>
      )}
    </div>
  );
}
```
### Penjelasan:

*   `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`: Mengirim email reset password ke alamat email yang diberikan. `redirectTo` adalah URL di aplikasi Anda yang akan dikunjungi pengguna setelah mengklik tautan reset password.
*   `supabase.auth.updateUser({ password: password })`: Mengupdate password pengguna saat ini. Supabase Auth secara internal menggunakan token dari URL tautan reset untuk mengidentifikasi pengguna yang meminta reset password.

Dengan mengikuti langkah-langkah di atas dan mengimplementasikan contoh kode yang disediakan, Anda dapat membangun mekanisme registrasi, verifikasi email, dan reset password yang aman dan fungsional menggunakan Supabase Auth di aplikasi Next.js Anda.