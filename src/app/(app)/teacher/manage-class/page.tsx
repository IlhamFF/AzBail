'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const teacherClasses = [
  { id: 'C1', name: 'Kelas 10A', studentCount: 30 },
  { id: 'C2', name: 'Kelas 11B', studentCount: 28 },
];

export default function TeacherManageClassPage() {
  // Add state and functions for viewing students, grades, attendance per class

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Kelas yang Anda Ajar</CardTitle>
          <CardDescription>Lihat daftar siswa, input nilai, dan kelola absensi per kelas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherClasses.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                   <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground">
                     <Users className="h-4 w-4" /> {cls.studentCount} Siswa
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm">Lihat Siswa</Button>
                  <Button variant="outline" size="sm">Input Nilai</Button>
                   <Button variant="outline" size="sm">Input Absensi</Button>
                </CardContent>
              </Card>
            ))}
             {teacherClasses.length === 0 && <p className="text-muted-foreground col-span-full text-center">Anda belum ditugaskan ke kelas manapun.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
