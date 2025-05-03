'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookOpen } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const subjects = [
  { id: 'S1', name: 'Matematika Wajib', code: 'MTK-W', description: 'Matematika dasar untuk semua jurusan.' },
  { id: 'S2', name: 'Bahasa Indonesia', code: 'BIND', description: 'Pelajaran Bahasa dan Sastra Indonesia.' },
  { id: 'S3', name: 'Fisika', code: 'FIS', description: 'Pelajaran Fisika untuk jurusan IPA.' },
];

export default function ManageSubjectsPage() {
  // Add state and functions for data fetching, CRUD operations

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manajemen Mata Pelajaran</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Mata Pelajaran
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Pelajaran</CardTitle>
          <CardDescription>Kelola mata pelajaran yang diajarkan di sekolah.</CardDescription>
          {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
          {/* Replace with actual Table */}
          <div className="border rounded-md p-4">
            <p className="text-muted-foreground mb-2">Tabel daftar mata pelajaran akan ditampilkan di sini.</p>
             <ul className="space-y-2">
                {subjects.map(subject => (
                  <li key={subject.id} className="p-3 border rounded-md flex justify-between items-start">
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><BookOpen className="h-4 w-4"/> {subject.name} ({subject.code})</h3>
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                     </div>
                     <div className="flex gap-2">
                         <Button variant="outline" size="sm">Edit</Button>
                         <Button variant="destructive" size="sm">Hapus</Button>
                     </div>
                  </li>
                ))}
                 {subjects.length === 0 && <p className="text-muted-foreground text-center">Belum ada data mata pelajaran.</p>}
             </ul>
          </div>
          {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Add Modals/Dialogs for Add/Edit/Delete Subject */}
    </div>
  );
}
