# Authentication Flow using Supabase Client - Code Examples

Berikut adalah alur (flow) umum dari proses autentikasi pengguna (login) menggunakan Supabase Client Library, beserta bagaimana data pengguna dan peran diambil dan digunakan.

## 1. Pengguna Memulai Proses Login

Pengguna berinteraksi dengan antarmuka login di aplikasi Anda, memasukkan kredensial (Email, Password).

*(Tidak ada kode snippet spesifik untuk UI di sini, fokus pada interaksi dengan Supabase Client)*

## 2. Aplikasi Mengirim Kredensial ke Supabase Auth

Aplikasi menggunakan Supabase Client Library untuk mengirimkan email dan password ke Supabase Auth API. Ini adalah langkah pertama yang melibatkan kode aplikasi yang berinteraksi dengan Supabase.
```
typescript
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client Anda
// Ganti dengan URL dan Public Key Supabase Anda
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Login error:', error.message);
    // Tampilkan pesan error ke pengguna, misalnya menggunakan alert atau memperbarui state UI
    alert(error.message);
  } else {
    console.log('Login successful:', data);
    // Data yang berhasil berisi user object dasar (dari auth.users) dan session
    // Lanjutkan ke langkah selanjutnya, misalnya mengarahkan pengguna atau mengambil data profil
    onLoginSuccess(data.user);
  }
}

// Contoh pemanggilan dari event handler UI
// const loginButton = document.getElementById('login-button');
// loginButton.addEventListener('click', () => {
//   const emailInput = document.getElementById('email') as HTMLInputElement;
//   const passwordInput = document.getElementById('password') as HTMLInputElement;
//   handleLogin(emailInput.value, passwordInput.value);
// });
```
*   **Keterlibatan Tabel:** Kode ini berinteraksi dengan Supabase Auth, yang di backend memvalidasi kredensial terhadap tabel `auth.users`.

## 3. Supabase Auth Memproses Permintaan (Backend)

Di sisi server Supabase, Auth API memvalidasi kredensial dari aplikasi terhadap tabel `auth.users`. Jika valid, token sesi dan JWT dibuat. Jika tidak, error dikembalikan.

*(Ini adalah proses di backend Supabase, tidak ada kode aplikasi langsung untuk langkah ini selain menerima respons)*

## 4. Aplikasi Menerima Respons dan Menyimpan Sesi

Supabase Client Library menerima respons. Jika login berhasil, token sesi dan JWT disimpan secara lokal oleh client library secara otomatis. Aplikasi kemudian mengenali pengguna sebagai terautentikasi.
```
typescript
function onLoginSuccess(user) {
  console.log('User is authenticated. User ID:', user.id);
  // Token dan sesi sudah tersimpan. Supabase client akan otomatis menambahkannya ke header
  // permintaan selanjutnya.

  // Selanjutnya, ambil detail profil dan peran dari database aplikasi
  fetchUserProfileAndRole(user.id);

  // Arahkan pengguna ke halaman yang dilindungi
  // window.location.href = '/dashboard';
}
```
*   **Keterlibatan Tabel:** Supabase Client mengelola token yang merepresentasikan identitas dari `auth.users`.

## 5. Mengambil Detail Pengguna dan Peran

Setelah autentikasi dasar, aplikasi sering perlu mengambil detail profil lengkap pengguna (nama, dll.) dan perannya dari tabel aplikasi (`user_details`, `roles`).
```
typescript
async function fetchUserProfileAndRole(userId: string) {
  console.log('Fetching user profile and role for user ID:', userId);
  // Kueri data dari tabel public.user_details
  // Menggunakan .select('*') untuk semua kolom user_details
  // Menggunakan roles(role_name) untuk mengambil nama peran melalui foreign key join
  // Menggunakan .eq('user_id', userId) untuk memfilter berdasarkan user ID yang terautentikasi
  // Menggunakan .single() karena setiap user_id diharapkan punya satu user_details entry
  // **PENTING:** RLS policies pada user_details dan roles harus mengizinkan SELECT oleh pengguna ini.
  const { data: userProfile, error } = await supabase
    .from('user_details')
    .select('*, roles(role_name)') // Mengambil detail pengguna dan nama peran terkait
    .eq('user_id', userId) // Filter berdasarkan ID pengguna yang sedang login
    .single(); // Harapkan satu hasil

  if (error) {
    console.error('Error fetching user profile:', error.message);
    // Tangani error (misalnya, data profil belum lengkap, atau RLS blocking)
    // Mungkin arahkan ke halaman setup profil jika belum ada
  } else {
    console.log('User profile and role fetched:', userProfile);
    // Gunakan data profil dan peran dalam aplikasi
    useUserData(userProfile);
  }
}
```
*   **Keterlibatan Tabel:** Membaca dari `public.user_details` dan `public.roles`. RLS pada kedua tabel ini sangat penting di langkah ini.

## 6. Aplikasi Menggunakan Informasi Pengguna dan Peran

Aplikasi menggunakan detail profil dan peran pengguna untuk menyesuaikan UI, mengontrol akses fitur, dan dalam permintaan data selanjutnya yang tunduk pada RLS.
```
typescript
interface UserProfileWithRole {
  id: string;
  user_id: string;
  full_name: string;
  // ... kolom lain dari public.user_details (misalnya, class_id)
  roles: { // Objek nested dari hasil JOIN roles
    role_name: string;
  } | null; // Bisa null jika role_id di user_details adalah NULL
}

function useUserData(userProfile: UserProfileWithRole) {
  console.log('Hello,', userProfile.full_name || 'User');
  const userRole = userProfile.roles?.role_name;
  console.log('Your role:', userRole);

  // Contoh logika aplikasi berdasarkan peran
  if (userRole === 'Admin') {
    // Tampilkan komponen atau menu admin
    console.log('Admin features unlocked.');
  } else if (userRole === 'Guru') {
    // Tampilkan komponen atau menu guru
    console.log('Teacher features unlocked.');
  } else if (userRole === 'Siswa') {
     // Tampilkan komponen atau menu siswa, mungkin berdasarkan class_id: userProfile.class_id
    console.log('Student features unlocked.');
  }

  // Data userProfile (termasuk class_id jika diambil) dan userRole kini dapat digunakan
  // di seluruh aplikasi untuk personalisasi dan otorisasi di sisi klien.
  // Permintaan data selanjutnya ke Supabase akan dievaluasi oleh RLS policies
  // berdasarkan identitas pengguna dan atribut dari JWT atau RLS join.
}
```
*   **Keterlibatan Tabel:** Data dari `user_details` dan `roles` digunakan di logika frontend. Informasi ini juga secara implisit digunakan oleh RLS saat permintaan data database dikirim.

Alur ini merinci proses teknis dan logis dari saat pengguna mencoba login hingga aplikasi sepenuhnya siap dengan data profil dan peran pengguna untuk mengontrol pengalaman pengguna dan akses data.