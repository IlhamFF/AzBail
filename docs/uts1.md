# Database Schema Simulation for Authentication and User Management

Berikut adalah simulasi struktur tabel yang terlibat dalam proses autentikasi dan manajemen pengguna, peran, kelas, mata pelajaran guru, dan status verifikasi, dengan fokus pada bagaimana foreign key menghubungkan mereka.

### `auth.users` Table (Managed by Supabase Auth)
```
sql
-- auth.users table is managed automatically by Supabase Auth.
-- It contains core user authentication information (email, password hash, etc.).
-- Its 'id' column is the primary key and is referenced by other tables.
-- You typically interact with this table via Supabase Auth client libraries,
-- not direct SQL unless for RLS policies or specific backend functions.
```
### `public.roles` Table

Deskripsi: Tabel lookup untuk mendefinisikan peran-peran yang ada dalam aplikasi.
```
sql
CREATE TABLE public.roles (
  id UUID PRIMARY KEY, -- Primary Key (PK)
  role_name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.classes` Table

Deskripsi: Tabel untuk mendefinisikan kelas-kelas sekolah. Dirujuk oleh `user_details` untuk siswa.
```
sql
CREATE TABLE public.classes (
  id UUID PRIMARY KEY, -- Primary Key (PK)
  name TEXT NOT NULL,
  -- ... other class-related columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.verification_statuses` Table

Deskripsi: Tabel lookup untuk mendefinisikan kemungkinan status verifikasi pengguna.
```
sql
CREATE TABLE public.verification_statuses (
  id UUID PRIMARY KEY, -- Primary Key (PK)
  status_name TEXT UNIQUE NOT NULL, -- e.g., 'Pending', 'Verified', 'Rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.subjects` Table

Deskripsi: Tabel untuk mendefinisikan mata pelajaran sekolah. Dirujuk oleh `teacher_subjects`.
```
sql
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY, -- Primary Key (PK)
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  -- ... other subject-related columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.user_details` Table

Deskripsi: Menyimpan detail profil tambahan untuk setiap pengguna dan menghubungkannya dengan peran dan kelas (untuk siswa).
```
sql
CREATE TABLE public.user_details (
  id UUID PRIMARY KEY, -- Primary Key (PK) for this table
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Foreign Key (FK) to auth.users
  full_name TEXT NOT NULL,
  -- ... other user profile details (phone, address, bio, nis, nip, etc.)
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL, -- Foreign Key (FK) to public.roles
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- Foreign Key (FK) to public.classes (for students)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.user_verifications` Table (If using a separate table for verification status)

Deskripsi: Tabel perantara untuk melacak status verifikasi pengguna, memungkinkan detail lebih lanjut tentang proses verifikasi.
```
sql
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY, -- Primary Key (PK)
  user_detail_id UUID UNIQUE NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE, -- Foreign Key (FK) to public.user_details
  status_id UUID NOT NULL REFERENCES public.verification_statuses(id) ON DELETE RESTRICT, -- Foreign Key (FK) to public.verification_statuses
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Foreign Key (FK) to auth.users (the user who verified)
  verification_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
### `public.teacher_subjects` Table

Deskripsi: Tabel perantara untuk menghubungkan guru (user_id di auth.users/user_details) dengan mata pelajaran yang mereka ajar (public.subjects) karena relasi Many-to-Many.

sql
CREATE TABLE public.teacher_subjects (
  id UUID PRIMARY KEY, -- Primary Key (PK) for this link
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Foreign Key (FK) to auth.users (for the teacher)
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE, -- Foreign Key (FK) to public.subjects
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (teacher_id, subject_id) -- Constraint to prevent duplicate entries
);