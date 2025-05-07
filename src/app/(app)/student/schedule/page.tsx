
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
        setError("Pengguna tidak terautentikasi.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch schedule for the logged-in student
        // Joins with subjects to get subject_name
        // Joins with classes to get class_name
        // Joins with user_details via schedules.teacher_id to get teacher_name
        // This query assumes you have a 'schedules' table with a 'teacher_id' that references 'users(id)'
        // and 'class_students' table linking students to classes.
        // The RLS policies must allow this.

        // First, get the class_id for the student
        const { data: classStudentData, error: classStudentError } = await supabase
          .from('class_students')
          .select('class_id')
          .eq('student_id', user.id)
          .single();

        if (classStudentError) {
          if (classStudentError.code === 'PGRST116') { // No rows found
            setError('Anda belum terdaftar di kelas manapun. Jadwal tidak dapat ditampilkan.');
            setLoading(false);
            return;
          }
          console.error("Error fetching student's class:", classStudentError);
          throw new Error(`Gagal mengambil data kelas siswa: ${classStudentError.message}`);
        }

        if (!classStudentData?.class_id) {
          setError('Data kelas siswa tidak ditemukan. Jadwal tidak dapat ditampilkan.');
          setLoading(false);
          return;
        }

        const studentClassId = classStudentData.class_id;

        const { data, error: fetchError } = await supabase
          .from('schedules')
          .select(`
            id,
            day_of_week,
            start_time,
            end_time,
            room,
            subjects!inner (subject_name),
            users!inner (user_details!inner(full_name))
          `)
          .eq('class_id', studentClassId) // Filter by the student's class_id
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });


        if (fetchError) {
          console.error("Error fetching student schedule:", fetchError);
          // Provide more specific error message
          throw new Error(`Gagal mengambil jadwal pelajaran: ${fetchError.message} (Code: ${fetchError.code})`);
        }

        const dayMapping: { [key: number]: string } = {
          1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu'
        };

        const formattedSchedule = data?.map(item => {
          const teacherDetails = (item.users as any)?.user_details;
          const teacherName = Array.isArray(teacherDetails) 
                              ? (teacherDetails[0]?.full_name || 'N/A') 
                              : (teacherDetails?.full_name || 'N/A');
          return {
            id: item.id,
            day: dayMapping[item.day_of_week as number] || `Hari Tidak Valid (${item.day_of_week})`,
            time: `${item.start_time.substring(0,5)} - ${item.end_time.substring(0,5)}`, // Format HH:MM
            subject_name: (item.subjects as any)?.subject_name || 'N/A',
            class_name: 'Kelas Anda', // Student already filtered by class
            teacher_name: teacherName,
          };
        }) || [];
        
        setSchedule(formattedSchedule);

      } catch (err: any) {
        console.error('Error processing schedule:', err);
        setError(err.message || 'Terjadi kesalahan yang tidak diketahui saat memuat jadwal.');
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
      <div className="space-y-6 p-4 md:p-6">
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
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Jadwal Pelajaran</h1>
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
                <TableHead>Ruang</TableHead>
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
                    <TableCell>{(item as any).room || '-'}</TableCell> {/* Add room display */}
                    <TableCell>{item.teacher_name}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarOff className="h-12 w-12 text-muted-foreground mb-2" />
                      <p>Jadwal pelajaran tidak ditemukan.</p>
                      <p className="text-xs">Pastikan data jadwal Anda sudah diatur oleh administrator atau Anda terdaftar di kelas.</p>
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

