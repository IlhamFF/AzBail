
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, Workflow } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TeacherClass {
  id: string; // class id
  name: string;
  studentCount: number | null; // Null if count fails or no students
}

export default function TeacherManageClassPage() {
  const { user, loading: authLoading } = useAuth();
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!user?.id) {
        setLoading(false);
        setError("Pengguna tidak terautentikasi.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // 1. Fetch classes where the current user is the homeroom teacher
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('homeroom_teacher_id', user.id);

        if (classesError) {
          console.error("Error fetching teacher's classes:", classesError);
          throw classesError;
        }

        if (!classesData || classesData.length === 0) {
          setTeacherClasses([]);
          setLoading(false);
          return;
        }

        // 2. For each class, fetch the student count
        const classesWithStudentCount = await Promise.all(
          classesData.map(async (cls) => {
            const { count, error: countError } = await supabase
              .from('user_details') // Assuming students are in user_details
              .select('id', { count: 'exact', head: true })
              .eq('class_id', cls.id)
              .eq('role', 'Siswa'); // Assuming role is in user_details or you join with users table

            if (countError) {
              console.warn(`Warning: Could not fetch student count for class ${cls.name}:`, countError.message);
              return { ...cls, studentCount: null };
            }
            return { ...cls, studentCount: count };
          })
        );
        setTeacherClasses(classesWithStudentCount);

      } catch (err: any) {
        console.error('Error processing teacher classes data:', err);
        setError(err.message || 'Terjadi kesalahan saat memuat data kelas.');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchTeacherClasses();
    } else if (!authLoading && !user) {
        setLoading(false);
        setError("Silakan login untuk mengelola kelas Anda.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/5" />
                    <Skeleton className="h-4 w-1/4 mt-1" />
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Memuat Kelas</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Manajemen Kelas</h1>

      <Card>
        <CardHeader>
          <CardTitle>Kelas yang Anda Ajar (sebagai Wali Kelas)</CardTitle>
          <CardDescription>Lihat daftar siswa, input nilai, dan kelola absensi per kelas.</CardDescription>
        </CardHeader>
        <CardContent>
          {teacherClasses.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
              <div className="flex flex-col items-center justify-center">
                <Workflow className="h-12 w-12 text-muted-foreground mb-2" />
                Anda belum ditugaskan sebagai wali kelas untuk kelas manapun.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teacherClasses.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm text-muted-foreground pt-1">
                    <Users className="h-4 w-4" /> {cls.studentCount ?? 'Memuat...'} Siswa
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" size="sm" disabled>Lihat Siswa</Button>
                  <Button variant="outline" size="sm" disabled>Input Nilai</Button>
                  <Button variant="outline" size="sm" disabled>Input Absensi</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    