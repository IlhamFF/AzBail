'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use browser client
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale'; // Import Indonesian locale
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  target_role: string | null;
  // Joined user_details for creator name
  created_by_name?: string;
}

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user || !userRole) {
         setLoading(false);
         return; // Don't fetch if user or role is not available yet
      }

      setLoading(true);
      setError(null);

      try {
         // Use browser client to fetch data
         // RLS policies in Supabase will enforce access control
         const { data, error: fetchError } = await supabase
          .from('announcements')
          .select(`
            id,
            title,
            content,
            created_at,
            is_pinned,
            target_role,
            user_details ( full_name )
          `)
          // Filter based on target_role: show if null (for all) or matches user's role
          // Using .or() requires the column name to be specified for each condition
          .or(`target_role.is.null,target_role.eq.${userRole}`)
          .order('is_pinned', { ascending: false }) // Pinned first
          .order('created_at', { ascending: false }); // Then by date

        if (fetchError) {
          throw fetchError;
        }

        // Map data to include creator name directly
        const formattedData = data?.map(ann => ({
           ...ann,
           // Access joined data correctly - Supabase returns it as an object or array
           created_by_name: (ann.user_details as any)?.full_name || 'Sistem',
        })) || [];

        setAnnouncements(formattedData);
      } catch (err: any) {
        console.error('Error fetching announcements:', err);
        setError('Gagal memuat pengumuman. Pastikan Anda memiliki koneksi internet dan coba lagi.');
      } finally {
        setLoading(false);
      }
    };

     // Fetch data only when auth loading is complete and user is available
     if (!authLoading && user) {
       fetchAnnouncements();
     } else if (!authLoading && !user) {
         // If auth is done loading but there's no user, stop loading state
         setLoading(false);
         setError("Anda harus login untuk melihat pengumuman.");
     }

  }, [user, authLoading, userRole]); // Add userRole to dependency array

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pengumuman</h1>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
             <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
               <CardFooter>
                   <Skeleton className="h-4 w-24" />
               </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && announcements.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Tidak ada pengumuman yang relevan untuk Anda saat ini.
          </CardContent>
        </Card>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className={ann.is_pinned ? 'border-2 border-accent' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                   <CardTitle>{ann.title}</CardTitle>
                   {ann.is_pinned && <Badge variant="default" className="bg-accent text-accent-foreground">Penting</Badge>}
                </div>
                <CardDescription>
                   Diposting oleh {ann.created_by_name} • {' '}
                  {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: id })}
                </CardDescription>
                 {ann.target_role && (
                     <Badge variant="secondary" className="w-fit mt-1">Untuk: {ann.target_role}</Badge>
                 )}
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm">
                {ann.content}
              </CardContent>
              {/* Add footer for actions if needed (e.g., Admin edit/delete) */}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    