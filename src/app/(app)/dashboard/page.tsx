'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Assuming recharts is installed
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart" // Assuming chart components exist

// Helper function to get role from user metadata
const getUserRole = (user: any): string | null => {
  return user?.user_metadata?.role || null;
};

// Example Data (replace with actual data fetching)
const adminStats = { users: 120, pendingVerifications: 5, classes: 15 };
const teacherStats = { classes: 3, students: 85, assignmentsDue: 2 };
const studentStats = { assignmentsDue: 1, upcomingExams: 3, attendancePercentage: 95 };
const staffStats = { studentsManaged: 500, pendingTasks: 10 };
const principalStats = { teacherPerformance: 8.5, studentEnrollment: 1200, budgetStatus: 'On Track' };

// Example Chart Data
const studentGradeData = [
  { name: 'Matematika', score: 85 },
  { name: 'B. Indo', score: 92 },
  { name: 'IPA', score: 78 },
  { name: 'IPS', score: 88 },
  { name: 'B. Ing', score: 90 },
];

const teacherAttendanceData = [
  { name: 'Senin', present: 28, absent: 2 },
  { name: 'Selasa', present: 30, absent: 0 },
  { name: 'Rabu', present: 29, absent: 1 },
  { name: 'Kamis', present: 27, absent: 3 },
  { name: 'Jumat', present: 30, absent: 0 },
];

const chartConfig = {
  score: {
    label: "Nilai",
    color: "hsl(var(--chart-1))",
  },
   present: {
     label: "Hadir",
     color: "hsl(var(--chart-2))",
   },
   absent: {
     label: "Absen",
     color: "hsl(var(--chart-5))",
   },
} satisfies ChartConfig

// Role-specific Dashboard Components (Examples)
const AdminDashboard: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{adminStats.users}</div>
        <p className="text-xs text-muted-foreground">+2 dari bulan lalu</p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Verifikasi Tertunda</CardTitle>
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="18" x2="18" y1="16" y2="22"/><line x1="21" x2="15" y1="19" y2="19"/></svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{adminStats.pendingVerifications}</div>
         <p className="text-xs text-muted-foreground">Perlu tindakan segera</p>
      </CardContent>
    </Card>
     <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5Z"/><path d="M12 12h.01"/></svg>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{adminStats.classes}</div>
        <p className="text-xs text-muted-foreground">Tahun ajaran ini</p>
      </CardContent>
    </Card>
  </div>
);

const TeacherDashboard: React.FC = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Kelas Diampu</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{teacherStats.classes}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Siswa</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{teacherStats.students}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tugas Mendatang</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{teacherStats.assignmentsDue}</div></CardContent>
    </Card>
     <Card className="col-span-1 md:col-span-2 lg:col-span-3">
       <CardHeader>
         <CardTitle>Rata-rata Kehadiran Mingguan</CardTitle>
         <CardDescription>Kehadiran siswa dalam seminggu terakhir.</CardDescription>
       </CardHeader>
       <CardContent>
         <ChartContainer config={chartConfig} className="h-[200px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={teacherAttendanceData}>
               <CartesianGrid vertical={false} />
               <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
               <YAxis />
               <ChartTooltip content={<ChartTooltipContent />} />
               <Legend />
               <Bar dataKey="present" fill="var(--color-present)" radius={4} />
               <Bar dataKey="absent" fill="var(--color-absent)" radius={4} />
             </BarChart>
           </ResponsiveContainer>
         </ChartContainer>
       </CardContent>
     </Card>
  </div>
);

const StudentDashboard: React.FC = () => (
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tugas Belum Selesai</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{studentStats.assignmentsDue}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ujian Mendatang</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{studentStats.upcomingExams}</div></CardContent>
    </Card>
     <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Persentase Kehadiran</CardTitle></CardHeader>
      <CardContent><div className="text-2xl font-bold">{studentStats.attendancePercentage}%</div></CardContent>
    </Card>
     <Card className="col-span-1 md:col-span-2 lg:col-span-3">
       <CardHeader>
         <CardTitle>Performa Nilai</CardTitle>
         <CardDescription>Nilai rata-rata per mata pelajaran semester ini.</CardDescription>
       </CardHeader>
       <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentGradeData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                   <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <Skeleton className="h-32" />
           <Skeleton className="h-32" />
           <Skeleton className="h-32" />
           <Skeleton className="h-64 md:col-span-2 lg:col-span-3" />
         </div>
      </div>
    );
  }

  if (!user) {
    // Should be handled by layout, but good practice to check
    return <div>Anda belum login.</div>;
  }

  const role = getUserRole(user);

  const renderDashboardContent = () => {
    switch (role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Guru':
        return <TeacherDashboard />;
      case 'Siswa':
        return <StudentDashboard />;
      case 'Tata Usaha':
        return <StaffDashboard />;
      case 'Kepala Sekolah':
        return <PrincipalDashboard />;
      default:
        return <Card><CardContent>Peran tidak dikenali atau tidak memiliki dashboard.</CardContent></Card>;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard {role ? `(${role})` : ''}</h1>
      {renderDashboardContent()}
    </div>
  );
}
