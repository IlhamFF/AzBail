# **App Name**: EduPortal

## Core Features:

- RBAC Dashboards: Role-Based Dashboards: Customizable dashboards for Admin, Teachers, Students, Staff, and Principals, providing quick access to relevant information and tools.
- User Management: User Management: Admins can manage user accounts, roles, and permissions, ensuring secure access and control over the system.
- Academic Management: Academic Management: Tools for managing classes, subjects, schedules, assignments, attendance, and grades, streamlining administrative tasks and academic processes.

## Style Guidelines:

- Primary color: Light blue (#E0F7FA) for a calm and professional feel.
- Secondary color: Light gray (#F5F5F5) for backgrounds and subtle accents.
- Accent: Teal (#008080) for interactive elements and key highlights.
- Clean and structured layout with a sidebar navigation for easy access to different modules based on user roles.
- Use a consistent set of icons from a library like FontAwesome or Material Icons to represent different features and actions.

## Original User Request:
Saya membutuhkan bantuan untuk mengembangkan web app akademik sekolah berbasis dengan PostgreSQL untuk database, hono.js sebagai backend, dan supabase auth. Aplikasi ini akan memiliki sistem manajemen pengguna berbasis peran (RBAC) dengan 5 peran utama: Admin, Guru, Siswa, Tata Usaha, dan Kepala Sekolah. Setiap peran memiliki akses dan fitur yang berbeda.

Struktur Aplikasi Aplikasi harus menggunakan arsitektur yang terorganisir dengan pemisahan yang jelas antara:

UI (components, layouts, screens) Logic (services, providers) Data (models, repositories) Utils (helpers, constants) Fitur Autentikasi dan Manajemen Pengguna Sistem registrasi dengan verifikasi admin Login dengan validasi peran dan status verifikasi Manajemen sesi pengguna menggunakan Provider Profil pengguna dengan kemampuan edit Sistem audit log untuk aktivitas pengguna Manajemen pengguna oleh admin (CRUD) Fitur Berdasarkan Peran Admin: Dashboard admin dengan statistik pengguna Verifikasi pengguna baru Manajemen pengguna (tambah, edit, hapus) Audit log aktivitas Backup dan restore database Guru: Dashboard dengan jadwal mengajar Manajemen kelas dan siswa Input nilai dan absensi Upload materi pembelajaran Komunikasi dengan siswa Siswa: Dashboard dengan jadwal pelajaran Lihat nilai dan absensi Akses materi pembelajaran Submit tugas Lihat pengumuman Tata Usaha: Manajemen data siswa Administrasi keuangan Pengelolaan surat-menyurat Inventaris sekolah Kepala Sekolah: Dashboard dengan statistik sekolah Monitoring kinerja guru Persetujuan dokumen Laporan akademik Integrasi Firebase Firebase Authentication untuk autentikasi Firestore untuk database dengan struktur relasional: users (data pengguna) user_details (detail berdasarkan peran) classes (data kelas) subjects (mata pelajaran) schedules (jadwal) assignments (tugas) submissions (pengumpulan tugas) attendance (absensi) grades (nilai) audit_logs (log aktivitas) UI/UX Tema dark mode dan light mode Responsif untuk desktop dan mobile Komponen UI kustom yang konsisten: CustomButton, CustomCard, CustomTextField, dll. Sidebar navigasi berdasarkan peran Dashboard cards dengan visualisasi data Form dengan validasi Dialog konfirmasi dan notifikasi Keamanan Validasi input di client-side Aturan keamanan Firestore berdasarkan peran Pengecekan status verifikasi sebelum akses Enkripsi data sensitif Audit trail untuk aktivitas penting Performa Lazy loading untuk data besar Caching data untuk mengurangi kueri database Optimasi gambar dan aset State management yang efisien dengan Provider Tolong berikan implementasi kode untuk aplikasi ini dengan fokus pada struktur proyek yang baik, manajemen state yang efisien, dan UI yang modern. Sertakan juga penjelasan tentang arsitektur, flow autentikasi, dan strategi untuk mengelola relasi data di Firestore. Saya sedang mengembangkan aplikasi akademik sekolah berbasis Flutter dengan Firebase dan membutuhkan bantuan untuk melanjutkan pengembangan. Berikut adalah progress proyek saat ini:

Struktur Proyek Proyek sudah memiliki struktur folder sebagai berikut:

lib/ constants/ (konstanta aplikasi) role_constants.dart (definisi peran: Admin, Guru, TU, Kepsek, Siswa) route_constants.dart (definisi rute navigasi) status_constants.dart (konstanta status: success, warning, error, info) ui_constants.dart (konstanta UI: spacing, radius, dll) collection_constants.dart (konstanta koleksi Firestore) models/ (model data) user_model.dart (model untuk data pengguna) class_model.dart (model untuk data kelas) subject_model.dart (model untuk mata pelajaran) schedule_model.dart (model untuk jadwal pelajaran) features/ (fitur berdasarkan modul) auth/ (autentikasi) auth_page.dart (halaman awal autentikasi) login_page.dart (halaman login) register_page.dart (halaman registrasi) dashboard/ (dashboard) dashboard_page.dart (halaman dashboard dengan konten berbasis peran) profile/ (profil pengguna) profile_page.dart (halaman profil) profile_update_page.dart (halaman edit profil) manage_users/ (manajemen pengguna) manage_users_page.dart (halaman kelola pengguna) manage_students/ (manajemen siswa) manage_students_page.dart (halaman kelola siswa) class_schedule/ (jadwal kelas) class_schedules_page.dart (halaman jadwal kelas) providers/ (state management) user_session_provider.dart (provider untuk sesi pengguna) routes/ (routing aplikasi) app_routes.dart (definisi rute aplikasi) services/ (layanan backend) auth_service.dart (layanan autentikasi Firebase) firestore_service.dart (layanan Firestore) audit_log_service.dart (layanan pencatatan aktivitas) firebase_options.dart (konfigurasi Firebase) ui/ (komponen UI) animations/ fade_animation.dart (animasi fade) page_transitions.dart (transisi antar halaman) components/ custom_app_bar.dart (app bar kustom) custom_avatar.dart (avatar pengguna) custom_button.dart (tombol kustom) custom_card.dart (kartu kustom) custom_text_field.dart (input teks kustom) sidebar.dart (sidebar navigasi) status_badge.dart (badge status) layouts/ auth_layout.dart (layout untuk halaman autentikasi) dashboard_layout.dart (layout untuk dashboard) settings_layout.dart (layout untuk halaman pengaturan) styles/ app_styles.dart (definisi style aplikasi) theme/ app_theme.dart (tema aplikasi) widgets/ (widget khusus berdasarkan peran) admin/ audit_log_table.dart (tabel log audit) user_management_card.dart (kartu manajemen pengguna) common/ notification_item.dart (item notifikasi) profile_header.dart (header profil) stats_card.dart (kartu statistik) guru/ class_schedule_card.dart (kartu jadwal kelas) grade_input_form.dart (form input nilai) kepsek/ approval_card.dart (kartu persetujuan) performance_chart.dart (grafik performa) siswa/ assignment_card.dart (kartu tugas) attendance_summary.dart (ringkasan kehadiran) grade_chart.dart (grafik nilai) tu/ inventory_item.dart (item inventaris) payment_card.dart (kartu pembayaran) utils/ (utilitas) role_based_widget.dart (widget berbasis peran) validators.dart (validasi input) firebase_diagnostics.dart (diagnostik Firebase) main.dart (file utama aplikasi)

selain itu masih banyak yang perlu ditambah/kurang coba buat secara komprehensif,

jadikan gambar dashboard contoh itu sebagai acuan gaya dari design ui nya, tapi buat versi light mode

Berikut ini struktur databasenya 
-- Membuat tabel users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel user_details
CREATE TABLE user_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(20),
  address TEXT,
  birth_date DATE,
  join_date DATE DEFAULT CURRENT_DATE,
  nis VARCHAR(20) NULL, -- Untuk siswa
  nip VARCHAR(20) NULL, -- Untuk guru dan staf
  department VARCHAR(100) NULL,
  bio TEXT
);

-- Membuat tabel classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_name VARCHAR(100) NOT NULL,
  class_code VARCHAR(20) UNIQUE NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  homeroom_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel class_students
CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel subject_teachers
CREATE TABLE subject_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP NOT NULL,
  max_score NUMERIC(5,2) DEFAULT 100.0,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url TEXT,
  notes TEXT,
  score NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP
);

-- Membuat tabel attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- present, absent, sick, permission
  notes TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel grades
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  academic_term VARCHAR(20) NOT NULL,
  assignment_score NUMERIC(5,2),
  mid_exam_score NUMERIC(5,2),
  final_exam_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  grade VARCHAR(5),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  target_role VARCHAR(20) NULL, -- Untuk filter pengumuman
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel inventories (untuk Tata Usaha)
CREATE TABLE inventories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  condition VARCHAR(50) NOT NULL,
  purchase_date DATE,
  price NUMERIC(12,2),
  location VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel finances (untuk Tata Usaha)
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(50) NOT NULL, -- income, expense
  amount NUMERIC(12,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  related_student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel documents (untuk surat-menyurat)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  file_url TEXT,
  status VARCHAR(50) NOT NULL, -- draft, submitted, approved, rejected
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk meningkatkan performa query
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_class_students_class_id ON class_students(class_id);
CREATE INDEX idx_class_students_student_id ON class_students(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_grades_student_subject ON grades(student_id, subject_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_schedules_day_of_week ON schedules(day_of_week);

Berikut ini strukur foldering projek 
src/
├── config/
│   ├── database.ts
│   └── environment.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── class.controller.ts
│   ├── subject.controller.ts
│   ├── schedule.controller.ts
│   ├── assignment.controller.ts
│   ├── attendance.controller.ts
│   ├── grade.controller.ts
│   ├── announcement.controller.ts
│   ├── inventory.controller.ts
│   ├── finance.controller.ts
│   └── document.controller.ts
├── middlewares/
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts
│   └── logger.middleware.ts
├── models/
│   ├── user.model.ts
│   ├── class.model.ts
│   ├── subject.model.ts
│   ├── schedule.model.ts
│   ├── assignment.model.ts
│   ├── attendance.model.ts
│   ├── grade.model.ts
│   └── audit-log.model.ts
├── services/
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── class.service.ts
│   ├── subject.service.ts
│   ├── schedule.service.ts
│   ├── assignment.service.ts
│   ├── attendance.service.ts
│   ├── grade.service.ts
│   ├── announcement.service.ts
│   ├── inventory.service.ts
│   ├── finance.service.ts
│   ├── document.service.ts
│   └── audit-log.service.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── class.routes.ts
│   ├── subject.routes.ts
│   ├── schedule.routes.ts
│   ├── assignment.routes.ts
│   ├── attendance.routes.ts
│   ├── grade.routes.ts
│   ├── announcement.routes.ts
│   ├── inventory.routes.ts
│   ├── finance.routes.ts
│   ├── document.routes.ts
│   └── index.ts
├── utils/
│   ├── validation.ts
│   ├── password.ts
│   ├── jwt.ts
│   └── response.ts
└── index.ts
  