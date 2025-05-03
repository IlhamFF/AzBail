'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

// Placeholder data - replace with actual data fetching
const students = [
  { id: 'S1', name: 'Ahmad Subarjo', status: null },
  { id: 'S2', name: 'Budi Doremi', status: null },
  { id: 'S3', name: 'Citra Kirana', status: null },
];

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export default function TeacherAttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});

  // Add state for selected class, subject
  // Add functions for fetching data and saving attendance

   const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Input Absensi Siswa</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Kelas, Mata Pelajaran, dan Tanggal</CardTitle>
          <CardDescription>Pilih kelas, mata pelajaran, dan tanggal untuk merekam absensi.</CardDescription>
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
              <Popover>
                  <PopoverTrigger asChild>
                      <Button
                      variant={"outline"}
                      className={cn(
                          "justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                      )}
                      >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                      <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      />
                  </PopoverContent>
              </Popover>
          </div>
        </CardHeader>
        <CardContent>
           <CardTitle className="text-xl mb-4">Daftar Siswa</CardTitle>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Siswa</TableHead>
                <TableHead className="text-right">Status Kehadiran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-right">
                     <RadioGroup
                      defaultValue={attendance[student.id] ?? undefined}
                      onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                      className="flex justify-end space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Hadir" id={`hadir-${student.id}`} />
                        <Label htmlFor={`hadir-${student.id}`} className="text-xs">Hadir</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Sakit" id={`sakit-${student.id}`} />
                        <Label htmlFor={`sakit-${student.id}`} className="text-xs">Sakit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Izin" id={`izin-${student.id}`} />
                        <Label htmlFor={`izin-${student.id}`} className="text-xs">Izin</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Alpa" id={`alpa-${student.id}`} />
                        <Label htmlFor={`alpa-${student.id}`} className="text-xs">Alpa</Label>
                      </div>
                    </RadioGroup>
                  </TableCell>
                </TableRow>
              ))}
               {students.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={2} className="text-center text-muted-foreground">
                       Pilih kelas, mapel, dan tanggal terlebih dahulu.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
           <div className="flex justify-end mt-6">
               <Button>Simpan Absensi</Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
