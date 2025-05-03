'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

// Placeholder data - replace with actual data fetching based on student's class/subjects
const materials = [
  { id: 'M1', title: 'Modul 1 - Aljabar Dasar', subject: 'Matematika', teacher: 'Budi Santoso', uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), fileUrl: '#' },
  { id: 'M2', title: 'Presentasi Puisi', subject: 'Bahasa Indonesia', teacher: 'Rina Wijaya', uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), fileUrl: '#' },
  { id: 'M3', title: 'Latihan Soal Kinematika', subject: 'Fisika', teacher: 'Agus Setiawan', uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), fileUrl: '#' },
];

export default function StudentMaterialsPage() {
  // Add state and functions for data fetching, filtering by subject

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Materi Pelajaran</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Materi</CardTitle>
          <CardDescription>Materi pelajaran yang diunggah oleh guru Anda.</CardDescription>
           {/* Add Filtering/Searching components here */}
        </CardHeader>
        <CardContent>
           <ul className="space-y-3">
                {materials.map(material => (
                  <Card key={material.id}>
                    <CardHeader>
                         <CardTitle>{material.title}</CardTitle>
                         <CardDescription>Mapel: {material.subject} • Guru: {material.teacher}</CardDescription>
                    </CardHeader>
                     <CardContent className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Diupload: {material.uploadDate.toLocaleDateString('id-ID')}</p>
                        <Button variant="outline" size="sm" asChild>
                           <a href={material.fileUrl} download> {/* Add download attribute */}
                              <Download className="mr-2 h-4 w-4" /> Unduh
                           </a>
                        </Button>
                     </CardContent>
                  </Card>
                ))}
                 {materials.length === 0 && <p className="text-muted-foreground text-center">Belum ada materi yang tersedia.</p>}
             </ul>
             {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
