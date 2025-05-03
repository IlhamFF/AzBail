-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table: user_details (extends auth.users)
CREATE TABLE public.user_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NULL,
  address TEXT NULL,
  birth_date DATE NULL,
  bio TEXT NULL,
  nis TEXT NULL, -- For students
  nip TEXT NULL, -- For teachers/staff
  join_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for user_details updated_at
CREATE TRIGGER set_user_details_updated_at
BEFORE UPDATE ON public.user_details
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for user_details (Example: Allow users to manage their own details, admins can manage all)
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow individual user access" ON public.user_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual user update" ON public.user_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow individual user insert" ON public.user_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admin full access" ON public.user_details FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Table: announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  target_role TEXT NULL, -- Role name or NULL for all
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for announcements updated_at
CREATE TRIGGER set_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for announcements (Example: Authenticated users can read, Admins can manage)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.announcements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON public.announcements FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Table: classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  homeroom_teacher_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for classes updated_at
CREATE TRIGGER set_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for classes (Example: Authenticated users can read, Admins can manage)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON public.classes FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Table: subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for subjects updated_at
CREATE TRIGGER set_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for subjects (Example: Authenticated users can read, Admins can manage)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to authenticated users" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON public.subjects FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Table: student_schedules
CREATE TABLE public.student_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    day TEXT NOT NULL, -- e.g., 'Senin', 'Selasa'
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for student_schedules updated_at
CREATE TRIGGER set_student_schedules_updated_at
BEFORE UPDATE ON public.student_schedules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for student_schedules (Example: Students see their own, Teachers see their classes, Admins see all)
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow student read access to own schedule" ON public.student_schedules FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Allow admin full access" ON public.student_schedules FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policy for teachers to view schedules of classes they teach


-- Table: teacher_schedules
CREATE TABLE public.teacher_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    day TEXT NOT NULL, -- e.g., 'Senin', 'Selasa'
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for teacher_schedules updated_at
CREATE TRIGGER set_teacher_schedules_updated_at
BEFORE UPDATE ON public.teacher_schedules
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for teacher_schedules (Example: Teachers see their own, Admins see all)
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow teacher read access to own schedule" ON public.teacher_schedules FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.teacher_schedules FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Table: assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who assigned
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for assignments updated_at
CREATE TRIGGER set_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for assignments (Example: Teachers manage their own/class assignments, Students see assigned, Admins manage all)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access" ON public.assignments FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policies for teachers and students


-- Table: submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL, -- URL from Supabase Storage
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  grade NUMERIC(5, 2) NULL, -- Optional grade on submission
  feedback TEXT NULL, -- Optional feedback
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for submissions updated_at
CREATE TRIGGER set_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for submissions (Example: Students manage own, Teachers view/grade class submissions, Admins manage all)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow student access to own submissions" ON public.submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Allow admin full access" ON public.submissions FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policy for teachers


-- Type: attendance_status
CREATE TYPE public.attendance_status AS ENUM (
  'Hadir',
  'Sakit',
  'Izin',
  'Alpa'
);

-- Table: attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status public.attendance_status NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher/Admin who recorded
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for attendance updated_at
CREATE TRIGGER set_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for attendance (Example: Students view own, Teachers manage class attendance, Admins manage all)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow student read access to own attendance" ON public.attendance FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Allow admin full access" ON public.attendance FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policy for teachers


-- Table: grades
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  assignment_id UUID NULL REFERENCES public.assignments(id) ON DELETE SET NULL, -- Can be linked to assignment or other assessment type
  assessment_type TEXT NOT NULL, -- e.g., 'UH 1', 'UTS', 'Tugas 1'
  score NUMERIC(5, 2) NOT NULL,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher/Admin who graded
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for grades updated_at
CREATE TRIGGER set_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for grades (Example: Students view own, Teachers manage class grades, Admins manage all)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow student read access to own grades" ON public.grades FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Allow admin full access" ON public.grades FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policy for teachers


-- Table: materials
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who uploaded
  class_id UUID NULL REFERENCES public.classes(id) ON DELETE SET NULL, -- Optional target class
  file_url TEXT NOT NULL, -- URL from Supabase Storage
  upload_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for materials updated_at
CREATE TRIGGER set_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policy for materials (Example: Teachers manage own, Students view assigned, Admins manage all)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access" ON public.materials FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');
-- Add policies for teachers and students


-- Table: audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- User performing action (NULL for system actions)
  action TEXT NOT NULL, -- e.g., 'CREATE_USER', 'UPDATE_SUBJECT'
  target_type TEXT NULL, -- e.g., 'user', 'subject'
  target_id UUID NULL,
  details JSONB NULL, -- Additional relevant info
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  -- No updated_at for logs generally
);

-- RLS Policy for audit_logs (Example: Only Admins can read/manage)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin full access" ON public.audit_logs FOR ALL USING ((auth.jwt() ->> 'role')::text = 'Admin');


-- Seed initial roles in user metadata (Example - Adapt as needed)
-- This part is typically handled during user signup or manually via Supabase dashboard/admin client
-- Example of how to update role via SQL (requires elevated privileges, not for direct app use)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "Admin"}'::jsonb
-- WHERE email = 'admin@example.com';
