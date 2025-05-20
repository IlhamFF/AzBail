
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileText, Edit, Trash2, AlertTriangle, Workflow } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';

interface Material {
  id: string;
  title: string;
  subject_name: string;
  class_name: string;
  file_url: string;
  upload_date: string;
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

export default function TeacherMaterialsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [uploadedMaterials, setUploadedMaterials] = useState<Material[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<Class[]>([]); // Classes the teacher is homeroom for
  
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [loadingFormData, setLoadingFormData] = useState(true); // For subjects and classes
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState(''); // 'all' or specific class ID
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);


  const fetchUploadedMaterials = async () => {
    if (!user?.id) return;
    setLoadingMaterials(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('materials')
        .select(`
          id,
          title,
          description,
          file_url,
          upload_date,
          subjects (subject_name),
          classes (name)
        `)
        .eq('teacher_id', user.id)
        .order('upload_date', { ascending: false });

      if (fetchError) throw fetchError;
      
      const formattedMaterials = data?.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        file_url: m.file_url,
        upload_date: m.upload_date,
        subject_name: (m.subjects as any)?.subject_name || 'N/A',
        class_name: (m.classes as any)?.name || 'Semua Kelas',
      })) || [];
      setUploadedMaterials(formattedMaterials);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat materi yang sudah diupload.');
      toast({ variant: 'destructive', title: 'Error Materi', description: err.message });
    } finally {
      setLoadingMaterials(false);
    }
  };

  const fetchFormData = async () => {
    if (!user?.id) return;
    setLoadingFormData(true);
    try {
      // Fetch subjects taught by the teacher (e.g., from class_schedules or a dedicated teacher_subjects table)
      // For simplicity, let's assume teacher can upload for any subject they are associated with via class_schedules
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
      setError(err.message || 'Gagal memuat data untuk form.');
      toast({ variant: 'destructive', title: 'Error Data Form', description: err.message });
    } finally {
      setLoadingFormData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchUploadedMaterials();
      fetchFormData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !subjectId || !classId || !user?.id) {
      toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Mohon isi semua field yang wajib.' });
      return;
    }
    setIsUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const filePath = `materials/${user.id}/${subjectId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('school-materials') // **Pastikan bucket ini ada dan memiliki kebijakan yang benar**
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error('Gagal mendapatkan path file setelah upload.');

      // 2. Get public URL (atau path jika Anda mengkonstruksi URL di client)
      const { data: urlData } = supabase.storage
        .from('school-materials')
        .getPublicUrl(uploadData.path);
        
      if (!urlData?.publicUrl) throw new Error('Gagal mendapatkan URL publik file.');

      // 3. Insert metadata into 'materials' table
      const { error: insertError } = await supabase
        .from('materials')
        .insert({
          title,
          description,
          subject_id: subjectId,
          class_id: classId === 'all' ? null : classId, // Simpan null jika untuk semua kelas
          teacher_id: user.id,
          file_url: urlData.publicUrl,
          upload_date: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({ title: 'Upload Berhasil', description: 'Materi pelajaran berhasil diupload.' });
      // Reset form
      setTitle(''); setSubjectId(''); setClassId(''); setFile(null); setDescription('');
      fetchUploadedMaterials(); // Refresh list
    } catch (err: any) {
      console.error("Error uploading material:", err);
      toast({ variant: 'destructive', title: 'Upload Gagal', description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  // TODO: Implement edit and delete functions

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Upload Materi Pelajaran</h1>

      {error && (
         <Alert variant="destructive" className="mb-4">
           <AlertTriangle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}

      <Card>
        <CardHeader>
          <CardTitle>Form Upload Materi</CardTitle>
          <CardDescription>Unggah materi pelajaran untuk siswa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingFormData ? <Skeleton className="h-40 w-full" /> : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Materi</Label>
                  <Input id="title" placeholder="Contoh: Modul Bab 1" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
                      <SelectItem value="all">Semua Kelas (Umum)</SelectItem>
                      {teacherClasses.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>)}
                       {teacherClasses.length === 0 && <div className="p-2 text-sm text-muted-foreground">Tidak ada kelas.</div>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Pilih File</Label>
                  <Input id="file-upload" type="file" className="pt-1.5" onChange={handleFileChange} required />
                  {file && <p className="text-xs text-muted-foreground">File dipilih: {file.name}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea id="description" placeholder="Deskripsi singkat tentang materi..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isUploading || loadingFormData}>
                  {isUploading && <UploadCloud className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? 'Mengunggah...' : <><UploadCloud className="mr-2 h-4 w-4" /> Upload Materi</>}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materi yang Sudah Diupload</CardTitle>
          <CardDescription>Daftar materi yang telah Anda unggah.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMaterials ? <Skeleton className="h-40 w-full" /> : uploadedMaterials.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <div className="flex flex-col items-center justify-center">
                  <Workflow className="h-12 w-12 text-muted-foreground mb-2" />
                  Belum ada materi yang diupload.
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {uploadedMaterials.map(material => (
                <Card key={material.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 flex-shrink-0" /> {material.title}</CardTitle>
                    <CardDescription>
                      Mapel: {material.subject_name} • Kelas: {material.class_name}
                      {material.description && <p className="text-xs mt-1">Deskripsi: {material.description}</p>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Diupload: {format(new Date(material.upload_date), "dd MMM yyyy, HH:mm", { locale: LocaleID })}</p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    