'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';

// Placeholder data - replace with actual data fetching based on logged-in student
const attendanceRecords = [
  { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), subject: 'Matematika', status: 'Hadir' },
  { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), subject: 'Bahasa Indonesia', status: 'Hadir' },
  { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), subject: 'Fisika', status: 'Sakit' },
  { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), subject: 'Matematika', status: 'Hadir' },
  { date: new Date(), subject: 'Bahasa Indonesia', status: 'Hadir' },
  { date: new Date(), subject: 'Fisika', status: 'Alpa' },
];

// Calculate attendance summary (example)
const calculateSummary = (records: { status: string }[]) => {
  const total = records.length;
  if (total === 0) return { present: 0, sick: 0, permit: 0, absent: 0, percentage: 0 };

  const present = records.filter(r => r.status === 'Hadir').length;
  const sick = records.filter(r => r.status === 'Sakit').length;
  const permit = records.filter(r => r.status === 'Izin').length;
  const absent = records.filter(r => r.status === 'Alpa').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return { present, sick, permit, absent, percentage };
};

export default function StudentAttendancePage() {
  // Add state and functions for data fetching and filtering
  const summary = calculateSummary(attendanceRecords);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Hadir': return 'default'; // Greenish or primary
          case 'Sakit': return 'secondary'; // Yellowish or secondary
          case 'Izin': return 'outline'; // Bluish or outline
          case 'Alpa': return 'destructive'; // Reddish or destructive
          default: return 'outline';
      }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rekap Absensi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Kehadiran</CardTitle>
          <CardDescription>Ringkasan kehadiran Anda selama periode ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                 <p className="text-2xl font-bold">{summary.present}</p>
                 <p className="text-sm text-muted-foreground">Hadir</p>
              </div>
              <div>
                 <p className="text-2xl font-bold">{summary.sick}</p>
                 <p className="text-sm text-muted-foreground">Sakit</p>
              </div>
               <div>
                 <p className="text-2xl font-bold">{summary.permit}</p>
                 <p className="text-sm text-muted-foreground">Izin</p>
              </div>
               <div>
                 <p className="text-2xl font-bold">{summary.absent}</p>
                 <p className="text-sm text-muted-foreground">Alpa</p>
              </div>
           </div>
           <div className="pt-2">
               <div className="flex justify-between mb-1">
                   <Label>Persentase Kehadiran</Label>
                   <span className="text-sm font-medium">{summary.percentage}%</span>
               </div>
               <Progress value={summary.percentage} className="h-2" />
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kehadiran</CardTitle>
          <CardDescription>Lihat riwayat kehadiran Anda per mata pelajaran.</CardDescription>
           {/* Add Filtering/Searching by date or subject */}
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
              {attendanceRecords.sort((a, b) => b.date.getTime() - a.date.getTime()).map((record, index) => ( // Sort by date descending
                <TableRow key={index}>
                  <TableCell>{format(record.date, 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{record.subject}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
               {attendanceRecords.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center text-muted-foreground">
                       Riwayat kehadiran tidak ditemukan.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
           {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
