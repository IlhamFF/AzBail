'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale'; // Import Indonesian locale

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  target_role: string | null;
  // Optionally join user_details to get creator name
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
      if (!user) {
         setLoading(false);
         return;
      };

      setLoading(true);
      setError(null);

      try {
         let query = supabase
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
          .or(`target_role.is.null,target_role.eq.${userRole}`)
          .order('is_pinned', { ascending: false }) // Pinned first
          .order('created_at', { ascending: false }); // Then by date

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        // Map data to include creator name directly
        const formattedData = data?.map(ann => ({
           ...ann,
           created_by_name: (ann.user_details as any)?.full_name || 'Sistem', // Handle potential null details
        })) || [];

        setAnnouncements(formattedData);
      } catch (err: any) {
        console.error('Error fetching announcements:', err);
        setError('Gagal memuat pengumuman.');
      } finally {
        setLoading(false);
      }
    };

     if (!authLoading) {
       fetchAnnouncements();
     }

  }, [user, authLoading, userRole]);

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
        <Card className="bg-destructive/10 border-destructive">
          <CardContent className="p-4 text-destructive-foreground">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && announcements.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Tidak ada pengumuman saat ini.
          </CardContent>
        </Card>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <Card key={ann.id} className={ann.is_pinned ? 'border-accent' : ''}>
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
              {/* Add footer for actions if needed */}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
