'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Placeholder data - replace with actual data fetching
const teacherSchedule = [
  { day: 'Senin', time: '07:00 - 08:30', class: '10A', subject: 'Matematika' },
  { day: 'Senin', time: '09:00 - 10:30', class: '11B', subject: 'Matematika' },
  { day: 'Selasa', time: '07:00 - 08:30', class: '10A', subject: 'Matematika' },
  { day: 'Rabu', time: '10:30 - 12:00', class: '11B', subject: 'Matematika' },
  { day: 'Kamis', time: '07:00 - 08:30', class: '10A', subject: 'Matematika' },
];

export default function TeacherSchedulePage() {
  // Add state and functions for data fetching

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Jadwal Mengajar</h1>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Anda</CardTitle>
          <CardDescription>Berikut adalah jadwal mengajar Anda untuk minggu ini.</CardDescription>
           {/* Add Filtering/Searching components if needed */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherSchedule.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.day}</TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell><Badge variant="secondary">{item.class}</Badge></TableCell>
                  <TableCell>{item.subject}</TableCell>
                </TableRow>
              ))}
               {teacherSchedule.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={4} className="text-center text-muted-foreground">
                       Jadwal mengajar tidak ditemukan.
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
