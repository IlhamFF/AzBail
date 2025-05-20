
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, AlertTriangle, Users, Loader2, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

interface StudentForAttendance {
  id: string; // user_details.id for student
  user_id: string; // auth.users.id for student
  full_name: string;
  nis: string | null;
  current_status: AttendanceStatus | null; // Will be populated from existing records or default
}

interface TeacherSubject {
  id: string;
  subject_name: string;
}

interface TeacherClass {
  id: string;
  name: string;
}

export default function TeacherAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [students, setStudents] = useState<StudentForAttendance[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});

  const [loadingDropdownData, setLoadingDropdownData] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch classes and subjects teacher is associated with
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
        setError(err.message || "Gagal memuat data kelas/mapel.");
        toast({ variant: "destructive", title: "Error Data", description: err.message });
      } finally {
        setLoadingDropdownData(false);
      }
    };
    if (!authLoading && user) {
      fetchDropdownData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Fetch students when class, subject, and date are selected
  useEffect(() => {
    const fetchStudentsForAttendance = async () => {
      if (!selectedClassId || !selectedSubjectId || !selectedDate || !user?.id) {
        setStudents([]);
        setAttendance({});
        return;
      }
      setLoadingStudents(true);
      setError(null);
      setAttendance({}); // Reset attendance for new selection
      try {
        // 1. Fetch students in the selected class
        const { data: studentDetails, error: studentError } = await supabase
          .from('user_details')
          .select('id, user_id, full_name, nis')
          .eq('class_id', selectedClassId)
          .eq('role', 'Siswa') // Make sure role is correctly stored
          .order('full_name', { ascending: true });

        if (studentError) throw studentError;
        if (!studentDetails) {
            setStudents([]);
            setLoadingStudents(false);
            return;
        }

        // 2. Fetch existing attendance records for these students, subject, and date
        const studentUserIds = studentDetails.map(s => s.user_id);
        let existingRecordsMap = new Map<string, AttendanceStatus>();

        if (studentUserIds.length > 0) {
            const { data: attendanceRecords, error: attendanceError } = await supabase
              .from('attendance')
              .select('student_id, status')
              .in('student_id', studentUserIds)
              .eq('subject_id', selectedSubjectId)
              .eq('date', format(selectedDate, 'yyyy-MM-dd'));

            if (attendanceError) throw attendanceError;
            attendanceRecords?.forEach(rec => {
                existingRecordsMap.set(rec.student_id, rec.status as AttendanceStatus);
            });
        }
        
        const studentsWithStatus: StudentForAttendance[] = studentDetails.map(s => ({
          id: s.id, // user_details.id
          user_id: s.user_id, // auth.users.id
          full_name: s.full_name,
          nis: s.nis,
          current_status: existingRecordsMap.get(s.user_id) || null,
        }));

        setStudents(studentsWithStatus);
        // Pre-fill attendance state from existing records
        const initialAttendanceState: Record<string, AttendanceStatus | null> = {};
        studentsWithStatus.forEach(s => {
            initialAttendanceState[s.user_id] = s.current_status;
        });
        setAttendance(initialAttendanceState);

      } catch (err: any) {
        setError(err.message || "Gagal memuat daftar siswa.");
        toast({ variant: "destructive", title: "Error Siswa", description: err.message });
      } finally {
        setLoadingStudents(false);
      }
    };

    if (selectedClassId && selectedSubjectId && selectedDate) {
      fetchStudentsForAttendance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, selectedSubjectId, selectedDate, user?.id]);

  const handleStatusChange = (studentUserId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentUserId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedDate || !user?.id || students.length === 0) {
      toast({ variant: "destructive", title: "Input Tidak Lengkap", description: "Pilih kelas, mapel, tanggal, dan pastikan ada siswa." });
      return;
    }
    setIsSaving(true);
    try {
      const recordsToUpsert = students.map(student => {
        const status = attendance[student.user_id];
        if (!status) { // If no status selected, default to 'Alpa' or skip
             // Decide on a default or throw error if all must be selected
             // For now, let's default to 'Alpa' if nothing is selected
            return {
                student_id: student.user_id, // Use auth.users.id
                class_id: selectedClassId,
                subject_id: selectedSubjectId,
                date: format(selectedDate, 'yyyy-MM-dd'),
                status: 'Alpa' as AttendanceStatus,
                recorded_by: user.id, // teacher's auth.users.id
            };
        }
        return {
          student_id: student.user_id, // Use auth.users.id
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status: status,
          recorded_by: user.id, // teacher's auth.users.id
        };
      });

      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(recordsToUpsert, { onConflict: 'student_id,date,subject_id,class_id' }); // Adjust onConflict as needed

      if (upsertError) throw upsertError;

      toast({ title: "Absensi Disimpan", description: "Data kehadiran berhasil disimpan." });
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan absensi.");
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Input Absensi Siswa</h1>

      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas, Mata Pelajaran, dan Tanggal</CardTitle>
          <CardDescription>Pilih detail untuk merekam absensi.</CardDescription>
          {loadingDropdownData ? <Skeleton className="h-28 w-full mt-4" /> : (
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: LocaleID }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <CardTitle className="text-xl mb-4">Daftar Siswa</CardTitle>
          {loadingStudents ? <Skeleton className="h-60 w-full" /> : students.length === 0 && selectedClassId ? (
            <div className="text-center text-muted-foreground py-10">
              <div className="flex flex-col items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground mb-2" />
                Tidak ada siswa di kelas ini atau filter belum lengkap.
              </div>
            </div>
          ) : !selectedClassId ? (
             <div className="text-center text-muted-foreground py-10">Pilih kelas, mata pelajaran, dan tanggal untuk menampilkan siswa.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-right">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell>{student.nis || '-'}</TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup
                          value={attendance[student.user_id] ?? undefined}
                          onValueChange={(value) => handleStatusChange(student.user_id, value as AttendanceStatus)}
                          className="flex justify-end space-x-2 sm:space-x-4"
                        >
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as AttendanceStatus[]).map(statusOption => (
                            <div key={statusOption} className="flex items-center space-x-1 sm:space-x-2">
                              <RadioGroupItem value={statusOption} id={`${statusOption}-${student.user_id}`} />
                              <Label htmlFor={`${statusOption}-${student.user_id}`} className="text-xs">{statusOption}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAttendance} disabled={isSaving || loadingStudents || students.length === 0}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Menyimpan...' : <><CheckCircle className="mr-2 h-4 w-4" /> Simpan Absensi</>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    