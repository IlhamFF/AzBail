'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Placeholder data - replace with actual data fetching
const students = [
  { id: 'S1', nis: '1001', name: 'Ahmad Subarjo', class: '10A', status: 'Aktif' },
  { id: 'S2', nis: '1002', name: 'Budi Doremi', class: '10A', status: 'Aktif' },
  { id: 'S3', nis: '1101', name: 'Citra Kirana', class: '11B', status: 'Aktif' },
  { id: 'S4', nis: '1102', name: 'Dewi Lestari', class: '11B', status: 'Non-Aktif' },
];

export default function StaffManageStudentsPage() {
  // Add state for search, filters, pagination, and student list
  // Add functions for fetching data, CRUD operations

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Manajemen Data Siswa</h1>
        <div className="flex gap-2">
           <div className="relative w-full sm:w-auto">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Cari siswa (NIS/Nama)..." className="pl-8 w-full sm:w-[250px]" />
           </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Siswa
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>Kelola data induk siswa.</CardDescription>
           {/* Add Filter dropdowns (by class, status) if needed */}
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIS</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.nis}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                     <Badge variant={student.status === 'Aktif' ? 'default' : 'destructive'}>
                       {student.status}
                     </Badge>
                   </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Hapus</span>
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
               {students.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center text-muted-foreground">
                       Data siswa tidak ditemukan.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
           {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Add Modals/Dialogs for Add/Edit Student */}
    </div>
  );
}
