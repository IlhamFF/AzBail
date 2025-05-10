
-- Supabase Initial Schema for EduPortal

-- Extensions (Enable if not already enabled in your Supabase project dashboard)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- For gen_random_uuid() if not default

-- Helper function to update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: user_details
-- Stores additional information for users in auth.users
CREATE TABLE public.user_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT, -- Can be useful for querying/display, though also in auth.users
  role TEXT, -- Can be useful for querying/display, though also in auth.users metadata
  phone TEXT,
  address TEXT,
  birth_date DATE,
  bio TEXT,
  nis TEXT, -- For Siswa (Student ID Number)
  nip TEXT, -- For Guru/Staff (Employee ID Number)
  join_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- For students, their assigned class
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_user_details_updated_at
BEFORE UPDATE ON public.user_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  target_role TEXT, -- e.g., 'Siswa', 'Guru', 'Admin', NULL for all
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  homeroom_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Guru's user_id
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL UNIQUE,
  subject_code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: class_schedules
-- Links classes, subjects, teachers, and time slots
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User ID of the teacher
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 for Sunday, 1 for Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_class_time_slot UNIQUE (class_id, day_of_week, start_time, subject_id),
  CONSTRAINT unique_teacher_time_slot UNIQUE (teacher_id, day_of_week, start_time),
  CONSTRAINT check_end_time_after_start_time CHECK (end_time > start_time)
);
-- Enable RLS
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_class_schedules_updated_at
BEFORE UPDATE ON public.class_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: student_schedules
-- This table explicitly links a student to a class. This is simpler than managing individual schedule items per student
-- if students generally follow their class's schedule.
CREATE TABLE public.student_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(9), -- e.g., "2023/2024" (Optional, if you need historical data)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(student_id, class_id, academic_year) -- A student is in one class per academic year
);
-- Enable RLS
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_student_schedules_updated_at
BEFORE UPDATE ON public.student_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: assignments
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- Target class for the assignment
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User ID of the teacher who created it
  deadline TIMESTAMPTZ,
  file_url TEXT, -- Optional: if assignment instructions are in a file (link to Supabase Storage)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: submissions (student assignment submissions)
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User ID of the student
  file_url TEXT, -- URL to the submitted file in Supabase Storage
  notes TEXT, -- Optional notes from student
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  grade NUMERIC CHECK (grade >= 0 AND grade <= 100),
  graded_at TIMESTAMPTZ,
  teacher_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(assignment_id, student_id) -- A student can submit an assignment only once
);
-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: attendance
CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa');
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_schedule_id UUID REFERENCES public.class_schedules(id) ON DELETE CASCADE, -- Links to a specific class session
  attendance_date DATE NOT NULL,
  status public.attendance_status NOT NULL,
  notes TEXT, -- Optional notes for absence
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who recorded
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, class_schedule_id, attendance_date) -- Unique attendance per student per scheduled session per day
);
-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: grades
-- This table is for general grades not directly tied to a specific 'submission' (e.g., participation, oral exams).
-- Grades for assignments can be stored in the 'submissions' table.
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- Class context for the grade
  assessment_type TEXT NOT NULL, -- e.g., 'UTS', 'UAS', 'Tugas Harian', 'Praktikum', 'Partisipasi'
  assessment_name TEXT, -- e.g., "UTS Semester 1", "Tugas Aljabar Bab 1"
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  grade_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who input the grade
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: materials (learning materials)
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL, -- Optional: if material is for a specific class
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User ID of the teacher
  file_url TEXT NOT NULL, -- URL to the material file in Supabase Storage
  file_type TEXT, -- e.g., 'pdf', 'docx', 'pptx'
  upload_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
-- Trigger for updated_at
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be NULL for system actions
  user_email TEXT, -- Denormalized for easier display in logs
  action TEXT NOT NULL, -- e.g., 'CREATE_USER', 'UPDATE_ANNOUNCEMENT'
  target_type TEXT, -- e.g., 'user', 'announcement', 'class'
  target_id UUID,
  details JSONB, -- Additional details about the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
  -- updated_at is not typically needed for logs
);
-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Indexes for performance on frequently queried columns
CREATE INDEX idx_user_details_user_id ON public.user_details(user_id);
CREATE INDEX idx_user_details_class_id ON public.user_details(class_id);
CREATE INDEX idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX idx_announcements_target_role ON public.announcements(target_role);
CREATE INDEX idx_classes_homeroom_teacher_id ON public.classes(homeroom_teacher_id);
CREATE INDEX idx_class_schedules_class_id ON public.class_schedules(class_id);
CREATE INDEX idx_class_schedules_subject_id ON public.class_schedules(subject_id);
CREATE INDEX idx_class_schedules_teacher_id ON public.class_schedules(teacher_id);
CREATE INDEX idx_student_schedules_student_id ON public.student_schedules(student_id);
CREATE INDEX idx_student_schedules_class_id ON public.student_schedules(class_id);
CREATE INDEX idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_class_schedule_id ON public.attendance(class_schedule_id);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX idx_materials_teacher_id ON public.materials(teacher_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);


-- RLS Policies (Basic Examples - DEFINE THESE PROPERLY BASED ON YOUR APP'S LOGIC)

-- User Details
CREATE POLICY "Users can view their own details" ON public.user_details
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own details" ON public.user_details
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all user details" ON public.user_details
  FOR ALL USING ((auth.jwt() ->> 'role') = 'Admin');

-- Announcements
CREATE POLICY "Authenticated users can view announcements" ON public.announcements
  FOR SELECT USING (auth.role() = 'authenticated' AND (target_role IS NULL OR (auth.jwt() ->> 'role') = target_role));
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (((auth.jwt() ->> 'role') = 'Admin'));

-- Classes
CREATE POLICY "Authenticated users can view classes" ON public.classes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (((auth.jwt() ->> 'role') = 'Admin'));

-- Subjects
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (((auth.jwt() ->> 'role') = 'Admin'));

-- Class Schedules
CREATE POLICY "Authenticated users can view class schedules" ON public.class_schedules
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins or relevant teachers can manage class schedules" ON public.class_schedules
  FOR ALL USING (((auth.jwt() ->> 'role') = 'Admin' OR auth.uid() = teacher_id));

-- Student Schedules
CREATE POLICY "Students can view their own class links" ON public.student_schedules
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins or staff can manage student_schedules" ON public.student_schedules
  FOR ALL USING ( (auth.jwt() ->> 'role') IN ('Admin', 'Tata Usaha') );

-- Assignments
CREATE POLICY "Users can view assignments relevant to them" ON public.assignments
  FOR SELECT USING (
    auth.uid() = teacher_id OR -- Teacher can see their own assignments
    EXISTS ( -- Student can see assignments for their class
        SELECT 1
        FROM public.user_details ud
        WHERE ud.user_id = auth.uid() AND ud.class_id = public.assignments.class_id
    ) OR
    ((auth.jwt() ->> 'role') = 'Admin') -- Admins can see all
  );
CREATE POLICY "Teachers can create assignments" ON public.assignments
  FOR INSERT WITH CHECK (auth.uid() = teacher_id AND (auth.jwt() ->> 'role') = 'Guru');
CREATE POLICY "Teachers can update/delete their own assignments" ON public.assignments
  FOR UPDATE, DELETE USING (auth.uid() = teacher_id AND (auth.jwt() ->> 'role') = 'Guru');

-- Submissions
CREATE POLICY "Users can view relevant submissions" ON public.submissions
  FOR SELECT USING (
    auth.uid() = student_id OR -- Student sees their own
    EXISTS ( -- Teacher sees submissions for their assignments
        SELECT 1
        FROM public.assignments a
        WHERE a.id = public.submissions.assignment_id AND a.teacher_id = auth.uid()
    ) OR
    ((auth.jwt() ->> 'role') = 'Admin')
  );
CREATE POLICY "Students can create submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = student_id AND (auth.jwt() ->> 'role') = 'Siswa');
CREATE POLICY "Students/Teachers can update submissions" ON public.submissions
  FOR UPDATE USING (
    (auth.uid() = student_id AND (auth.jwt() ->> 'role') = 'Siswa') OR -- Student can update their own
    EXISTS ( -- Teacher can update (grade) submissions for their assignments
        SELECT 1
        FROM public.assignments a
        WHERE a.id = public.submissions.assignment_id AND a.teacher_id = auth.uid() AND (auth.jwt() ->> 'role') = 'Guru'
    )
  );

-- Attendance
CREATE POLICY "Users can view relevant attendance" ON public.attendance
  FOR SELECT USING (
    auth.uid() = student_id OR -- Student sees their own
    EXISTS ( -- Teacher sees attendance for their class schedules
        SELECT 1
        FROM public.class_schedules cs
        WHERE cs.id = public.attendance.class_schedule_id AND cs.teacher_id = auth.uid()
    ) OR
    ((auth.jwt() ->> 'role') = 'Admin')
  );
CREATE POLICY "Teachers/Admins can record attendance" ON public.attendance
  FOR INSERT, UPDATE WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.class_schedules cs
        WHERE cs.id = public.attendance.class_schedule_id AND cs.teacher_id = auth.uid() AND (auth.jwt() ->> 'role') = 'Guru'
    ) OR
    ((auth.jwt() ->> 'role') = 'Admin')
  );

-- Grades
CREATE POLICY "Students can view their own grades" ON public.grades
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can manage grades for their subjects/classes" ON public.grades
  FOR ALL USING (auth.uid() = teacher_id AND (auth.jwt() ->> 'role') = 'Guru');
CREATE POLICY "Admins can manage all grades" ON public.grades
  FOR ALL USING ((auth.jwt() ->> 'role') = 'Admin');

-- Materials
CREATE POLICY "Authenticated users can view materials" ON public.materials
  FOR SELECT USING (auth.role() = 'authenticated'); -- Refine based on class_id or subject_id access
CREATE POLICY "Teachers can manage materials" ON public.materials
  FOR ALL USING (auth.uid() = teacher_id AND (auth.jwt() ->> 'role') = 'Guru');

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (((auth.jwt() ->> 'role') = 'Admin'));
-- Deny direct modification of audit logs by non-superusers
CREATE POLICY "Deny direct modification of audit logs" ON public.audit_logs
  FOR INSERT, UPDATE, DELETE USING (false);


-- Seed Data (Optional, but recommended for development)
-- INSERT INTO public.subjects (subject_name, subject_code, description) VALUES
--   ('Matematika Wajib', 'MTK-W', 'Mata pelajaran matematika untuk semua jurusan.'),
--   ('Bahasa Indonesia', 'IND', 'Mata pelajaran Bahasa Indonesia.'),
--   ('Fisika', 'FIS', 'Mata pelajaran Fisika untuk jurusan IPA.');

-- INSERT INTO public.classes (name, homeroom_teacher_id) VALUES
--   ('Kelas 10A', NULL), -- Assign a teacher_id later if needed
--   ('Kelas 11B', NULL);


-- Note: For `auth.users` table, roles and other metadata are typically set
-- via Supabase Auth client library during sign-up or by an admin updating user metadata.
-- Example user creation with metadata (run this from a server-side admin context or Supabase dashboard):
--
-- INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at)
-- VALUES
--   ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@example.com', crypt('password123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"role":"Admin", "full_name":"Admin User", "is_verified":true}', false, now(), now());
--
-- After creating a user in auth.users, you would then create a corresponding record in user_details:
-- INSERT INTO public.user_details (user_id, full_name, email, role) VALUES ('<the_uuid_from_auth.users>', 'Admin User', 'admin@example.com', 'Admin');

```