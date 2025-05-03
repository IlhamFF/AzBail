-- Users Table (Managed by Supabase Auth, but shown for context)
-- You don't need to create this table manually.
-- Supabase Auth creates `auth.users`.

-- Add role, full_name, is_verified to auth.users metadata upon signup.

-- User Details Table
CREATE TABLE public.user_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NULL,
    address TEXT NULL,
    birth_date DATE NULL,
    bio TEXT NULL,
    nis TEXT NULL, -- For Students
    nip TEXT NULL, -- For Teachers/Staff
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_details updated_at
CREATE TRIGGER update_user_details_updated_at
BEFORE UPDATE ON public.user_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy for user_details (Example - Allow users to see/edit their own details)
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to see their own details" ON public.user_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own details" ON public.user_details
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Announcements Table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    target_role TEXT NULL, -- NULL means for everyone
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for announcements updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy for announcements (Example - Allow reading based on role, allow admin full control)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read relevant announcements" ON public.announcements
FOR SELECT USING (
    auth.role() = 'authenticated' AND -- Ensure user is logged in
    (target_role IS NULL OR (auth.jwt() ->> 'role'::text) = target_role) -- Match role or if target is NULL
);

CREATE POLICY "Allow admins full control over announcements" ON public.announcements
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'Admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'Admin'::text);


-- Classes Table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    homeroom_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for classes updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy for classes (Example - Allow authenticated read, admin full control)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read classes" ON public.classes
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins full control over classes" ON public.classes
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'Admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'Admin'::text);


-- Subjects Table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_name TEXT NOT NULL,
    subject_code TEXT UNIQUE NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for subjects updated_at
CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy for subjects (Example - Allow authenticated read, admin full control)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read subjects" ON public.subjects
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins full control over subjects" ON public.subjects
FOR ALL USING ((auth.jwt() ->> 'role'::text) = 'Admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'Admin'::text);

-- Student Schedules Table
CREATE TABLE public.student_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    day TEXT NOT NULL, -- Consider ENUM or specific check constraints
    time TEXT NOT NULL -- Consider time range or specific format
);

-- RLS Policy for student_schedules (Example - Students see own, Teachers/Admin see relevant)
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own schedule" ON public.student_schedules
FOR SELECT USING (auth.uid() = student_id);

-- Add policies for Teachers/Admins as needed

-- Teacher Schedules Table
CREATE TABLE public.teacher_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL
);

-- RLS Policy for teacher_schedules (Example - Teachers see own, Admin see all)
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own schedule" ON public.teacher_schedules
FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all teacher schedules" ON public.teacher_schedules
FOR SELECT USING ((auth.jwt() ->> 'role'::text) = 'Admin'::text);

-- Assignments Table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger for assignments updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policy for assignments (Example - Teachers create/manage own, Students view relevant)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Add policies based on roles (Teacher can create/manage for their classes, Students can view for their class)

-- Submissions Table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL, -- URL from Supabase Storage
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    grade NUMERIC NULL, -- Optional: Grade assigned by teacher
    feedback TEXT NULL -- Optional: Feedback from teacher
);

-- RLS Policy for submissions (Example - Students submit/view own, Teachers view/grade relevant)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Add policies based on roles

-- Attendance Table
CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa');

CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status public.attendance_status NOT NULL,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher/Staff who recorded
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policy for attendance (Example - Students view own, Teachers manage relevant)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Add policies based on roles

-- Grades Table (Could be combined with submissions or kept separate)
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NULL, -- Could be non-assignment grade
    grade_type TEXT NOT NULL, -- e.g., 'UH 1', 'UTS', 'Tugas 1'
    score NUMERIC NOT NULL,
    graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who graded
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policy for grades (Example - Students view own, Teachers manage relevant)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Add policies based on roles

-- Materials Table
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL, -- URL from Supabase Storage
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NULL -- Optional: Target specific class
);

-- RLS Policy for materials (Example - Teachers upload, Students download relevant)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Add policies based on roles

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NULL, -- Can be NULL for system actions
    action TEXT NOT NULL, -- e.g., 'CREATE_USER', 'UPDATE_ANNOUNCEMENT'
    target_type TEXT NULL, -- e.g., 'user', 'announcement'
    target_id UUID NULL,
    details JSONB NULL -- Additional details about the action
);

-- RLS Policy for audit_logs (Example - Only Admins can read)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to read audit logs" ON public.audit_logs
FOR SELECT USING ((auth.jwt() ->> 'role'::text) = 'Admin'::text);

-- Create indexes for frequently queried columns, e.g., foreign keys, timestamp
CREATE INDEX idx_user_details_user_id ON public.user_details(user_id);
CREATE INDEX idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX idx_announcements_target_role ON public.announcements(target_role);
CREATE INDEX idx_classes_homeroom_teacher_id ON public.classes(homeroom_teacher_id);
CREATE INDEX idx_student_schedules_student_id ON public.student_schedules(student_id);
CREATE INDEX idx_student_schedules_class_id ON public.student_schedules(class_id);
CREATE INDEX idx_teacher_schedules_teacher_id ON public.teacher_schedules(teacher_id);
CREATE INDEX idx_teacher_schedules_class_id ON public.teacher_schedules(class_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_materials_teacher_id ON public.materials(teacher_id);
CREATE INDEX idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);


-- Insert default roles if needed (or manage roles through application logic)
-- Example: INSERT INTO public.roles (name) VALUES ('Admin'), ('Guru'), ('Siswa'), ('Tata Usaha'), ('Kepala Sekolah');

-- Function to create user details upon user signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_details (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to log actions (Example - can be called from other triggers or functions)
CREATE OR REPLACE FUNCTION public.log_action(
    p_user_id UUID,
    p_action TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, target_type, target_id, details)
    VALUES (p_user_id, p_action, p_target_type, p_target_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Use SECURITY DEFINER if the function needs higher privileges

-- Example Trigger using log_action (Log when an announcement is created)
-- CREATE OR REPLACE FUNCTION public.log_announcement_creation()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     PERFORM public.log_action(
--         auth.uid(), -- Get the ID of the user performing the action
--         'CREATE_ANNOUNCEMENT',
--         'announcement',
--         NEW.id,
--         jsonb_build_object('title', NEW.title)
--     );
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER on_announcement_created
--   AFTER INSERT ON public.announcements
--   FOR EACH ROW EXECUTE PROCEDURE public.log_announcement_creation();


-- Initial Data Seeding (Optional)
-- Example: Add default subjects
-- INSERT INTO public.subjects (subject_name, subject_code) VALUES
--   ('Matematika', 'MTK'),
--   ('Bahasa Indonesia', 'BIND'),
--   ('Bahasa Inggris', 'BING'),
--   ('Fisika', 'FIS'),
--   ('Kimia', 'KIM'),
--   ('Biologi', 'BIO'),
--   ('Sejarah', 'SEJ'),
--   ('Geografi', 'GEO'),
--   ('Ekonomi', 'EKO'),
--   ('Sosiologi', 'SOS');

-- Add other initial data as needed (e.g., default classes)
