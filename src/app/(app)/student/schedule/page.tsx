
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CalendarOff } from 'lucide-react';

interface StudentScheduleItem {
  id: string;
  day: string;
  time: string;
  subject_name: string;
  class_name: string;
  teacher_name: string;
}

export default function StudentSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [schedule, setSchedule] = useState<StudentScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id) {
        setLoading(false);
        setError("User not authenticated.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch schedule for the logged-in student
        // Joins with subjects to get subject_name
        // Joins with classes to get class_name
        // Joins with user_details via classes.homeroom_teacher_id to get teacher_name
        const { data, error: fetchError } = await supabase
          .from('student_schedules')
          .select(`
            id,
            day,
            time,
            subjects!inner (subject_name),
            classes!inner (
              name,
              user_details!classes_homeroom_teacher_id_fkey (full_name)
            )
          `)
          .eq('student_id', user.id)
          .order('day', { ascending: true }) // You might want a more sophisticated sort (e.g., custom day order then time)
          .order('time', { ascending: true });


        if (fetchError) {
          console.error("Error fetching student schedule:", fetchError);
          throw fetchError;
        }

        const formattedSchedule = data?.map(item => ({
          id: item.id,
          day: item.day,
          time: item.time,
          subject_name: (item.subjects as any)?.subject_name || 'N/A',
          class_name: (item.classes as any)?.name || 'N/A',
          teacher_name: (item.classes as any)?.user_details?.full_name || 'N/A',
        })) || [];
        
        setSchedule(formattedSchedule);

      } catch (err: any) {
        console.error('Error processing schedule:', err);
        setError('Gagal memuat jadwal pelajaran. Pastikan Anda memiliki koneksi internet dan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchSchedule();
    } else if (!authLoading && !user) {
        setLoading(false);
        setError("Silakan login untuk melihat jadwal pelajaran.");
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Jadwal Pelajaran</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Jadwal Pelajaran</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Jadwal Pelajaran</h1>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Kelas Anda</CardTitle>
          <CardDescription>Berikut adalah jadwal pelajaran Anda untuk minggu ini.</CardDescription>
          {/* Add Filtering by day if needed */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Guru</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length > 0 ? (
                schedule.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.day}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.subject_name}</TableCell>
                    <TableCell>{item.teacher_name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarOff className="h-12 w-12 text-muted-foreground mb-2" />
                      <p>Jadwal pelajaran tidak ditemukan.</p>
                      <p className="text-xs">Pastikan data jadwal Anda sudah diatur oleh administrator.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
