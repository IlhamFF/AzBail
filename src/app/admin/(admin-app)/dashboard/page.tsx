
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Users, UserCheck, BookOpen, ClipboardList, Activity, School } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase/client'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AdminStats {
  totalUsers: number | null;
  pendingVerifications: number | null;
  totalClasses: number | null;
  totalSubjects: number | null;
  recentActivityCount: number | null;
}

interface UserRoleCount {
  role: string;
  count: number;
}

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
  const [userRoleData, setUserRoleData] = useState<UserRoleCount[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoadingStats(true);
      setError(null);
      try {
        // Parallel fetch for counts
        const [usersData, pendingData, classesData, subjectsData, activityData, rolesData] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_verified', false),
          supabase.from('classes').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gt('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('users').select('role, id', { count: 'exact' }) // Fetch roles for chart
        ]);

        // Basic error handling for fetch
        if (usersData.error) throw new Error(`Users: ${usersData.error.message}`);
        if (pendingData.error) throw new Error(`Pending Verifications: ${pendingData.error.message}`);
        if (classesData.error) throw new Error(`Classes: ${classesData.error.message}`);
        if (subjectsData.error) throw new Error(`Subjects: ${subjectsData.error.message}`);
        if (activityData.error) throw new Error(`Activity: ${activityData.error.message}`);
        if (rolesData.error) throw new Error(`User Roles: ${rolesData.error.message}`);
        
        setStats({
          totalUsers: usersData.count,
          pendingVerifications: pendingData.count,
          totalClasses: classesData.count,
          totalSubjects: subjectsData.count,
          recentActivityCount: activityData.count,
        });

        // Process user roles data
        if (rolesData.data) {
          const roleCounts: Record<string, number> = {};
          rolesData.data.forEach(user => {
            if (user.role) {
              roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
            }
          });
          setUserRoleData(Object.entries(roleCounts).map(([role, count]) => ({ role, count })));
        }

      } catch (error: any) {
        console.error("Error fetching admin stats:", error);
        setError(`Gagal memuat statistik admin: ${error.message}`);
      } finally {
        setLoadingStats(false);
      }
    };

     if (!authLoading && user) {
        fetchAdminData();
     }

  }, [user, authLoading]); 

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.totalUsers ?? '-'}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verifikasi Tertunda</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loadingStats ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{stats.pendingVerifications ?? '-'}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? <Skeleton className="h-8 w-10" /> : <div className="text-2xl font-bold">{stats.totalClasses ?? '-'}</div>}
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
                userRoleData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userRoleData} layout="vertical" margin={{ right: 20 }}>
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" hide/>
                      <YAxis dataKey="role" type="category" tickLine={false} tickMargin={5} axisLine={false} width={100} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel hideIndicator />} cursor={false}/>
                      <Bar dataKey="count" fill="var(--color-count)" radius={5} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                ) : <p className="text-muted-foreground text-center">Data peran tidak tersedia.</p>
              )}
           </CardContent>
         </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Statistik Tambahan</CardTitle>
                  <CardDescription>Area untuk chart atau statistik lain.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[250px]">
                  {loadingStats ? <Skeleton className="h-32 w-full" /> : <p className="text-muted-foreground">Chart akan ditampilkan di sini</p>}
              </CardContent>
          </Card>
       </div>
    </div>
  );
}

    