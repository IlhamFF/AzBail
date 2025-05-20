
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, BookOpenCheck } from 'lucide-react';

interface GradeItem {
  id: string;
  assessment_type: string;
  score: number | null;
  status: string; // Example: 'Lulus', 'Remedial', could be derived
}

interface SubjectGrades {
  [subjectName: string]: GradeItem[];
}

export default function StudentGradesPage() {
  const { user, loading: authLoading } = useAuth();
  const [gradesBySubject, setGradesBySubject] = useState<SubjectGrades>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAverage = (gradesList: GradeItem[]): string => {
    const validGrades = gradesList.filter(g => typeof g.score === 'number').map(g => g.score as number);
    if (validGrades.length === 0) return '-';
    const sum = validGrades.reduce((a, b) => a + b, 0);
    return (sum / validGrades.length).toFixed(1);
  };

  // Helper to determine status based on score, can be adjusted
  const determineGradeStatus = (score: number | null): string => {
    if (score === null || score === undefined) return '-';
    if (score >= 75) return 'Lulus'; // KKM 75
    return 'Remedial';
  };


  useEffect(() => {
    const fetchGrades = async () => {
      if (!user) {
        setLoading(false);
        setError("Silakan login untuk melihat nilai Anda.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('grades')
          .select(`
            id,
            assessment_type,
            score,
            subjects (subject_name)
          `)
          .eq('student_id', user.id); // Assuming grades table has student_id as FK to auth.users.id

        if (fetchError) {
          console.error("Error fetching grades:", fetchError);
          throw fetchError;
        }

        const groupedGrades: SubjectGrades = {};
        data?.forEach(grade => {
          const subjectName = (grade.subjects as any)?.subject_name || 'Mata Pelajaran Tidak Diketahui';
          if (!groupedGrades[subjectName]) {
            groupedGrades[subjectName] = [];
          }
          groupedGrades[subjectName].push({
            id: grade.id,
            assessment_type: grade.assessment_type,
            score: grade.score,
            status: determineGradeStatus(grade.score),
          });
        });
        setGradesBySubject(groupedGrades);

      } catch (err: any) {
        console.error('Error processing grades data:', err);
        setError(err.message || "Terjadi kesalahan saat memuat data nilai.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchGrades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Nilai Akademik</h1>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
          <CardContent>
             <div className="space-y-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
     return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-2xl font-semibold">Nilai Akademik</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Memuat Nilai</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Nilai Akademik</h1>

      <Card>
        <CardHeader>
          <CardTitle>Rekap Nilai Anda</CardTitle>
          <CardDescription>Lihat rincian nilai Anda per mata pelajaran.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(gradesBySubject).length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {Object.entries(gradesBySubject).map(([subject, grades]) => (
                <AccordionItem value={subject} key={subject}>
                  <AccordionTrigger className="text-lg hover:no-underline">
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
                        {grades.length > 0 ? grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>{grade.assessment_type}</TableCell>
                            <TableCell className="text-right font-medium">{grade.score ?? '-'}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={grade.status === 'Lulus' ? 'default' : grade.status === 'Remedial' ? 'destructive' : 'outline'}>
                                  {grade.status ?? '-'}
                                </Badge>
                            </TableCell>
                          </TableRow>
                        )) : (
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
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
                <div className="flex flex-col items-center justify-center">
                    <BookOpenCheck className="h-12 w-12 text-muted-foreground mb-2" />
                    Data nilai belum tersedia.
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
