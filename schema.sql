-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: user_details
-- Stores additional profile information for users.
CREATE TABLE public.user_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  birth_date DATE,
  bio TEXT,
  nis TEXT, -- Student ID Number
  nip TEXT, -- Staff/Teacher ID Number
  join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  avatar_url TEXT, -- Added for profile pictures
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: classes
-- Stores information about school classes.
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  homeroom_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: subjects
-- Stores information about school subjects.
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: announcements
-- Stores announcements made within the application.
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  target_role TEXT, -- Role targeted by the announcement (NULL for all)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: schedules
-- Stores class schedules for students and teachers.
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Teacher teaching this schedule
  day TEXT NOT NULL, -- e.g., 'Senin', 'Selasa'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT, -- Optional room information
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: assignments
-- Stores assignment details.
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Teacher who created the assignment
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  file_url TEXT, -- Optional attachment URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: submissions
-- Stores student submissions for assignments.
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT, -- URL of the submitted file
  notes TEXT, -- Optional notes from the student
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  score NUMERIC(5, 2), -- Score given by the teacher
  feedback TEXT, -- Feedback from the teacher
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who graded
  graded_at TIMESTAMP WITH TIME ZONE
);

-- Table: attendance
-- Stores student attendance records.
CREATE TYPE attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpa');
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT, -- Optional notes for absence
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User who recorded the attendance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: grades
-- Stores student grades for different assessments.
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE, -- Link to assignment if applicable
  assessment_type TEXT NOT NULL, -- e.g., 'UH 1', 'UTS', 'Tugas 1'
  score NUMERIC(5, 2),
  status TEXT, -- e.g., 'Lulus', 'Remedial'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Teacher who input the grade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: materials
-- Stores learning materials uploaded by teachers.
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Teacher who uploaded
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE, -- Optional target class
  file_url TEXT NOT NULL, -- URL of the material file in storage
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs
-- Stores a log of important activities within the system.
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- User performing the action (NULL for system)
  action TEXT NOT NULL, -- e.g., 'CREATE_USER', 'UPDATE_ANNOUNCEMENT', 'VERIFY_USER'
  target_type TEXT, -- e.g., 'user', 'announcement', 'class'
  target_id UUID,
  details JSONB, -- Additional details about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: inventories (for Staff - Tata Usaha)
CREATE TABLE public.inventories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  condition TEXT NOT NULL, -- e.g., 'Baik', 'Perlu Perbaikan', 'Rusak'
  location TEXT,
  purchase_date DATE,
  price NUMERIC(12, 2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: finances (for Staff - Tata Usaha)
CREATE TABLE public.finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL, -- e.g., 'Penerimaan', 'Pengeluaran'
  amount NUMERIC(12, 2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  related_student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: documents (for Staff - Tata Usaha)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type TEXT NOT NULL, -- e.g., 'Surat Masuk', 'Surat Keluar'
  document_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, -- Subject or title
  sender_recipient TEXT, -- Sender (if incoming), Recipient (if outgoing)
  content TEXT, -- Summary or content
  file_url TEXT, -- Optional attachment URL
  status TEXT NOT NULL, -- e.g., 'Diterima', 'Didisposisikan', 'Terkirim', 'Draft'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add Indexes for performance
CREATE INDEX idx_user_details_user_id ON public.user_details(user_id);
CREATE INDEX idx_schedules_class_id ON public.schedules(class_id);
CREATE INDEX idx_schedules_teacher_id ON public.schedules(teacher_id);
CREATE INDEX idx_schedules_day ON public.schedules(day);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON public.submissions(student_id);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_grades_student_id ON public.grades(student_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- RLS Policies (Basic Examples - MUST BE REVIEWED AND CUSTOMIZED)
-- IMPORTANT: These are basic examples. You MUST tailor these policies
--            to your specific application logic and security requirements.

-- Example: user_details
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own details" ON public.user_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own details" ON public.user_details FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own details" ON public.user_details FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Add policy for Admins/Staff to view/manage details if needed

-- Example: announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT USING (
  auth.role() = 'authenticated' AND (target_role IS NULL OR target_role = (auth.jwt() ->> 'role'))
);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (
  (auth.jwt() ->> 'role') = 'Admin'
) WITH CHECK (
  (auth.jwt() ->> 'role') = 'Admin'
);

-- Example: assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage assignments for their subjects/classes" ON public.assignments FOR ALL USING (
    (auth.jwt() ->> 'role') = 'Guru' AND auth.uid() = teacher_id
    -- Maybe add class check? Depends on your logic.
) WITH CHECK (
    (auth.jwt() ->> 'role') = 'Guru' AND auth.uid() = teacher_id
);
-- Policy for students to view assignments (SELECT) needs class/subject relation check
-- CREATE POLICY "Students can view assignments for their class" ON public.assignments FOR SELECT USING (...);

-- Example: submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can submit to assignments" ON public.submissions FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'Siswa' AND auth.uid() = student_id
    -- Add check: student must belong to the assignment's class
);
CREATE POLICY "Students can view their own submissions" ON public.submissions FOR SELECT USING (
    auth.uid() = student_id
);
CREATE POLICY "Teachers can view/grade submissions for their assignments" ON public.submissions FOR ALL USING (
    (auth.jwt() ->> 'role') = 'Guru' AND auth.uid() = (SELECT teacher_id FROM public.assignments WHERE id = assignment_id)
) WITH CHECK (
    (auth.jwt() ->> 'role') = 'Guru' AND auth.uid() = (SELECT teacher_id FROM public.assignments WHERE id = assignment_id)
);

-- ... Add RLS policies for ALL other tables ...
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create default policies for other tables (restrictive initially)
-- CREATE POLICY "Default Deny All" ON public.some_table FOR ALL USING (false);
-- Then add specific policies to allow access based on roles.

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger function to tables with 'updated_at'
CREATE TRIGGER update_user_details_updated_at BEFORE UPDATE ON public.user_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventories_updated_at BEFORE UPDATE ON public.inventories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON public.finances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Grant basic usage on schema to authenticated users and anon role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant specific permissions (SELECT, INSERT, UPDATE, DELETE) based on RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Anon role usually shouldn't have direct write access unless specifically needed
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- Grant EXECUTE on functions if needed
-- GRANT EXECUTE ON FUNCTION public.your_function_name(arguments) TO authenticated;


-- Note: Supabase handles auth.users table automatically.
-- Ensure user roles ('Admin', 'Guru', 'Siswa', 'Tata Usaha', 'Kepala Sekolah')
-- are stored in the `auth.users` table's `raw_user_meta_data` field (e.g., {"role": "Admin"}).
-- The RLS policies above rely on this metadata.
