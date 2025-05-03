'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, User } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const classes = [
  { id: 'C1', name: 'Kelas 10A', homeroomTeacher: 'Budi Santoso', studentCount: 30 },
  { id: 'C2', name: 'Kelas 11B', homeroomTeacher: 'Rina Wijaya', studentCount: 28 },
  { id: 'C3', name: 'Kelas 12 IPA 1', homeroomTeacher: 'Agus Setiawan', studentCount: 32 },
];

export default function ManageClassesPage() {
  // Add state and functions for data fetching, CRUD operations, assigning teachers/students

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Kelas Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kelas</CardTitle>
          <CardDescription>Kelola kelas, wali kelas, dan siswa di setiap kelas.</CardDescription>
          {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
          {/* Replace with actual Card list or Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                     <User className="h-4 w-4" /> Wali Kelas: {cls.homeroomTeacher}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                     <Users className="h-4 w-4" /> {cls.studentCount} Siswa
                  </div>
                  <Button variant="outline" size="sm">Kelola</Button>
                </CardContent>
              </Card>
            ))}
             {classes.length === 0 && <p className="text-muted-foreground col-span-full text-center">Belum ada data kelas.</p>}
          </div>
          {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Add Modals/Dialogs for Add/Edit Class, Assign Teacher/Students */}
    </div>
  );
}
