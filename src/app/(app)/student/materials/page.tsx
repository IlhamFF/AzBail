
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, BookMarked, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';

interface Material {
  id: string;
  title: string;
  description?: string | null;
  subject_name: string;
  teacher_name: string;
  upload_date: string; // Keep as string from DB
  file_url: string;
}

export default function StudentMaterialsPage() {
  const { user, loading: authLoading } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) {
        setLoading(false);
        setError("Silakan login untuk melihat materi pelajaran.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // 1. Get student's class_id from student_schedules
        const { data: studentClassData, error: studentClassError } = await supabase
          .from('student_schedules')
          .select('class_id')
          .eq('student_id', user.id)
          .limit(1)
          .maybeSingle();

        if (studentClassError) {
          console.error("Error fetching student's class:", studentClassError);
          throw studentClassError;
        }

        if (!studentClassData?.class_id) {
          setMaterials([]);
          setLoading(false);
          // setError("Anda tidak terdaftar di kelas manapun untuk melihat materi.");
          return;
        }
        const studentClassId = studentClassData.class_id;

        // 2. Fetch materials for that class
        const { data, error: fetchError } = await supabase
          .from('materials')
          .select(`
            id,
            title,
            description,
            upload_date,
            file_url,
            subjects (subject_name),
            users!materials_teacher_id_fkey (user_details (full_name))
          `)
          .eq('class_id', studentClassId) // Filter by student's class
          .order('upload_date', { ascending: false });

        if (fetchError) {
          console.error("Error fetching materials:", fetchError);
          throw fetchError;
        }
        
        const formattedMaterials = data?.map(material => {
            const teacherUserDetails = (material.users as any)?.user_details;
            const teacherName = Array.isArray(teacherUserDetails) 
                                ? (teacherUserDetails[0]?.full_name || 'Guru Tidak Diketahui') 
                                : (teacherUserDetails?.full_name || 'Guru Tidak Diketahui');
            return {
                id: material.id,
                title: material.title,
                description: material.description,
                subject_name: (material.subjects as any)?.subject_name || 'Mapel Tidak Diketahui',
                teacher_name: teacherName,
                upload_date: material.upload_date,
                file_url: material.file_url,
            };
        }) || [];
        
        setMaterials(formattedMaterials);

      } catch (err: any) {
        console.error('Error processing materials data:', err);
        setError(err.message || "Terjadi kesalahan saat memuat materi pelajaran.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchMaterials();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Materi Pelajaran</h1>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-3/4 mt-1" /></CardHeader>
          <CardContent>
             <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-2/5 mt-1" /></CardHeader>
                        <CardContent className="flex justify-between items-center"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-24" /></CardContent>
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
            <h1 className="text-2xl font-semibold">Materi Pelajaran</h1>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Memuat Materi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
     );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Materi Pelajaran</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Materi</CardTitle>
          <CardDescription>Materi pelajaran yang diunggah oleh guru Anda.</CardDescription>
        </CardHeader>
        <CardContent>
           {materials.length > 0 ? (
            <ul className="space-y-3">
                  {materials.map(material => (
                    <Card key={material.id}>
                      <CardHeader>
                          <CardTitle>{material.title}</CardTitle>
                          <CardDescription>
                            Mapel: {material.subject_name} • Guru: {material.teacher_name}
                            {material.description && <p className="text-xs mt-1">Deskripsi: {material.description}</p>}
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">Diupload: {format(new Date(material.upload_date), "dd MMM yyyy, HH:mm", { locale: LocaleID })}</p>
                          <Button variant="outline" size="sm" asChild disabled={!material.file_url}>
                            <a href={material.file_url || '#'} target="_blank" rel="noopener noreferrer" download={material.file_url ? material.title : undefined}>
                                <Download className="mr-2 h-4 w-4" /> Unduh
                            </a>
                          </Button>
                      </CardContent>
                    </Card>
                  ))}
              </ul>
           ) : (
             <div className="text-center text-muted-foreground py-10">
                <div className="flex flex-col items-center justify-center">
                    <BookMarked className="h-12 w-12 text-muted-foreground mb-2" />
                    Belum ada materi yang tersedia untuk kelas Anda.
                </div>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
