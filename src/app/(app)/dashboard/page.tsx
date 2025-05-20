
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; 
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Helper function to get role from user metadata
const getUserRole = (user: any): string | null => {
  return user?.user_metadata?.role || null;
};

// Define data types for fetched data
interface StudentDashboardData {
  assignmentsDue: number;
  upcomingExams: number;
  attendancePercentage: number;
  gradesBySubject: { name: string; score: number }[];
}

interface TeacherDashboardData {
  classesTaught: number;
  totalStudents: number;
  assignmentsToGrade: number;
  averageStudentPerformance: number | null;
}

// Placeholder for Staff and Principal data types
const staffStats = { studentsManaged: 500, pendingTasks: 10 };
const principalStats = { teacherPerformance: 8.5, studentEnrollment: 1200, budgetStatus: 'On Track' };

const chartConfig = {
  score: { label: "Nilai", color: "hsl(var(--chart-1))" },
  present: { label: "Hadir", color: "hsl(var(--chart-2))" },
  absent: { label: "Absen", color: "hsl(var(--chart-5))" },
  performance: { label: "Kinerja (%)", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig;

// Separate Dashboard Components using props for data
const TeacherDashboard: React.FC<{ data: TeacherDashboardData | null; loading: boolean }> = ({ data, loading }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Kelas Diampu</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.classesTaught ?? 0)}</div></CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Siswa</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.totalStudents ?? 0)}</div></CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tugas Perlu Dinilai</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.assignmentsToGrade ?? 0)}</div></CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rata-rata Kinerja Siswa</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.averageStudentPerformance !== null ? `${data?.averageStudentPerformance}%` : '-')}</div></CardContent>
    </Card>
  </div>
);

const StudentDashboard: React.FC<{ data: StudentDashboardData | null; loading: boolean }> = ({ data, loading }) => (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tugas Belum Selesai</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.assignmentsDue ?? 0)}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ujian Mendatang</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.upcomingExams ?? 0)}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Persentase Kehadiran</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : (data?.attendancePercentage ?? 0)}%</div></CardContent>
    </Card>
     <Card className="col-span-1 md:col-span-2 lg:col-span-3">
       <CardHeader>
         <CardTitle>Performa Nilai</CardTitle>
         <CardDescription>Nilai rata-rata per mata pelajaran semester ini.</CardDescription>
       </CardHeader>
       <CardContent>
          {loading ? <Skeleton className="h-[200px] w-full" /> : (
            data?.gradesBySubject && data.gradesBySubject.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.gradesBySubject}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                      <YAxis />
                       <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
              </ChartContainer>
            ) : <p className="text-muted-foreground text-center">Data nilai belum tersedia.</p>
          )}
       </CardContent>
     </Card>
  </div>
);

const StaffDashboard: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Siswa Terdaftar</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{staffStats.studentsManaged}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tugas Administrasi Tertunda</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{staffStats.pendingTasks}</div></CardContent>
    </Card>
  </div>
);

const PrincipalDashboard: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Rata-rata Kinerja Guru</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{principalStats.teacherPerformance}/10</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Jumlah Siswa Aktif</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{principalStats.studentEnrollment}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Status Anggaran</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{principalStats.budgetStatus}</div></CardContent>
    </Card>
  </div>
);


export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherDashboardData | null>(null);
  
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const fetchStudentData = async (currentUserId: string) => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const { data: studentDetails, error: userError } = await supabase
        .from('user_details')
        .select('id, class_id')
        .eq('user_id', currentUserId)
        .single();

      if (userError || !studentDetails) throw userError || new Error("Detail siswa tidak ditemukan.");

      const studentDetailId = studentDetails.id;
      const classId = studentDetails.class_id;

      if (!classId) {
         setStudentData({
           assignmentsDue: 0,
           upcomingExams: 0,
           attendancePercentage: 0,
           gradesBySubject: [],
         });
         setDashboardLoading(false);
         return;
      }

      const { count: assignmentsDueCount, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId) 
        .gte('deadline', new Date().toISOString());
      
      if (assignmentsError) console.warn("Warning fetching student assignments:", assignmentsError.message);

      const { count: totalAttendanceCount, error: totalAttendanceError } = await supabase
         .from('attendance')
         .select('id', { count: 'exact', head: true })
         .eq('student_id', studentDetailId);

      if (totalAttendanceError) console.warn("Warning fetching total attendance:", totalAttendanceError.message);

      const { count: presentAttendanceCount, error: presentAttendanceError } = await supabase
         .from('attendance')
         .select('id', { count: 'exact', head: true })
         .eq('student_id', studentDetailId)
         .eq('status', 'Hadir');
      
      if (presentAttendanceError) console.warn("Warning fetching present attendance:", presentAttendanceError.message);

      const attendancePercentage = (presentAttendanceCount !== null && totalAttendanceCount !== null && totalAttendanceCount > 0)
         ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100)
         : 0;

      const { data: gradesData, error: gradesError } = await supabase
         .from('grades')
         .select('score, subjects(subject_name)')
         .eq('student_id', studentDetailId);
      
      if (gradesError) console.warn("Warning fetching student grades:", gradesError.message);

      const gradesBySubject = gradesData?.map(g => ({
          name: (g.subjects as any)?.subject_name || 'Unknown Subject',
          score: g.score || 0
      })) || [];

      setStudentData({
        assignmentsDue: assignmentsDueCount || 0,
        upcomingExams: 0, 
        attendancePercentage: attendancePercentage,
        gradesBySubject: gradesBySubject,
      });
    } catch (err: any) {
      console.error("Error fetching student data:", err);
      setDashboardError('Gagal memuat data dashboard siswa.');
      toast({ variant: 'destructive', title: 'Error Data Siswa', description: err.message || 'Gagal mengambil data siswa.' });
    } finally { 
      setDashboardLoading(false); 
    }
  };

  const fetchTeacherData = async (currentUserId: string) => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const { data: teacherDetails, error: teacherDetailsError } = await supabase
        .from('user_details')
        .select('id')
        .eq('user_id', currentUserId)
        .single();

      if (teacherDetailsError || !teacherDetails) throw teacherDetailsError || new Error("Detail guru tidak ditemukan.");
      
      const { count: classesTaughtCount, error: classesError } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('homeroom_teacher_id', currentUserId);

      if (classesError) console.warn("Warning fetching classes taught:", classesError.message);

      const { data: taughtClasses, error: taughtClassesError } = await supabase
        .from('classes')
        .select('id')
        .eq('homeroom_teacher_id', currentUserId);

      if (taughtClassesError) throw taughtClassesError;
      
      let totalStudentsCount = 0;
      if (taughtClasses && taughtClasses.length > 0) {
        const classIds = taughtClasses.map(c => c.id);
        const { count: studentsInClassesCount, error: studentsError } = await supabase
          .from('user_details')
          .select('id', { count: 'exact', head: true })
          .in('class_id', classIds)
          .eq('role', 'Siswa'); 
        if (studentsError) console.warn("Warning fetching students in classes:", studentsError.message);
        totalStudentsCount = studentsInClassesCount || 0;
      }

      const { count: assignmentsToGradeCount, error: assignmentsToGradeError } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        // This requires a join or a way to filter submissions based on assignments.teacher_id
        // For simplicity, this is a placeholder. A more accurate query would be needed.
        // e.g., .eq('assignments.teacher_id', currentUserId) if join is possible,
        // or fetch assignments by teacher, then submissions for those assignments.
        // This count will likely be inaccurate without proper filtering.

      if (assignmentsToGradeError) console.warn("Warning fetching assignments to grade:", assignmentsToGradeError.message);

      let averagePerformance: number | null = null; // Placeholder

      setTeacherData({
        classesTaught: classesTaughtCount || 0,
        totalStudents: totalStudentsCount,
        assignmentsToGrade: assignmentsToGradeCount || 0, 
        averageStudentPerformance: averagePerformance,
      });

    } catch (err: any) {
      console.error("Error fetching teacher data:", err);
      setDashboardError('Gagal memuat data dashboard guru.');
      toast({ variant: 'destructive', title: 'Error Data Guru', description: err.message || 'Gagal mengambil data guru.' });
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && getUserRole(user) === 'Admin') {
      router.replace('/admin/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const role = getUserRole(user);
    if (!authLoading && user && role !== 'Admin') {
      setDashboardLoading(true); // Set loading true before fetching
      if (role === 'Siswa') {
        fetchStudentData(user.id);
      } else if (role === 'Guru') {
        fetchTeacherData(user.id);
      } else {
        setDashboardLoading(false); // No specific data to fetch for other roles yet
      }
    } else if (!authLoading && !user) {
      setStudentData(null);
      setTeacherData(null);
      setDashboardLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || (user && getUserRole(user) === 'Admin')) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
           <Skeleton className="h-64 md:col-span-2 lg:col-span-3" />
         </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Belum Login</AlertTitle>
                <AlertDescription>Silakan login untuk melihat dashboard Anda.</AlertDescription>
            </Alert>
        </div>
    );
  }
  
  const role = getUserRole(user);

  const renderDashboardContent = () => {
    if (dashboardLoading && role && (role === 'Siswa' || role === 'Guru')) { 
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(role === 'Siswa' ? 3 : 4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                {role === 'Siswa' && <Skeleton className="h-64 md:col-span-2 lg:col-span-3" />}
            </div>
        );
    }
    if (dashboardError) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Memuat Data Dashboard</AlertTitle>
                <AlertDescription>{dashboardError}</AlertDescription>
            </Alert>
        );
    }

    switch (role) {
      case 'Guru':
        return <TeacherDashboard data={teacherData} loading={dashboardLoading} />;
      case 'Siswa':
        return <StudentDashboard data={studentData} loading={dashboardLoading} />;
      case 'Tata Usaha':
        return <StaffDashboard />; // Still uses placeholder data
      case 'Kepala Sekolah':
        return <PrincipalDashboard />; // Still uses placeholder data
      default:
        return <Card><CardContent className="p-6">Peran tidak dikenali atau tidak memiliki dashboard.</CardContent></Card>;
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard {role ? `(${role})` : ''}</h1>
      {renderDashboardContent()}
    </div>
  );
}

    