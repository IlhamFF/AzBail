'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PlusCircle, FileText, Calendar as CalendarIcon, UploadCloud } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const assignments = [
  { id: 'A1', title: 'Tugas Aljabar 1', subject: 'Matematika', class: '10A', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
  { id: 'A2', title: 'Membuat Puisi', subject: 'Bahasa Indonesia', class: '11B', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];

export default function TeacherAssignmentsPage() {
  const [deadline, setDeadline] = useState<Date | undefined>();
  // Add state for other form inputs, file uploads, and assignment list
  // Add functions for handling form submission, file selection, upload, etc.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Kelola Tugas</h1>
        {/* Add Button to trigger a Dialog/Sheet for creating new assignment */}
        <Button><PlusCircle className="mr-2 h-4 w-4" /> Buat Tugas Baru</Button>
      </div>

       {/* Consider putting the "Create Assignment" form in a Dialog or Sheet */}
       <Card>
        <CardHeader>
          <CardTitle>Form Buat Tugas Baru</CardTitle>
          <CardDescription>Isi detail tugas yang akan diberikan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="title">Judul Tugas</Label>
              <Input id="title" placeholder="Contoh: Latihan Soal Bab 1" />
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
                    <SelectTrigger id="class"><SelectValue placeholder="Pilih Kelas" /></SelectTrigger>
                    <SelectContent>
                     <SelectItem value="10a">Kelas 10A</SelectItem>
                     <SelectItem value="11b">Kelas 11B</SelectItem>
                     {/* Add more classes */}
                    </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                 <Label htmlFor="deadline">Batas Waktu Pengumpulan</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      id="deadline"
                      variant={"outline"}
                      className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadline && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                      />
                  </PopoverContent>
              </Popover>
             </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="instructions">Instruksi Tugas</Label>
              <Textarea id="instructions" placeholder="Jelaskan instruksi tugas di sini..." />
          </div>
           <div className="space-y-2">
                 <Label htmlFor="file">Lampiran File (Opsional)</Label>
                 <Input id="file" type="file" className="pt-1.5" />
             </div>
          <div className="flex justify-end">
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Simpan Tugas</Button>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Daftar Tugas yang Diberikan</CardTitle>
          <CardDescription>Lihat dan kelola tugas yang telah Anda buat.</CardDescription>
        </CardHeader>
        <CardContent>
           <ul className="space-y-3">
                {assignments.map(assignment => (
                  <Card key={assignment.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> {assignment.title}</CardTitle>
                        <CardDescription>Mapel: {assignment.subject} • Kelas: {assignment.class}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Batas Waktu: {format(assignment.deadline, "dd MMM yyyy, HH:mm", { locale: require('date-fns/locale/id')})}</p>
                        {/* Add more details like instructions snippet */}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button variant="outline" size="sm">Lihat Pengumpulan</Button>
                         <Button variant="outline" size="sm">Edit</Button>
                         <Button variant="destructive" size="sm">Hapus</Button>
                     </CardFooter>
                  </Card>
                ))}
                 {assignments.length === 0 && <p className="text-muted-foreground text-center">Belum ada tugas yang dibuat.</p>}
             </ul>
             {/* Add Pagination if needed */}
        </CardContent>
      </Card>
    </div>
  );
}
