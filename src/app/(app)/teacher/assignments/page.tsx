
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
import { PlusCircle, FileText, Calendar as CalendarIcon, Edit, Trash2, AlertTriangle, Workflow, Loader2 } from 'lucide-react';
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
  file_url?: string | null; // Added to potentially display if assignment has attachment
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
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          deadline,
          file_url, 
          subjects (subject_name),
          classes (name)
        `)
        .eq('teacher_id', user.id)
        .order('deadline', { ascending: false });

      if (fetchError) {
        console.error("Error fetching assignments:", fetchError);
        let errorMessage = fetchError.message || 'Gagal memuat daftar tugas.';
        if (fetchError.details?.includes("could not find the relationship")) {
            errorMessage = `Gagal memuat daftar tugas: Tidak dapat menemukan relasi tabel di database (kemungkinan antara assignments, subjects, atau classes). Harap periksa foreign key Anda di Supabase. Detail: ${fetchError.message}`;
        }
        throw new Error(errorMessage);
      }
      
      const formattedAssignments = data?.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        deadline: a.deadline,
        file_url: a.file_url,
        subject_name: (a.subjects as { subject_name: string } | null)?.subject_name || 'Mapel Tidak Diketahui',
        class_name: (a.classes as { name: string } | null)?.name || 'Kelas Tidak Diketahui',
      })) || [];
      setAssignments(formattedAssignments);
    } catch (err: any) {
      console.error("Error in fetchAssignments processing:", err);
      setError(err.message);
      toast({ variant: 'destructive', title: 'Error Memuat Tugas', description: err.message });
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchFormData = async () => {
    if (!user?.id) return;
   setLoadingFormData(true);
   setError(null);
   try {
     const { data: scheduleData, error: scheduleError } = await supabase
        .from('class_schedules')
        .select('classes!inner(id, name), subjects!inner(id, subject_name)')
        .eq('teacher_id', user.id);

    if (scheduleError) {
        console.error("Supabase fetch scheduleData error:", scheduleError);
        throw scheduleError;
    }

    const uniqueClasses = new Map<string, Class>();
    const uniqueSubjects = new Map<string, Subject>();

    scheduleData?.forEach(item => {
        // Since we use !inner, classes and subjects should exist.
        const classItem = item.classes as Class;
        const subjectItem = item.subjects as Subject;
        if (classItem && !uniqueClasses.has(classItem.id)) uniqueClasses.set(classItem.id, classItem);
        if (subjectItem && !uniqueSubjects.has(subjectItem.id)) uniqueSubjects.set(subjectItem.id, subjectItem);
    });
    
    setTeacherSubjects(Array.from(uniqueSubjects.values()).sort((a,b) => a.subject_name.localeCompare(b.subject_name)));
    setTeacherClasses(Array.from(uniqueClasses.values()).sort((a,b) => a.name.localeCompare(b.name)));
 
   } catch (err: any) {
     console.error("Error fetching form data:", err);
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
        const filePath = `assignments/${user.id}/${subjectId}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('school-assignments')
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
          file_url: assignmentFileUrl,
        });
      
      if (insertError) throw insertError;

      toast({ title: 'Tugas Dibuat', description: 'Tugas berhasil dibuat dan ditugaskan.' });
      setTitle(''); setSubjectId(''); setClassId(''); setDeadline(undefined); setInstructions(''); setFile(null);
      fetchAssignments(); 
    } catch (err: any) {
      console.error("Error creating assignment:", err); 
      let errorMessage = 'Gagal membuat tugas.';
      if (err && err.message) { 
          errorMessage = `Gagal membuat tugas: ${err.message}`;
      } else if (typeof err === 'string') { 
          errorMessage = `Gagal membuat tugas: ${err}`;
      }

      toast({ variant: 'destructive', title: 'Gagal Membuat Tugas', description: errorMessage });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Kelola Tugas</h1>
      </div>
      
       {error && !loadingAssignments && !loadingFormData && ( // Show general error only if not specific loading
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
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                    {assignment.file_url && (
                        <a href={assignment.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-1 block">
                            Lihat Lampiran
                        </a>
                    )}
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
    
