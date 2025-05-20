-- This script sets up the complete database schema for the project in Supabase.
-- WARNING: This will DROP and recreate all specified tables, causing data loss.
-- REVIEW RLS POLICIES CAREFULLY BEFORE DEPLOYING TO PRODUCTION.

-- Enable uuid-ossp extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.teacher_schedules CASCADE;
DROP TABLE IF EXISTS public.student_schedules CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.teacher_subjects CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.user_details CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- Create roles table
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial roles (required for RLS policies)
INSERT INTO public.roles (role_name) VALUES
  ('Admin'),
  ('Guru'),
  ('Student');  -- Adjust role names as needed

-- Create user_details table
CREATE TABLE public.user_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  class_id UUID, -- Will add foreign key later due to circular dependency
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  homeroom_teacher_id UUID REFERENCES public.user_details(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to user_details for class_id
ALTER TABLE public.user_details
ADD CONSTRAINT user_details_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL UNIQUE,
  subject_code TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create teacher_subjects join table
CREATE TABLE public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE (teacher_id, subject_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_role UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create student_schedules table
CREATE TABLE public.student_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  day TEXT NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create teacher_schedules table
CREATE TABLE public.teacher_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  day TEXT NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  recorded_by UUID REFERENCES public.user_details(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.user_details(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  file_url TEXT,
  upload_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.user_details(id) ON DELETE SET NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.user_details(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  assessment_type TEXT,
  score NUMERIC,
  feedback TEXT,
  graded_by UUID REFERENCES public.user_details(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at_column trigger to tables
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_details_updated_at BEFORE UPDATE ON public.user_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_subjects_updated_at BEFORE UPDATE ON public.teacher_subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_schedules_updated_at BEFORE UPDATE ON public.student_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_schedules_updated_at BEFORE UPDATE ON public.teacher_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (REVIEW CAREFULLY)

-- roles: Admins can see all roles
CREATE POLICY "Admins can view all roles" ON public.roles
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- user_details: Users can view/update their own details; Admins can manage all
CREATE POLICY "Users can view their own details" ON public.user_details
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own details" ON public.user_details
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all user details" ON public.user_details
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- classes: Students can view their classes; Teachers can view classes they teach; Admins can manage all
CREATE POLICY "Students can view their classes" ON public.classes
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_details ud WHERE ud.user_id = auth.uid() AND ud.class_id = id));

CREATE POLICY "Teachers can view classes they teach or homeroom" ON public.classes
FOR SELECT TO authenticated
USING (homeroom_teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all classes" ON public.classes
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- subjects: All authenticated users can view; Admins/Teachers can manage
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and Teachers can manage subjects" ON public.subjects
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name IN ('Admin', 'Guru')
));

-- teacher_subjects: Teachers can view/manage their subjects; Admins can manage all
CREATE POLICY "Teachers can view their assigned subjects" ON public.teacher_subjects
FOR SELECT TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can manage their assigned subjects" ON public.teacher_subjects
FOR ALL TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all teacher subjects" ON public.teacher_subjects
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- announcements: All can view; Admins/Teachers can manage
CREATE POLICY "Authenticated users can view announcements" ON public.announcements
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins and Teachers can manage announcements" ON public.announcements
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name IN ('Admin', 'Guru')
));

-- student_schedules: Students can view their schedules; Teachers can view their classes' schedules; Admins can manage all
CREATE POLICY "Students can view their own schedules" ON public.student_schedules
FOR SELECT TO authenticated
USING (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view schedules for their classes" ON public.student_schedules
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
) AND EXISTS (
  SELECT 1 FROM public.classes c
  WHERE c.id = class_id AND (c.homeroom_teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.teacher_subjects ts2
    JOIN public.user_details ud2 ON ts2.teacher_id = ud2.id
    WHERE ud2.user_id = auth.uid() AND ts2.subject_id = subject_id AND c.homeroom_teacher_id IS NULL
  ))
));

CREATE POLICY "Admins can manage all student schedules" ON public.student_schedules
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- teacher_schedules: Teachers can view/manage their schedules; Admins can manage all
CREATE POLICY "Teachers can view their own schedules" ON public.teacher_schedules
FOR SELECT TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can manage their own schedules" ON public.teacher_schedules
FOR ALL TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all teacher schedules" ON public.teacher_schedules
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- attendance: Students can view their attendance; Teachers can manage their classes' attendance; Admins can manage all
CREATE POLICY "Students can view their own attendance" ON public.attendance
FOR SELECT TO authenticated
USING (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view attendance for their classes" ON public.attendance
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
) AND EXISTS (
  SELECT 1 FROM public.classes c
  WHERE c.id = class_id AND (c.homeroom_teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.teacher_subjects ts2
    JOIN public.user_details ud2 ON ts2.teacher_id = ud2.id
    WHERE ud2.user_id = auth.uid() AND ts2.subject_id = subject_id AND c.homeroom_teacher_id IS NULL
  ))
));

CREATE POLICY "Teachers can record/manage attendance for their classes" ON public.attendance
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
) AND EXISTS (
  SELECT 1 FROM public.classes c
  WHERE c.id = class_id AND (c.homeroom_teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.teacher_subjects ts2
    JOIN public.user_details ud2 ON ts2.teacher_id = ud2.id
    WHERE ud2.user_id = auth.uid() AND ts2.subject_id = subject_id AND c.homeroom_teacher_id IS NULL
  ))
)) WITH CHECK (recorded_by = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all attendance" ON public.attendance
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- materials: Students can view their class materials; Teachers can manage their materials; Admins can manage all
CREATE POLICY "Students can view materials for their classes/subjects" ON public.materials
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_details ud WHERE ud.user_id = auth.uid() AND ud.class_id = class_id));

CREATE POLICY "Teachers can view materials for their classes/subjects" ON public.materials
FOR SELECT TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
));

CREATE POLICY "Teachers can manage materials for their classes/subjects" ON public.materials
FOR ALL TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
)) WITH CHECK (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all materials" ON public.materials
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- assignments: Students can view their class assignments; Teachers can manage their assignments; Admins can manage all
CREATE POLICY "Students can view assignments for their classes/subjects" ON public.assignments
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_details ud WHERE ud.user_id = auth.uid() AND ud.class_id = class_id));

CREATE POLICY "Teachers can view assignments for their classes/subjects" ON public.assignments
FOR SELECT TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
));

CREATE POLICY "Teachers can manage assignments for their classes/subjects" ON public.assignments
FOR ALL TO authenticated
USING (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()) OR EXISTS (
  SELECT 1 FROM public.teacher_subjects ts
  JOIN public.user_details ud ON ts.teacher_id = ud.id
  WHERE ud.user_id = auth.uid() AND ts.subject_id = subject_id
)) WITH CHECK (teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all assignments" ON public.assignments
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- submissions: Students can manage their submissions; Teachers can view their assignments' submissions; Admins can manage all
CREATE POLICY "Students can view their own submissions" ON public.submissions
FOR SELECT TO authenticated
USING (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Students can create/update their own submissions" ON public.submissions
FOR ALL TO authenticated
USING (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()))
WITH CHECK (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view submissions for their assignments" ON public.submissions
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid())));

CREATE POLICY "Admins can manage all submissions" ON public.submissions
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- grades: Students can view their grades; Teachers can manage their assignments' grades; Admins can manage all
CREATE POLICY "Students can view their own grades" ON public.grades
FOR SELECT TO authenticated
USING (student_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view grades for their assignments/classes" ON public.grades
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid())));

CREATE POLICY "Teachers can create/update grades for their assignments/classes" ON public.grades
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.teacher_id = (SELECT id FROM public.user_details WHERE user_id = auth.uid())))
WITH CHECK (graded_by = (SELECT id FROM public.user_details WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all grades" ON public.grades
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));

-- audit_logs: Only Admins can view
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_details ud
  JOIN public.roles r ON ud.role_id = r.id
  WHERE ud.user_id = auth.uid() AND r.role_name = 'Admin'
));