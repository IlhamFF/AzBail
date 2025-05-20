
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Changed from @/utils/supabase/client
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
  assignmentsToGrade: number; // Changed from assignmentsDue
  averageStudentPerformance: number | null; // New stat
  // weeklyAttendance: { name: string; present: number; absent: number }[]; // Placeholder for now
}

// Placeholder for Staff and Principal data types (to be implemented later)
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
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"> {/* Adjusted grid for 4 cards */}
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
    {/* Placeholder for weekly attendance chart - can be added later */}
    {/* <Card className="col-span-1 md:col-span-2 lg:col-span-2">
       <CardHeader>
         <CardTitle>Rata-rata Kehadiran Mingguan Kelas</CardTitle>
       </CardHeader>
       <CardContent>
         {loading ? <Skeleton className="h-[200px] w-full" /> : <p className="text-muted-foreground">Grafik kehadiran akan ditampilkan di sini.</p>}
       </CardContent>
     </Card> */}
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
     {/* Add more relevant cards for Staff */}
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
    {/* Add more relevant charts/data for Principal */}
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

      const studentDetailId = studentDetails.id; // This is user_details.id
      const classId = studentDetails.class_id;

      if (!classId) { // If student is not assigned to a class yet
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
      // Add logic to check if student has already submitted for more accuracy

      const { count: totalAttendanceCount, error: totalAttendanceError } = await supabase
         .from('attendance')
         .select('id', { count: 'exact', head: true })
         .eq('student_id', studentDetailId); // Use user_details.id for student_id

       const { count: presentAttendanceCount, error: presentAttendanceError } = await supabase
         .from('attendance')
         .select('id', { count: 'exact', head: true })
         .eq('student_id', studentDetailId) // Use user_details.id
         .eq('status', 'Hadir');

       const attendancePercentage = (presentAttendanceCount !== null && totalAttendanceCount !== null && totalAttendanceCount > 0)
         ? Math.round((presentAttendanceCount / totalAttendanceCount) * 100)
         : 0;

       const { data: gradesData, error: gradesError } = await supabase
         .from('grades')
         .select('score, subjects(subject_name)')
         .eq('student_id', studentDetailId); // Use user_details.id

       const gradesBySubject = gradesData?.map(g => ({
          name: (g.subjects as any)?.subject_name || 'Unknown Subject',
          score: g.score || 0
       })) || [];

      setStudentData({
        assignmentsDue: assignmentsDueCount || 0,
        upcomingExams: 0, // Placeholder - implement fetching for exams
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
      // Get teacher's user_details id
      const { data: teacherDetails, error: teacherDetailsError } = await supabase
        .from('user_details')
        .select('id')
        .eq('user_id', currentUserId)
        .single();

      if (teacherDetailsError || !teacherDetails) throw teacherDetailsError || new Error("Detail guru tidak ditemukan.");
      const teacherDetailId = teacherDetails.id; // This is user_details.id which might be used in assignments.teacher_id

      // 1. Classes Taught (Homeroom teacher)
      const { count: classesTaughtCount, error: classesError } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('homeroom_teacher_id', currentUserId); // Assuming homeroom_teacher_id is auth.users.id

      // 2. Total Students
      // Fetch all classes where the teacher is a homeroom teacher
      const { data: taughtClasses, error: taughtClassesError } = await supabase
        .from('classes')
        .select('id')
        .eq('homeroom_teacher_id', currentUserId);

      if (taughtClassesError) throw taughtClassesError;
      
      let totalStudentsCount = 0;
      if (taughtClasses && taughtClasses.length > 0) {
        const classIds = taughtClasses.map(c => c.id);
        // Count students from user_details table who are in these classes
        const { count: studentsInClassesCount, error: studentsError } = await supabase
          .from('user_details')
          .select('id', { count: 'exact', head: true })
          .in('class_id', classIds)
          .eq('role', 'Siswa'); // Ensure we are counting students
        if (studentsError) throw studentsError;
        totalStudentsCount = studentsInClassesCount || 0;
      }

      // 3. Assignments to Grade
      // Count submissions for assignments created by this teacher where submission status needs grading
      const { count: assignmentsToGradeCount, error: assignmentsToGradeError } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('assignments.teacher_id', currentUserId) // Assuming assignments.teacher_id is auth.users.id
        // Add a condition for submissions that need grading, e.g., .is('grade', null) or similar
        // This part needs more specific logic based on how "needs grading" is defined
        // For now, let's count all submissions for the teacher's assignments
      
      if (assignmentsToGradeError) console.warn("Warning fetching assignments to grade:", assignmentsToGradeError.message);


      // 4. Average Student Performance (Placeholder logic)
      // This is complex. A simplified version: fetch all grades for students in the teacher's classes
      // For now, we'll set a placeholder or null.
      let averagePerformance: number | null = null;
      // Example of fetching grades (needs refinement for actual performance calculation)
      // const { data: teacherStudentsGrades, error: gradesError } = await supabase
      //   .from('grades')
      //   .select('score')
      //   .in('student_id', (await supabase.from('user_details').select('id').in('class_id', taughtClasses.map(c=>c.id))).data.map(ud => ud.id) ) // very nested

      // if(!gradesError && teacherStudentsGrades && teacherStudentsGrades.length > 0){
      //    const totalScore = teacherStudentsGrades.reduce((sum, grade) => sum + (grade.score || 0), 0);
      //    averagePerformance = Math.round(totalScore / teacherStudentsGrades.length);
      // }


      setTeacherData({
        classesTaught: classesTaughtCount || 0,
        totalStudents: totalStudentsCount,
        assignmentsToGrade: assignmentsToGradeCount || 0, // Placeholder
        averageStudentPerformance: averagePerformance, // Placeholder
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
      if (role === 'Siswa' && !studentData) {
        fetchStudentData(user.id);
      } else if (role === 'Guru' && !teacherData) {
        fetchTeacherData(user.id);
      } else if (!user) {
        setStudentData(null);
        setTeacherData(null);
        setDashboardLoading(false);
      } else {
        setDashboardLoading(false);
      }
    } else if (!authLoading && !user) {
      // If user is not logged in and auth is not loading, ensure dashboard loading is false
      setDashboardLoading(false);
    }
  }, [user, authLoading, studentData, teacherData]);

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
    if (dashboardLoading && role) { // Show skeleton only if dashboard is loading for a known role
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(role === 'Siswa' ? 3 : 2)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                {role === 'Siswa' && <Skeleton className="h-64 md:col-span-2 lg:col-span-3" />}
                 {role === 'Guru' && <Skeleton className="h-32 md:col-span-2" />}
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
        return <StaffDashboard />;
      case 'Kepala Sekolah':
        return <PrincipalDashboard />;
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

    