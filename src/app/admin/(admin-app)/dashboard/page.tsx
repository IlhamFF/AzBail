'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Users, UserCheck, BookOpen, ClipboardList, Activity, School } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client'; // Use client for dynamic data fetching

interface AdminStats {
  totalUsers: number | null;
  pendingVerifications: number | null;
  totalClasses: number | null;
  totalSubjects: number | null;
  recentActivityCount: number | null;
}

// Example Chart Data
const userRoleData = [
  { role: 'Siswa', count: 75 },
  { role: 'Guru', count: 20 },
  { role: 'Tata Usaha', count: 5 },
  { role: 'Kepala Sekolah', count: 1 },
  { role: 'Admin', count: 1 },
];

const chartConfig = {
  count: {
    label: "Jumlah",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: null,
    pendingVerifications: null,
    totalClasses: null,
    totalSubjects: null,
    recentActivityCount: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // No need to check role here, layout handles it
      setLoadingStats(true);
      try {
        // Parallel fetch for counts
        const [usersCount, pendingCount, classesCount, subjectsCount, activityCount] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', false),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gt('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Example: activity in last 24 hours
        ]);

        // Basic error handling for fetch
        if (usersCount.error) throw usersCount.error;
        if (pendingCount.error) throw pendingCount.error;
        if (classesCount.error) throw classesCount.error;
        if (subjectsCount.error) throw subjectsCount.error;
        if (activityCount.error) throw activityCount.error;

        setStats({
          totalUsers: usersCount.count,
          pendingVerifications: pendingCount.count,
          totalClasses: classesCount.count,
          totalSubjects: subjectsCount.count,
          recentActivityCount: activityCount.count,
        });
      } catch (error: any) {
        console.error("Error fetching admin stats:", error);
        // Handle error display if needed (e.g., show a toast)
      } finally {
        setLoadingStats(false);
      }
    };

     // Fetch stats only if auth is done loading and user exists (layout ensures it's admin)
     if (!authLoading && user) {
        fetchStats();
     }

  }, [user, authLoading]); // Depend on user and authLoading

  // Layout handles loading state, but we can show skeleton for stats
  // if (authLoading || !user) {
  //   return <div>Loading dashboard...</div>; // Or a more detailed skeleton
  // }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.totalUsers ?? '-'}</div>}
            {/* <p className="text-xs text-muted-foreground">+2 dari bulan lalu</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifikasi Tertunda</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.pendingVerifications ?? '-'}</div>}
             {/* <p className="text-xs text-muted-foreground">Perlu tindakan segera</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalClasses ?? '-'}</div>}
             {/* <p className="text-xs text-muted-foreground">Tahun ajaran ini</p> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mata Pelajaran</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalSubjects ?? '-'}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktivitas Terbaru (24 Jam)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.recentActivityCount ?? '-'}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
       <div className="grid gap-4 md:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle>Distribusi Peran Pengguna</CardTitle>
             <CardDescription>Jumlah pengguna berdasarkan peran.</CardDescription>
           </CardHeader>
           <CardContent>
              {loadingStats ? <Skeleton className="h-[250px] w-full" /> : (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoleData} layout="vertical">
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide/>
                      <YAxis dataKey="role" type="category" tickLine={false} tickMargin={10} axisLine={false} width={80} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel hideIndicator />} cursor={false}/>
                      <Bar dataKey="count" fill="var(--color-count)" radius={5} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
           </CardContent>
         </Card>
         {/* Add more charts or data visualizations here */}
          <Card>
              <CardHeader>
                  <CardTitle>Placeholder Chart</CardTitle>
                  <CardDescription>Example of another chart area.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[250px]">
                  {loadingStats ? <Skeleton className="h-32 w-full" /> : <p className="text-muted-foreground">Chart will be displayed here</p>}
              </CardContent>
          </Card>
       </div>
    </div>
  );
}
