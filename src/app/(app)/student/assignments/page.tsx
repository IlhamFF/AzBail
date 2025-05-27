
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isPast } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';
import { FileText, Clock, CheckCircle, AlertCircle, Upload, Loader2, CalendarX, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AssignmentStatus = 'Belum Dikumpulkan' | 'Sudah Dikumpulkan' | 'Terlambat' | 'Dinilai';

interface Submission {
  id: string;
  file_url?: string | null;
  submitted_at: string; // ISO string
  grade?: number | null;
  feedback?: string | null;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  created_at: string; // ISO string
  subject_name: string;
  teacher_name: string;
  status: AssignmentStatus;
  submission_details: {
    fileUrl?: string | null;
    submittedAt?: Date | null;
    grade?: number | null;
    feedback?: string | null;
  } | null;
}

export default function StudentAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [fileToSubmit, setFileToSubmit] = useState<File | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);

  const determineAssignmentStatus = (assignmentDeadline: string, submission: Submission | null): AssignmentStatus => {
    const deadlineDate = new Date(assignmentDeadline);
    if (submission) {
      if (submission.grade !== null && submission.grade !== undefined) {
        return 'Dinilai';
      }
      return 'Sudah Dikumpulkan';
    }
    if (isPast(deadlineDate)) {
      return 'Terlambat';
    }
    return 'Belum Dikumpulkan';
  };

  useEffect(() => {
    const fetchStudentAssignments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Get student's class_id
        const { data: studentClassData, error: studentClassError } = await supabase
          .from('student_schedules')
          .select('class_id')
          .eq('student_id', user.id)
          .limit(1)
          .maybeSingle();

        if (studentClassError) throw studentClassError;

        if (!studentClassData?.class_id) {
          setAssignments([]);
          setLoading(false);
          return;
        }
        const studentClassId = studentClassData.class_id;

        // 2. Fetch assignments for that class, joining with subjects and users (for teacher's name)
        // This query structure assumes `assignments.teacher_id` is an FK to `auth.users.id`
        // AND `user_details` has a `user_id` column that is an FK to `auth.users.id`
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            id,
            title,
            description,
            deadline,
            created_at,
            subjects ( subject_name ),
            users!assignments_teacher_id_fkey ( id, user_details ( full_name ) )
          `)
          .eq('class_id', studentClassId)
          .order('deadline', { ascending: true });
        
        if (assignmentsError) {
            let detailedMessage = `Gagal mengambil data tugas: ${assignmentsError.message}`;
            if (assignmentsError.details?.includes("relationship") && assignmentsError.details?.includes("assignments_teacher_id_fkey")) {
                detailedMessage += " (Pastikan ada foreign key dari 'assignments.teacher_id' ke 'auth.users.id' dan 'user_details.user_id' ke 'auth.users.id' untuk mengambil nama guru.)";
            } else if (assignmentsError.details?.includes("relationship")) {
                 detailedMessage += " (Periksa relasi foreign key di tabel 'assignments' ke 'subjects' atau 'classes'.)";
            }
            throw new Error(detailedMessage);
        }
        
        if (!assignmentsData) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        // 3. Fetch submissions for these assignments by the current student
        const assignmentIds = assignmentsData.map(a => a.id);
        let submissionsMap: Map<string, Submission> = new Map();

        if (assignmentIds.length > 0) {
            const { data: submissionsData, error: submissionsError } = await supabase
              .from('submissions')
              .select('*')
              .eq('student_id', user.id)
              .in('assignment_id', assignmentIds);

            if (submissionsError) throw submissionsError;
            submissionsData?.forEach(sub => submissionsMap.set(sub.assignment_id, sub as Submission));
        }
        
        // 4. Combine data and determine status
        const formattedAssignments: Assignment[] = assignmentsData.map(a => {
          const submission = submissionsMap.get(a.id) || null;
          // Safely access nested teacher name
          const teacherUserDetails = (a.users as any)?.user_details;
          const teacherName = Array.isArray(teacherUserDetails) 
                                ? (teacherUserDetails[0]?.full_name || 'Guru Tidak Diketahui')
                                : (teacherUserDetails?.full_name || 'Guru Tidak Diketahui');

          return {
            id: a.id,
            title: a.title,
            description: a.description,
            deadline: a.deadline,
            created_at: a.created_at,
            subject_name: (a.subjects as any)?.subject_name || 'Mapel Tidak Diketahui',
            teacher_name: teacherName,
            status: determineAssignmentStatus(a.deadline, submission),
            submission_details: submission ? {
              fileUrl: submission.file_url,
              submittedAt: submission.submitted_at ? new Date(submission.submitted_at) : null,
              grade: submission.grade,
              feedback: submission.feedback,
            } : null,
          };
        });
        
        setAssignments(formattedAssignments);

      } catch (err: any) {
        console.error("Error fetching student assignments:", err);
        setError(err.message || "Terjadi kesalahan saat memuat tugas.");
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Tugas',
          description: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchStudentAssignments();
    } else if (!authLoading && !user) {
        setLoading(false);
        setError("Silakan login untuk melihat tugas Anda.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToSubmit(event.target.files[0]);
    } else {
      setFileToSubmit(null);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !fileToSubmit || !user) return;

    startSubmitTransition(async () => {
      try {
        // **Simulasi Upload File ke Supabase Storage**
        // Di aplikasi nyata, Anda akan menggunakan supabase.storage.from('bucket_name').upload(...)
        // Untuk sekarang, kita anggap file sudah diupload dan kita punya URL palsu atau hanya nama file.
        const fileName = `${user.id}_${selectedAssignment.id}_${fileToSubmit.name}`;
        // const fakeFileUrl = `https://your-supabase-url.co/storage/v1/object/public/submissions/${fileName}`; // Contoh
        
        // **Simpan data submission ke tabel 'submissions'**
        const { error: submissionError } = await supabase
          .from('submissions')
          .insert({
            assignment_id: selectedAssignment.id,
            student_id: user.id,
            file_url: fileName, // atau fakeFileUrl jika sudah diupload
            submitted_at: new Date().toISOString(),
            // grade dan feedback akan diisi oleh guru nanti
          });

        if (submissionError) throw submissionError;

        toast({
          title: 'Tugas Terkumpul',
          description: `Tugas "${selectedAssignment.title}" berhasil dikumpulkan.`,
        });
        setIsSubmissionDialogOpen(false);
        setSelectedAssignment(null);
        setFileToSubmit(null);
        // Re-fetch assignments to update status
        if (user) { // Re-fetch only if user is still valid
           const event = new Event('AssignmentSubmitted'); // Create a generic event
           window.dispatchEvent(event); // Dispatch event to trigger re-fetch in useEffect
        }
      } catch (err: any) {
        console.error("Error submitting assignment:", err);
        toast({
          variant: 'destructive',
          title: 'Gagal Mengumpulkan Tugas',
          description: err.message || "Terjadi kesalahan.",
        });
      }
    });
  };
  
  // Effect to re-fetch data when an assignment is submitted
  useEffect(() => {
    const handleAssignmentSubmitted = () => {
      if (!authLoading && user) {
      }
    };
    window.addEventListener('AssignmentSubmitted', handleAssignmentSubmitted);
    return () => {
      window.removeEventListener('AssignmentSubmitted', handleAssignmentSubmitted);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);


  const getStatusBadge = (status: AssignmentStatus) => {
     switch (status) {
       case 'Belum Dikumpulkan':
         return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Belum Dikumpulkan</Badge>;
       case 'Sudah Dikumpulkan':
         return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600"><CheckCircle className="mr-1 h-3 w-3" />Sudah Dikumpulkan</Badge>;
       case 'Terlambat':
         return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Terlambat</Badge>;
       case 'Dinilai':
            return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckCircle className="mr-1 h-3 w-3" />Dinilai</Badge>;
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Tugas Sekolah</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-semibold">Tugas Sekolah</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Memuat Tugas</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Tugas Sekolah</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas Anda</CardTitle>
          <CardDescription>Lihat tugas yang diberikan oleh guru dan kumpulkan jawaban Anda.</CardDescription>
        </CardHeader>
        <CardContent>
           {assignments.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-10">
                <CalendarX className="mx-auto h-12 w-12 mb-2" />
                Tidak ada tugas yang tersedia untuk Anda saat ini.
              </div>
           )}
           <ul className="space-y-4">
                {assignments.map(assignment => (
                  <Card key={assignment.id} className={`${assignment.status === 'Terlambat' && !assignment.submission_details ? 'border-destructive' : ''} ${assignment.status === 'Dinilai' ? 'border-green-500' : ''}`}>
                    <CardHeader>
                         <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 flex-shrink-0"/> {assignment.title}</CardTitle>
                            {getStatusBadge(assignment.status)}
                         </div>
                         <CardDescription>
                            Mapel: {assignment.subject_name} • Guru: {assignment.teacher_name}
                         </CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Instruksi:</span> {assignment.description}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                           <Clock className="h-4 w-4" /> Batas Waktu: {format(new Date(assignment.deadline), "dd MMM yyyy, HH:mm", { locale: LocaleID })}
                        </p>
                        {assignment.submission_details && (
                            <div className="text-sm mt-2 p-2 bg-muted rounded-md">
                                <p className={`${assignment.status === 'Dinilai' ? 'text-green-600' : 'text-blue-600'} flex items-center gap-1 font-medium`}>
                                    <CheckCircle className="h-4 w-4" /> 
                                    Tugas Sudah Dikumpulkan 
                                    {assignment.submission_details.submittedAt ? ` pada ${format(assignment.submission_details.submittedAt, "dd MMM yyyy, HH:mm", { locale: LocaleID })}` : ''}
                                </p>
                                {assignment.submission_details.fileUrl && <p className="text-xs ml-5">File: {assignment.submission_details.fileUrl.split('_').slice(2).join('_') /* Simpler display name */}</p>}
                                {assignment.status === 'Dinilai' && (
                                  <>
                                    <p className="text-xs ml-5 mt-1">Nilai: <span className="font-semibold">{assignment.submission_details.grade}</span></p>
                                    {assignment.submission_details.feedback && <p className="text-xs ml-5">Feedback: {assignment.submission_details.feedback}</p>}
                                  </>
                                )}
                            </div>
                        )}
                     </CardContent>
                     <CardFooter className="flex justify-end">
                        {(assignment.status === 'Belum Dikumpulkan' || (assignment.status === 'Terlambat' && !assignment.submission_details)) ? (
                            <Dialog open={isSubmissionDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                                if (open) {
                                    setSelectedAssignment(assignment);
                                    setIsSubmissionDialogOpen(true);
                                } else {
                                    setIsSubmissionDialogOpen(false);
                                    setSelectedAssignment(null);
                                    setFileToSubmit(null);
                                }
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Kumpulkan Tugas</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                    <DialogTitle>Kumpulkan Tugas: {selectedAssignment?.title}</DialogTitle>
                                    <DialogDescription>
                                        Upload file jawaban Anda. Pastikan sesuai instruksi.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="file-upload" className="text-right col-span-1">
                                            File
                                            </Label>
                                            <Input 
                                                id="file-upload" 
                                                type="file" 
                                                className="col-span-3" 
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {fileToSubmit && <p className="text-xs text-muted-foreground col-span-4 text-center">File dipilih: {fileToSubmit.name}</p>}
                                    </div>
                                    <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isSubmitting}>Batal</Button>
                                    </DialogClose>
                                    <Button onClick={handleSubmitAssignment} disabled={isSubmitting || !fileToSubmit}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isSubmitting ? 'Mengirim...' : 'Upload Jawaban'}
                                    </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                             assignment.status !== 'Dinilai' && assignment.submission_details &&
                            <Button size="sm" variant="outline" disabled>Menunggu Penilaian</Button>
                        )}
                     </CardFooter>
                  </Card>
                ))}
             </ul>
        </CardContent>
      </Card>
    </div>
  );
}


    