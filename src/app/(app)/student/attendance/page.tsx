
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CalendarX2 } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string; // Keep as string from DB, format on display
  subject_name: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | string; // Allow string for flexibility from DB
}

interface AttendanceSummary {
  present: number;
  sick: number;
  permit: number;
  absent: number;
  percentage: number;
  totalRecords: number;
}

export default function StudentAttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateSummary = (records: AttendanceRecord[]): AttendanceSummary => {
    const total = records.length;
    if (total === 0) return { present: 0, sick: 0, permit: 0, absent: 0, percentage: 0, totalRecords: 0 };

    const present = records.filter(r => r.status === 'Hadir').length;
    const sick = records.filter(r => r.status === 'Sakit').length;
    const permit = records.filter(r => r.status === 'Izin').length;
    const absent = records.filter(r => r.status === 'Alpa').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, sick, permit, absent, percentage, totalRecords: total };
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!user) {
        setLoading(false);
        setError("Silakan login untuk melihat data absensi Anda.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('attendance')
          .select(`
            id,
            date,
            status,
            subjects (subject_name)
          `)
          .eq('student_id', user.id) // Assuming attendance table has student_id as FK to auth.users.id
          .order('date', { ascending: false });

        if (fetchError) {
          console.error("Error fetching attendance:", fetchError);
          throw fetchError;
        }
        
        const formattedRecords = data?.map(record => ({
          id: record.id,
          date: record.date,
          subject_name: (record.subjects as any)?.subject_name || 'Mata Pelajaran Tidak Diketahui',
          status: record.status as AttendanceRecord['status'],
        })) || [];

        setAttendanceRecords(formattedRecords);
        setSummary(calculateSummary(formattedRecords));

      } catch (err: any) {
        console.error('Error processing attendance data:', err);
        setError(err.message || "Terjadi kesalahan saat memuat data absensi.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAttendance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Hadir': return 'default';
          case 'Sakit': return 'secondary';
          case 'Izin': return 'outline';
          case 'Alpa': return 'destructive';
          default: return 'outline';
      }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Rekap Absensi</h1>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
          <CardContent><Skeleton className="h-20 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead><Skeleton className="h-5 w-20" /></TableHead><TableHead><Skeleton className="h-5 w-32" /></TableHead><TableHead className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableHead></TableRow></TableHeader>
              <TableBody>{[...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-5 w-40" /></TableCell><TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell></TableRow>)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
     return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-semibold">Rekap Absensi</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Memuat Absensi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Rekap Absensi</h1>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kehadiran</CardTitle>
            <CardDescription>Ringkasan kehadiran Anda ({summary.totalRecords} catatan).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div><p className="text-2xl font-bold">{summary.present}</p><p className="text-sm text-muted-foreground">Hadir</p></div>
                <div><p className="text-2xl font-bold">{summary.sick}</p><p className="text-sm text-muted-foreground">Sakit</p></div>
                <div><p className="text-2xl font-bold">{summary.permit}</p><p className="text-sm text-muted-foreground">Izin</p></div>
                <div><p className="text-2xl font-bold">{summary.absent}</p><p className="text-sm text-muted-foreground">Alpa</p></div>
            </div>
            <div className="pt-2">
                <div className="flex justify-between mb-1"><Label htmlFor="attendance-progress">Persentase Kehadiran</Label><span className="text-sm font-medium">{summary.percentage}%</span></div>
                <Progress value={summary.percentage} id="attendance-progress" className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kehadiran</CardTitle>
          <CardDescription>Lihat riwayat kehadiran Anda per mata pelajaran.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.length > 0 ? attendanceRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{format(new Date(record.date), 'dd MMM yyyy', { locale: LocaleID })}</TableCell>
                  <TableCell>{record.subject_name}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                        <div className="flex flex-col items-center justify-center">
                           <CalendarX2 className="h-12 w-12 text-muted-foreground mb-2" />
                            Riwayat kehadiran tidak ditemukan.
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
