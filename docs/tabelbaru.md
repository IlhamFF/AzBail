-- docs/tabelbaru.md

-- Catatan: Tabel 'assignments', 'submissions', 'grades', dan 'audit_logs' sudah ada di database. Kode di bawah tidak menyertakan definisinya untuk tabel-tabel tersebut.
-- Tabel schedules (jika berbeda dari class_schedules atau sebagai tabel master jadwal)

-- Tabel schedules (jika berbeda dari class_schedules atau sebagai tabel master jadwal)
-- Jika schedules adalah tabel terpisah dari class_schedules,
-- bisa jadi ini adalah template jadwal atau jadwal global.
-- Jika schedules mereferensikan class_schedules atau sebaliknya,
-- perlu penyesuaian tergantung arsitektur spesifik.
-- Asumsi: Ini adalah tabel jadwal spesifik per kelas dan subjek
-- jika class_schedules belum mencakup detail jam/hari
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- Mengaitkan jadwal dengan kelas
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Sunday, 7=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$

 BEGIN
 NEW.updated_at = now();
 RETURN NEW;
 END; $$ language 'plpgsql';

CREATE TRIGGER update_schedules_updated_at
BEFORE UPDATE ON schedules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabel penghubung untuk Guru dan Mata Pelajaran (teacher_subjects)
-- Merepresentasikan relasi many-to-many: Satu guru mengajar banyak mapel, satu mapel diajar banyak guru
CREATE TABLE teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Menggunakan user_id dari user_details untuk mereferensikan guru
    -- Asumsi teacher_id di user_details merujuk ke user_details.id dari user ber-role guru
    teacher_id UUID REFERENCES user_details(id) ON DELETE CASCADE, 
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

    -- Constraint UNIQUE untuk memastikan kombinasi guru dan mapel adalah unik
    UNIQUE (teacher_id, subject_id) 
);

-- Trigger untuk updated_at (bisa menggunakan fungsi yang sudah ada)
CREATE TRIGGER update_teacher_subjects_updated_at
BEFORE UPDATE ON teacher_subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();