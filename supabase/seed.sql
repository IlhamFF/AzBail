-- Supabase Seed Data for EduPortal

-- Insert sample subjects
INSERT INTO public.subjects (subject_name, subject_code, description) VALUES
  ('Matematika Wajib', 'MTK-W-X', 'Mata pelajaran matematika wajib untuk kelas X.'),
  ('Bahasa Indonesia Kelas X', 'IND-X', 'Mata pelajaran Bahasa Indonesia untuk kelas X.'),
  ('Fisika Kelas X IPA', 'FIS-X-IPA', 'Mata pelajaran Fisika untuk kelas X jurusan IPA.'),
  ('Sejarah Indonesia Kelas X', 'SEJ-X', 'Mata pelajaran Sejarah Indonesia untuk kelas X.'),
  ('Pendidikan Agama Islam Kelas X', 'PAI-X', 'Mata pelajaran Pendidikan Agama Islam untuk kelas X.'),
  ('Kimia Kelas XI IPA', 'KIM-XI-IPA', 'Mata pelajaran Kimia untuk kelas XI jurusan IPA.'),
  ('Biologi Kelas XI IPA', 'BIO-XI-IPA', 'Mata pelajaran Biologi untuk kelas XI jurusan IPA.'),
  ('Ekonomi Kelas XI IPS', 'EKO-XI-IPS', 'Mata pelajaran Ekonomi untuk kelas XI jurusan IPS.'),
  ('Sosiologi Kelas XI IPS', 'SOS-XI-IPS', 'Mata pelajaran Sosiologi untuk kelas XI jurusan IPS.'),
  ('Bahasa Inggris Kelas XII', 'ENG-XII', 'Mata pelajaran Bahasa Inggris untuk kelas XII.')
ON CONFLICT (subject_name) DO NOTHING
ON CONFLICT (subject_code) DO NOTHING;

-- Insert sample classes
-- For homeroom_teacher_id, you'll need to replace NULL with actual UUIDs of users who are teachers.
-- You can get these UUIDs after creating teacher users in the auth.users table.
INSERT INTO public.classes (name, homeroom_teacher_id) VALUES
  ('Kelas 10A', NULL),
  ('Kelas 10B', NULL),
  ('Kelas 11 IPA 1', NULL),
  ('Kelas 11 IPS 1', NULL),
  ('Kelas 12 IPA 1', NULL),
  ('Kelas 12 IPS 1', NULL)
ON CONFLICT (name) DO NOTHING;

-- Note on Creating Users and User Details:
-- User creation should ideally happen through your application's registration flow
-- or via Supabase admin functions for security.
-- The `auth.users` table is managed by Supabase Auth.
-- `user_details` should be populated after a user is created in `auth.users`.

-- Example of creating an Admin user and their details (RUN THIS MANUALLY OR VIA A SECURE SERVER SCRIPT):
-- 1. Create the user in auth.users (e.g., via Supabase dashboard or a secure script)
--    Ensure their `raw_user_meta_data` includes `{"role":"Admin", "full_name":"Nama Admin", "is_verified":true}`
--
--    Example SQL to create an auth user (less common to do directly via SQL, usually via Supabase client/API):
--    /*
--    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
--    VALUES
--      ('00000000-0000-0000-0000-000000000000', 'YOUR_ADMIN_USER_UUID', 'authenticated', 'authenticated', 'admin@example.com', crypt('securepassword', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"Admin", "full_name":"Admin Utama", "is_verified":true}', now(), now());
--    */
--
-- 2. Then, insert into user_details:
--    /*
--    INSERT INTO public.user_details (user_id, full_name, email, role, nip, is_verified)
--    VALUES ('YOUR_ADMIN_USER_UUID', 'Admin Utama', 'admin@example.com', 'Admin', 'NIP_ADMIN_001', true);
--    */

-- Example of creating a Teacher user and their details:
-- 1. Create in auth.users with metadata: `{"role":"Guru", "full_name":"Nama Guru", "is_verified":true}`
-- 2. Insert into user_details:
--    /*
--    INSERT INTO public.user_details (user_id, full_name, email, role, nip, is_verified)
--    VALUES ('TEACHER_USER_UUID', 'Budi Santoso', 'budi.santoso@example.com', 'Guru', 'NIP_GURU_001', true);
--    */
--    -- Assign Budi Santoso as homeroom teacher for 10A (replace 'TEACHER_USER_UUID' with actual UUID)
--    -- UPDATE public.classes SET homeroom_teacher_id = 'TEACHER_USER_UUID' WHERE name = 'Kelas 10A';


-- Example of creating a Student user and their details:
-- 1. Create in auth.users with metadata: `{"role":"Siswa", "full_name":"Nama Siswa", "is_verified":true}`
-- 2. Insert into user_details and link to a class:
--    /*
--    INSERT INTO public.user_details (user_id, full_name, email, role, nis, class_id, is_verified)
--    VALUES ('STUDENT_USER_UUID', 'Citra Ayu', 'citra.ayu@example.com', 'Siswa', 'NIS_001', (SELECT id from public.classes WHERE name = 'Kelas 10A'), true);
--
--    -- Also link the student to the class schedule (important for student_schedules logic)
--    INSERT INTO public.student_schedules (student_id, class_id)
--    VALUES ('STUDENT_USER_UUID', (SELECT id from public.classes WHERE name = 'Kelas 10A'));
--    */


-- Sample Class Schedules (requires teacher_id, class_id, subject_id from existing records)
-- You would need to get the UUIDs of actual teachers, classes, and subjects first.
-- Example (replace with actual UUIDs):
-- /*
-- INSERT INTO public.class_schedules (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES
--   ((SELECT id FROM public.classes WHERE name = 'Kelas 10A'), (SELECT id FROM public.subjects WHERE subject_code = 'MTK-W-X'), 'TEACHER_USER_UUID_BUDI', 1, '07:30:00', '09:00:00', 'Ruang 101'),
--   ((SELECT id FROM public.classes WHERE name = 'Kelas 10A'), (SELECT id FROM public.subjects WHERE subject_code = 'IND-X'), 'ANOTHER_TEACHER_UUID', 1, '09:30:00', '11:00:00', 'Ruang 102');
-- */

-- Sample Announcements
INSERT INTO public.announcements (title, content, created_by, target_role, is_pinned) VALUES
  ('Selamat Datang di EduPortal', 'Ini adalah platform EduPortal baru sekolah kita. Silakan jelajahi fitur-fiturnya.', NULL, NULL, TRUE), -- created_by should be an admin's UUID
  ('Jadwal Ujian Tengah Semester', 'Jadwal ujian tengah semester akan segera diumumkan. Harap persiapkan diri Anda.', NULL, 'Siswa', FALSE),
  ('Rapat Guru Mingguan', 'Rapat guru mingguan akan diadakan hari Rabu pukul 14:00 di ruang guru.', NULL, 'Guru', FALSE)
ON CONFLICT (title) DO NOTHING; -- Basic conflict handling, adjust as needed


-- Sample Audit Log (Illustrative - these are normally created by application logic)
-- INSERT INTO public.audit_logs (user_id, user_email, action, target_type, target_id, details) VALUES
--   (NULL, 'system@eduportal', 'SYSTEM_STARTUP', NULL, NULL, '{"message":"Application initialized"}');
--   ('YOUR_ADMIN_USER_UUID', 'admin@example.com', 'CREATE_SUBJECT', 'subjects', (SELECT id FROM subjects WHERE subject_code = 'MTK-W-X'), '{"subject_name":"Matematika Wajib", "subject_code":"MTK-W-X"}');

SELECT 'Seed data applied successfully (if no errors shown).' AS message;
```