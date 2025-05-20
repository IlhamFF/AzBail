
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';
import { PlusCircle, FileText, Calendar as CalendarIcon, Edit, Trash2, AlertTriangle, Workflow } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


interface Assignment {
  id: string;
  title: string;
  subject_name: string;
  class_name: string;
  deadline: string;
  description?: string | null;
}

interface Subject {
  id: string;
  subject_name: string;
}

interface Class {
  id: string;
  name: string;
}


export default function TeacherAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingFormData, setLoadingFormData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [instructions, setInstructions] = useState('');
  const [file, setFile] = useState<File | null>(null); // For assignment attachment
  const [isCreating, setIsCreating] = useState(false);

  const fetchAssignments = async () => {
    if (!user?.id) return;
    setLoadingAssignments(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          deadline,
          subjects (subject_name),
          classes (name)
        `)
        .eq('teacher_id', user.id)
        .order('deadline', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formattedAssignments = data?.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        deadline: a.deadline,
        subject_name: (a.subjects as any)?.subject_name || 'N/A',
        class_name: (a.classes as any)?.name || 'N/A',
      })) || [];
      setAssignments(formattedAssignments);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar tugas.');
      toast({ variant: 'destructive', title: 'Error Tugas', description: err.message });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchFormData = async () => {
     if (!user?.id) return;
    setLoadingFormData(true);
    try {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('subjects (id, subject_name), classes (id, name)')
        .eq('teacher_id', user.id);

      if (scheduleError) throw scheduleError;

      const uniqueSubjects: Subject[] = [];
      const subjectMap = new Map<string, Subject>();
      const uniqueClasses: Class[] = [];
      const classMap = new Map<string, Class>();

      scheduleData?.forEach(item => {
        const subject = item.subjects as Subject;
        const classItem = item.classes as Class;
        if (subject && !subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, subject);
          uniqueSubjects.push(subject);
        }
        if (classItem && !classMap.has(classItem.id)) {
            classMap.set(classItem.id, classItem);
            uniqueClasses.push(classItem);
        }
      });
      setTeacherSubjects(uniqueSubjects.sort((a, b) => a.subject_name.localeCompare(b.subject_name)));
      setTeacherClasses(uniqueClasses.sort((a,b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data untuk form tugas.');
      toast({ variant: 'destructive', title: 'Error Data Form', description: err.message });
    } finally {
      setLoadingFormData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAssignments();
      fetchFormData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !classId || !deadline || !instructions || !user?.id) {
      toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Mohon isi semua field yang wajib.' });
      return;
    }
    setIsCreating(true);
    try {
      let assignmentFileUrl: string | null = null;
      if (file) {
        // Upload file to Supabase Storage
        const filePath = `assignments/${user.id}/${subjectId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('school-assignments') // **Pastikan bucket ini ada**
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error('Gagal upload file tugas.');
        
        const { data: urlData } = supabase.storage
            .from('school-assignments')
            .getPublicUrl(uploadData.path);
        if(!urlData?.publicUrl) throw new Error('Gagal mendapatkan URL publik file tugas.');
        assignmentFileUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('assignments')
        .insert({
          title,
          description: instructions,
          subject_id: subjectId,
          class_id: classId,
          teacher_id: user.id,
          deadline: deadline.toISOString(),
          file_url: assignmentFileUrl, // Kolom untuk menyimpan URL file tugas
        });
      
      if (insertError) throw insertError;

      toast({ title: 'Tugas Dibuat', description: 'Tugas berhasil dibuat dan ditugaskan.' });
      // Reset form
      setTitle(''); setSubjectId(''); setClassId(''); setDeadline(undefined); setInstructions(''); setFile(null);
      fetchAssignments(); // Refresh list
    } catch (err: any) {
      console.error("Error creating assignment:", err);
      toast({ variant: 'destructive', title: 'Gagal Membuat Tugas', description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Kelola Tugas</h1>
      </div>
      
       {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Form Buat Tugas Baru</CardTitle>
          <CardDescription>Isi detail tugas yang akan diberikan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingFormData ? <Skeleton className="h-60 w-full" /> : (
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Tugas</Label>
                  <Input id="title" placeholder="Contoh: Latihan Soal Bab 1" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Mata Pelajaran</Label>
                  <Select value={subjectId} onValueChange={setSubjectId} required>
                    <SelectTrigger id="subject"><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
                    <SelectContent>
                      {teacherSubjects.map(sub => <SelectItem key={sub.id} value={sub.id}>{sub.subject_name}</SelectItem>)}
                      {teacherSubjects.length === 0 && <div className="p-2 text-sm text-muted-foreground">Tidak ada mapel.</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Target Kelas</Label>
                  <Select value={classId} onValueChange={setClassId} required>
                    <SelectTrigger id="class"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                      {teacherClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}
                      {teacherClasses.length === 0 && <div className="p-2 text-sm text-muted-foreground">Tidak ada kelas.</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline-picker">Batas Waktu Pengumpulan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="deadline-picker"
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadline ? format(deadline, "PPP HH:mm", { locale: LocaleID }) : <span>Pilih tanggal & waktu</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                       {/* Time input could be added here if needed, or use a DateTimePicker component */}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruksi Tugas</Label>
                <Textarea id="instructions" placeholder="Jelaskan instruksi tugas di sini..." value={instructions} onChange={(e) => setInstructions(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment-file">Lampiran File (Opsional)</Label>
                <Input id="assignment-file" type="file" className="pt-1.5" onChange={handleFileChange} />
                 {file && <p className="text-xs text-muted-foreground">File dipilih: {file.name}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isCreating || loadingFormData}>
                  {isCreating && <PlusCircle className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreating ? 'Menyimpan...' : <><PlusCircle className="mr-2 h-4 w-4" /> Simpan Tugas</>}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas yang Diberikan</CardTitle>
          <CardDescription>Lihat dan kelola tugas yang telah Anda buat.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAssignments ? <Skeleton className="h-40 w-full" /> : assignments.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
               <div className="flex flex-col items-center justify-center">
                  <Workflow className="h-12 w-12 text-muted-foreground mb-2" />
                  Belum ada tugas yang dibuat.
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {assignments.map(assignment => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 flex-shrink-0" /> {assignment.title}</CardTitle>
                    <CardDescription>Mapel: {assignment.subject_name} • Kelas: {assignment.class_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Batas Waktu: {format(new Date(assignment.deadline), "dd MMM yyyy, HH:mm", { locale: LocaleID })}</p>
                    {assignment.description && <p className="text-sm mt-1 line-clamp-2">Deskripsi: {assignment.description}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled>Lihat Pengumpulan</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled><Trash2 className="h-4 w-4" /></Button>
                  </CardFooter>
                </Card>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    