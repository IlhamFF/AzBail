
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CalendarOff } from 'lucide-react';

interface TeacherScheduleItem {
  id: string;
  day: string;
  time: string;
  class_name: string;
  subject_name: string;
  room: string | null;
}

export default function TeacherSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const [schedule, setSchedule] = useState<TeacherScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      if (!user?.id) {
        setLoading(false);
        setError("Pengguna tidak terautentikasi.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('class_schedules')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            room,
            classes ( name ),
            subjects ( subject_name )
          `)
          .eq('teacher_id', user.id)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });

        if (fetchError) {
          console.error("Error fetching teacher schedule:", fetchError);
          throw fetchError;
        }

        const dayMapping: { [key: number]: string } = {
          1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu'
        };

        const formattedSchedule = data?.map(item => ({
          id: item.id,
          day: dayMapping[item.day_of_week as number] || `Hari Tidak Valid (${item.day_of_week})`,
          time: `${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}`,
          class_name: (item.classes as any)?.name || 'N/A',
          subject_name: (item.subjects as any)?.subject_name || 'N/A',
          room: item.room || '-',
        })) || [];

        setSchedule(formattedSchedule);

      } catch (err: any) {
        console.error('Error processing teacher schedule:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat jadwal mengajar.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchTeacherSchedule();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Silakan login untuk melihat jadwal mengajar Anda.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Jadwal Mengajar</h1>
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
                  <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-32" /></TableHead>
                  <TableHead><Skeleton className="h-5 w-16" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
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
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Jadwal Mengajar</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Memuat Jadwal</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Jadwal Mengajar</h1>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Anda</CardTitle>
          <CardDescription>Berikut adalah jadwal mengajar Anda untuk minggu ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Ruang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length > 0 ? (
                schedule.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.day}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell><Badge variant="secondary">{item.class_name}</Badge></TableCell>
                    <TableCell>{item.subject_name}</TableCell>
                    <TableCell>{item.room}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarOff className="h-12 w-12 text-muted-foreground mb-2" />
                      Jadwal mengajar tidak ditemukan.
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

    