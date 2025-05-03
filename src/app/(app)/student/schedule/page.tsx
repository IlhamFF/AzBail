'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Placeholder data - replace with actual data fetching based on logged-in student's class
const studentSchedule = [
  { day: 'Senin', time: '07:00 - 08:30', subject: 'Matematika', teacher: 'Budi Santoso' },
  { day: 'Senin', time: '08:30 - 10:00', subject: 'Bahasa Indonesia', teacher: 'Rina Wijaya' },
  { day: 'Selasa', time: '07:00 - 08:30', subject: 'Fisika', teacher: 'Agus Setiawan' },
  // Add more schedule items
];

export default function StudentSchedulePage() {
  // Add state and functions for data fetching

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
              {studentSchedule.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.day}</TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{item.teacher}</TableCell>
                </TableRow>
              ))}
               {studentSchedule.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={4} className="text-center text-muted-foreground">
                       Jadwal pelajaran tidak ditemukan.
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
