'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

// Placeholder data - replace with actual data fetching
const students = [
  { id: 'S1', name: 'Ahmad Subarjo', currentGrade: null },
  { id: 'S2', name: 'Budi Doremi', currentGrade: null },
  { id: 'S3', name: 'Citra Kirana', currentGrade: null },
];

export default function TeacherGradesPage() {
  // Add state for selected class, subject, assignment, and student grades
  // Add functions for fetching data and saving grades

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Input Nilai Siswa</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas dan Mata Pelajaran</CardTitle>
          <CardDescription>Pilih kelas, mata pelajaran, dan jenis penilaian untuk mulai input nilai.</CardDescription>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
             <Select>
                <SelectTrigger><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10a">Kelas 10A</SelectItem>
                  <SelectItem value="11b">Kelas 11B</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger><SelectValue placeholder="Pilih Mata Pelajaran" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Matematika</SelectItem>
                  <SelectItem value="indo">Bahasa Indonesia</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger><SelectValue placeholder="Pilih Penilaian" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uh1">Ulangan Harian 1</SelectItem>
                  <SelectItem value="uts">Ujian Tengah Semester</SelectItem>
                  <SelectItem value="uas">Ujian Akhir Semester</SelectItem>
                   <SelectItem value="tugas1">Tugas 1</SelectItem>
                </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent>
           <CardTitle className="text-xl mb-4">Daftar Siswa</CardTitle>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="w-[120px]">Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="h-8"
                      // Add state management for grades here
                      // value={student.currentGrade || ''}
                      // onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      placeholder="0-100"
                    />
                  </TableCell>
                </TableRow>
              ))}
               {students.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={2} className="text-center text-muted-foreground">
                       Pilih kelas dan mapel terlebih dahulu.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
           <div className="flex justify-end mt-6">
               <Button>Simpan Nilai</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
