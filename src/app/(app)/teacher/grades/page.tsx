
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Users, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StudentForGrading {
  id: string; // user_details.id
  user_id: string; // auth.users.id
  full_name: string;
  nis: string | null;
  current_grade: number | null;
  grade_id: string | null; // existing grade id if any
}

interface TeacherSubject {
  id: string;
  subject_name: string;
}

interface TeacherClass {
  id: string;
  name: string;
}

// Example assessment types, can be fetched from DB or config
const assessmentTypes = [
  "Ulangan Harian 1", "Ulangan Harian 2", "Tugas Mandiri", 
  "UTS", "UAS", "Proyek Akhir"
];

export default function TeacherGradesPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<string>('');
  
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [students, setStudents] = useState<StudentForGrading[]>([]);
  const [grades, setGrades] = useState<Record<string, number | null>>({}); // student_user_id -> grade

  const [loadingDropdownData, setLoadingDropdownData] = useState(true);
  const [loadingStudentsAndGrades, setLoadingStudentsAndGrades] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes and subjects for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!user?.id) return;
      setLoadingDropdownData(true);
      setError(null);
      try {
         const { data: scheduleData, error: scheduleError } = await supabase
          .from('class_schedules')
          .select('classes (id, name), subjects (id, subject_name)')
          .eq('teacher_id', user.id);

        if (scheduleError) throw scheduleError;

        const uniqueClasses = new Map<string, TeacherClass>();
        const uniqueSubjects = new Map<string, TeacherSubject>();

        scheduleData?.forEach(item => {
          const classItem = item.classes as TeacherClass;
          const subjectItem = item.subjects as TeacherSubject;
          if (classItem && !uniqueClasses.has(classItem.id)) uniqueClasses.set(classItem.id, classItem);
          if (subjectItem && !uniqueSubjects.has(subjectItem.id)) uniqueSubjects.set(subjectItem.id, subjectItem);
        });
        
        setTeacherClasses(Array.from(uniqueClasses.values()).sort((a,b) => a.name.localeCompare(b.name)));
        setTeacherSubjects(Array.from(uniqueSubjects.values()).sort((a,b) => a.subject_name.localeCompare(b.subject_name)));
      } catch (err: any) {
        setError(err.message || "Gagal memuat data kelas/mapel untuk form.");
        toast({ variant: "destructive", title: "Error Data Dropdown", description: err.message });
      } finally {
        setLoadingDropdownData(false);
      }
    };
    if (!authLoading && user) {
      fetchDropdownData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Fetch students and their existing grades when class, subject, and assessment type change
  useEffect(() => {
    const fetchStudentsAndGrades = async () => {
      if (!selectedClassId || !selectedSubjectId || !selectedAssessmentType || !user?.id) {
        setStudents([]);
        setGrades({});
        return;
      }
      setLoadingStudentsAndGrades(true);
      setError(null);
      setGrades({});
      try {
        // 1. Fetch students in the selected class
        const { data: studentDetails, error: studentError } = await supabase
          .from('user_details')
          .select('id, user_id, full_name, nis')
          .eq('class_id', selectedClassId)
          .eq('role', 'Siswa')
          .order('full_name', { ascending: true });

        if (studentError) throw studentError;
        if (!studentDetails) {
             setStudents([]);
             setLoadingStudentsAndGrades(false);
             return;
        }

        // 2. Fetch existing grades
        const studentUserIds = studentDetails.map(s => s.user_id);
        let existingGradesMap = new Map<string, { score: number | null, id: string }>();

        if (studentUserIds.length > 0) {
            const { data: gradeRecords, error: gradeError } = await supabase
              .from('grades')
              .select('id, student_id, score')
              .in('student_id', studentUserIds)
              .eq('subject_id', selectedSubjectId)
              .eq('assessment_type', selectedAssessmentType)
              .eq('class_id', selectedClassId); // Assuming grades are tied to a class

            if (gradeError) throw gradeError;
            gradeRecords?.forEach(rec => {
                existingGradesMap.set(rec.student_id, { score: rec.score, id: rec.id });
            });
        }
        
        const studentsWithGrades: StudentForGrading[] = studentDetails.map(s => {
            const existingGrade = existingGradesMap.get(s.user_id);
            return {
                id: s.id,
                user_id: s.user_id,
                full_name: s.full_name,
                nis: s.nis,
                current_grade: existingGrade?.score ?? null,
                grade_id: existingGrade?.id ?? null,
            };
        });

        setStudents(studentsWithGrades);
        const initialGrades: Record<string, number | null> = {};
        studentsWithGrades.forEach(s => {
            initialGrades[s.user_id] = s.current_grade;
        });
        setGrades(initialGrades);

      } catch (err: any) {
        setError(err.message || "Gagal memuat daftar siswa atau nilai.");
        toast({ variant: "destructive", title: "Error Data Siswa/Nilai", description: err.message });
      } finally {
        setLoadingStudentsAndGrades(false);
      }
    };

    if (selectedClassId && selectedSubjectId && selectedAssessmentType) {
      fetchStudentsAndGrades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSubjectId, selectedAssessmentType, user?.id]);

  const handleGradeChange = (studentUserId: string, value: string) => {
    const score = value === '' ? null : parseInt(value, 10);
    if (score === null || (score >= 0 && score <= 100)) {
      setGrades(prev => ({ ...prev, [studentUserId]: score }));
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedAssessmentType || !user?.id || students.length === 0) {
      toast({ variant: "destructive", title: "Input Tidak Lengkap", description: "Pilih kelas, mapel, jenis penilaian, dan pastikan ada siswa." });
      return;
    }
    setIsSaving(true);
    try {
      const recordsToUpsert = students
        .map(student => {
            const score = grades[student.user_id];
            // Only upsert if a grade has been entered or changed, or if it's a new entry
            // This logic might need refinement based on whether you want to save nulls or only actual scores
            if (score !== undefined) { // score can be null if user clears input
                 return {
                    id: student.grade_id, // Pass existing grade_id for upsert to update
                    student_id: student.user_id, // auth.users.id
                    class_id: selectedClassId,
                    subject_id: selectedSubjectId,
                    assessment_type: selectedAssessmentType,
                    score: score,
                    graded_by: user.id, // teacher's auth.users.id
                 };
            }
            return null;
        })
        .filter(record => record !== null) as any[]; // Filter out nulls if any

      if (recordsToUpsert.length === 0) {
        toast({ title: "Tidak Ada Perubahan", description: "Tidak ada nilai baru atau perubahan nilai untuk disimpan." });
        setIsSaving(false);
        return;
      }
      
      const { error: upsertError } = await supabase
        .from('grades')
        .upsert(recordsToUpsert, { onConflict: 'id' }); // Upsert based on grade ID

      if (upsertError) throw upsertError;

      toast({ title: "Nilai Disimpan", description: "Data nilai berhasil disimpan." });
      // Optionally re-fetch grades to confirm and update student.grade_id for new entries
      // For simplicity, we'll assume the UI reflects the saved state.
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan nilai.");
      toast({ variant: "destructive", title: "Gagal Menyimpan Nilai", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Input Nilai Siswa</h1>
      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas, Mata Pelajaran, dan Penilaian</CardTitle>
          <CardDescription>Pilih detail untuk mulai input nilai.</CardDescription>
          {loadingDropdownData ? <Skeleton className="h-28 w-full mt-4"/> : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  {teacherClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}
                  {teacherClasses.length === 0 && <div className="p-2 text-sm text-muted-foreground">Tidak ada kelas.</div>}
                </SelectContent>
              </Select>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>)}
                  {teacherSubjects.length === 0 && <div className="p-2 text-sm text-muted-foreground">Tidak ada mapel.</div>}
                </SelectContent>
              </Select>
              <Select value={selectedAssessmentType} onValueChange={setSelectedAssessmentType}>
                <SelectTrigger><SelectValue placeholder="Pilih Penilaian" /></SelectTrigger>
                <SelectContent>
                  {assessmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <CardTitle className="text-xl mb-4">Daftar Siswa</CardTitle>
          {loadingStudentsAndGrades ? <Skeleton className="h-60 w-full" /> : students.length === 0 && selectedClassId && selectedSubjectId && selectedAssessmentType ? (
            <div className="text-center text-muted-foreground py-10">
              <div className="flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground mb-2" />
                 Tidak ada siswa di kelas ini atau filter belum lengkap.
              </div>
            </div>
          ) : !selectedClassId || !selectedSubjectId || !selectedAssessmentType ? (
             <div className="text-center text-muted-foreground py-10">Pilih kelas, mata pelajaran, dan jenis penilaian untuk menampilkan siswa.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="w-[120px] text-right">Nilai (0-100)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell>{student.nis || '-'}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          className="h-8 text-right"
                          value={grades[student.user_id] === null ? '' : grades[student.user_id] ?? ''}
                          onChange={(e) => handleGradeChange(student.user_id, e.target.value)}
                          placeholder="-"
                          disabled={isSaving}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveGrades} disabled={isSaving || loadingStudentsAndGrades || students.length === 0}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Menyimpan...' : <><Save className="mr-2 h-4 w-4" /> Simpan Nilai</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    