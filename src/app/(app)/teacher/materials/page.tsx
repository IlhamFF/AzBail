'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileText } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const uploadedMaterials = [
  { id: 'M1', title: 'Modul 1 - Aljabar Dasar', subject: 'Matematika', class: '10A', file: 'modul_1_aljabar.pdf' },
  { id: 'M2', title: 'Presentasi Puisi', subject: 'Bahasa Indonesia', class: '11B', file: 'presentasi_puisi.pptx' },
];

export default function TeacherMaterialsPage() {
  // Add state for form inputs, file uploads
  // Add functions for handling file selection and upload

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload Materi Pelajaran</h1>

      <Card>
        <CardHeader>
          <CardTitle>Form Upload Materi</CardTitle>
          <CardDescription>Unggah materi pelajaran untuk siswa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Materi</Label>
              <Input id="title" placeholder="Contoh: Modul Bab 1" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="subject">Mata Pelajaran</Label>
                <Select>
                    <SelectTrigger id="subject"><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="math">Matematika</SelectItem>
                    <SelectItem value="indo">Bahasa Indonesia</SelectItem>
                    {/* Add more subjects */}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="class">Target Kelas</Label>
                <Select>
                    <SelectTrigger id="class"><SelectValue placeholder="Pilih Kelas (Opsional)" /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    <SelectItem value="10a">Kelas 10A</SelectItem>
                    <SelectItem value="11b">Kelas 11B</SelectItem>
                    {/* Add more classes */}
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                 <Label htmlFor="file">Pilih File</Label>
                 <Input id="file" type="file" className="pt-1.5" />
             </div>
          </div>
           <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea id="description" placeholder="Deskripsi singkat tentang materi..." />
            </div>
          <div className="flex justify-end">
            <Button><UploadCloud className="mr-2 h-4 w-4" /> Upload Materi</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Materi yang Sudah Diupload</CardTitle>
          <CardDescription>Daftar materi yang telah Anda unggah.</CardDescription>
        </CardHeader>
        <CardContent>
           <ul className="space-y-3">
                {uploadedMaterials.map(material => (
                  <li key={material.id} className="p-3 border rounded-md flex justify-between items-start">
                     <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4"/> {material.title}</h3>
                        <p className="text-sm text-muted-foreground">Mapel: {material.subject} • Kelas: {material.class}</p>
                        <p className="text-xs text-muted-foreground">File: {material.file}</p>
                     </div>
                     <div className="flex gap-2">
                         <Button variant="outline" size="sm">Edit</Button>
                         <Button variant="destructive" size="sm">Hapus</Button>
                     </div>
                  </li>
                ))}
                 {uploadedMaterials.length === 0 && <p className="text-muted-foreground text-center">Belum ada materi yang diupload.</p>}
             </ul>
             {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
