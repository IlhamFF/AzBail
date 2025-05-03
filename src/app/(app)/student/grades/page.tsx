'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Placeholder data - replace with actual data fetching based on logged-in student
const studentGrades = {
  'Matematika': [
    { type: 'UH 1', score: 85, status: 'Lulus' },
    { type: 'Tugas 1', score: 90, status: 'Lulus' },
    { type: 'UTS', score: 78, status: 'Lulus' },
  ],
  'Bahasa Indonesia': [
    { type: 'UH 1', score: 92, status: 'Lulus' },
    { type: 'UTS', score: 88, status: 'Lulus' },
  ],
  'Fisika': [
     { type: 'UH 1', score: 70, status: 'Lulus' },
     { type: 'UTS', score: 65, status: 'Remedial' },
  ],
};

// Calculate average grade (example)
const calculateAverage = (grades: { score: number | null }[]): number | string => {
  const validGrades = grades.filter(g => g.score !== null).map(g => g.score as number);
  if (validGrades.length === 0) return '-';
  const sum = validGrades.reduce((a, b) => a + b, 0);
  return (sum / validGrades.length).toFixed(1);
};


export default function StudentGradesPage() {
  // Add state and functions for data fetching

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Nilai Akademik</h1>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Nilai Anda</CardTitle>
          <CardDescription>Lihat rincian nilai Anda per mata pelajaran.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(studentGrades).map(([subject, grades]) => (
              <AccordionItem value={subject} key={subject}>
                <AccordionTrigger className="text-lg">
                   <div className="flex justify-between w-full pr-4 items-center">
                       <span>{subject}</span>
                       <Badge variant="secondary">Rata-rata: {calculateAverage(grades)}</Badge>
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis Penilaian</TableHead>
                        <TableHead className="text-right">Nilai</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.map((grade, index) => (
                        <TableRow key={index}>
                          <TableCell>{grade.type}</TableCell>
                          <TableCell className="text-right font-medium">{grade.score ?? '-'}</TableCell>
                          <TableCell className="text-right">
                             <Badge variant={grade.status === 'Lulus' ? 'default' : grade.status === 'Remedial' ? 'destructive' : 'outline'}>
                               {grade.status ?? '-'}
                             </Badge>
                           </TableCell>
                        </TableRow>
                      ))}
                       {grades.length === 0 && (
                           <TableRow>
                               <TableCell colSpan={3} className="text-center text-muted-foreground">
                                   Belum ada nilai untuk mata pelajaran ini.
                               </TableCell>
                           </TableRow>
                       )}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
            {Object.keys(studentGrades).length === 0 && (
                <p className="text-center text-muted-foreground py-4">Data nilai belum tersedia.</p>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
