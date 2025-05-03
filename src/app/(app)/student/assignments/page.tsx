'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Clock, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Placeholder data - replace with actual data fetching based on student's class/assignments
const assignments = [
  { id: 'A1', title: 'Tugas Aljabar 1', subject: 'Matematika', teacher: 'Budi Santoso', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), instructions: 'Kerjakan soal 1-5 di buku latihan.', status: 'Belum Dikumpulkan', submission: null },
  { id: 'A2', title: 'Membuat Puisi', subject: 'Bahasa Indonesia', teacher: 'Rina Wijaya', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), instructions: 'Buatlah puisi dengan tema bebas, minimal 3 bait.', status: 'Belum Dikumpulkan', submission: null },
  { id: 'A3', title: 'Laporan Praktikum', subject: 'Fisika', teacher: 'Agus Setiawan', deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), instructions: 'Upload laporan praktikum kinematika.', status: 'Sudah Dikumpulkan', submission: { file: 'laporan_kinematika.pdf', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } },
  { id: 'A4', title: 'Esai Sejarah', subject: 'Sejarah', teacher: 'Siti Aminah', deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), instructions: 'Tulis esai tentang Perang Diponegoro.', status: 'Terlambat', submission: null },
];

type AssignmentStatus = 'Belum Dikumpulkan' | 'Sudah Dikumpulkan' | 'Terlambat' | 'Dinilai';

export default function StudentAssignmentsPage() {
  // Add state for selected assignment, file upload
  // Add functions for handling file selection and submission

   const getStatusBadge = (status: AssignmentStatus) => {
     switch (status) {
       case 'Belum Dikumpulkan':
         return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Belum Dikumpulkan</Badge>;
       case 'Sudah Dikumpulkan':
         return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Sudah Dikumpulkan</Badge>;
       case 'Terlambat':
         return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Terlambat</Badge>;
       case 'Dinilai':
            return <Badge variant="outline">Dinilai</Badge>; // Or another variant
       default:
         return <Badge variant="outline">{status}</Badge>;
     }
   };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tugas Sekolah</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas Anda</CardTitle>
          <CardDescription>Lihat tugas yang diberikan oleh guru dan kumpulkan jawaban Anda.</CardDescription>
           {/* Add Filtering/Sorting components here */}
        </CardHeader>
        <CardContent>
           <ul className="space-y-4">
                {assignments.map(assignment => (
                  <Card key={assignment.id} className={assignment.status === 'Terlambat' ? 'border-destructive' : ''}>
                    <CardHeader>
                         <div className="flex justify-between items-start">
                            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> {assignment.title}</CardTitle>
                            {getStatusBadge(assignment.status as AssignmentStatus)}
                         </div>
                         <CardDescription>Mapel: {assignment.subject} • Guru: {assignment.teacher}</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Instruksi:</span> {assignment.instructions}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                           <Clock className="h-4 w-4" /> Batas Waktu: {format(assignment.deadline, "dd MMM yyyy, HH:mm", { locale: id })}
                        </p>
                        {assignment.submission && (
                            <p className="text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" /> Dikumpulkan: {assignment.submission.file} ({format(assignment.submission.date, "dd MMM yyyy", { locale: id })})
                            </p>
                        )}
                     </CardContent>
                     <CardFooter className="flex justify-end">
                        {assignment.status === 'Belum Dikumpulkan' || assignment.status === 'Terlambat' ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Kumpulkan Tugas</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                    <DialogTitle>Kumpulkan Tugas: {assignment.title}</DialogTitle>
                                    <DialogDescription>
                                        Upload file jawaban Anda. Pastikan sesuai instruksi.
                                    </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="file-upload" className="text-right">
                                        File
                                        </Label>
                                        <Input id="file-upload" type="file" className="col-span-3" />
                                    </div>
                                    {/* Add optional notes field if needed */}
                                    </div>
                                    <DialogFooter>
                                    <Button type="submit">Upload Jawaban</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Button size="sm" variant="outline" disabled>Lihat Detail</Button> // Or view submission details
                        )}
                     </CardFooter>
                  </Card>
                ))}
                 {assignments.length === 0 && <p className="text-muted-foreground text-center">Belum ada tugas yang diberikan.</p>}
             </ul>
             {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
