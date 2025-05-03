'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client'; // Use client for fetching
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: any | null;
  user_email?: string; // Added for display
}

const ITEMS_PER_PAGE = 15;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users ( email )
        `, { count: 'exact' }) // Get total count
        .order('timestamp', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      // Apply search (simple search on action and details for now)
      // Note: Searching JSONB efficiently might require specific indexing in Supabase
      if (searchTerm) {
         // This is a basic search, might be slow on large datasets
         // Consider using Supabase functions or full-text search for better performance
         query = query.or(`action.ilike.%${searchTerm}%,details->>message.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const formattedData = data?.map(log => ({
        ...log,
        user_email: (log.users as any)?.email || 'Sistem', // Access nested email safely
      })) || [];

      setLogs(formattedData);
      setTotalCount(count || 0); // Set total count for pagination

    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError('Gagal memuat log aktivitas.');
    } finally {
      setLoading(false);
    }
  };

   // Fetch logs on initial load and when filters/page change
   useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterAction, searchTerm]); // Add dependencies

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleFilterChange = (value: string) => {
    setFilterAction(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

   const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };


  // Get unique action types for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Log Aktivitas Sistem</h1>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Aktivitas</CardTitle>
          <CardDescription>Lihat riwayat aktivitas penting yang terjadi dalam sistem.</CardDescription>
          {/* Filtering and Searching */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Input
              placeholder="Cari (Aksi, Detail)..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
            <Select value={filterAction} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                 {/* Dynamically generate action filters based on fetched data if needed, or predefine common ones */}
                <SelectItem value="CREATE_ANNOUNCEMENT">Buat Pengumuman</SelectItem>
                <SelectItem value="UPDATE_ANNOUNCEMENT">Update Pengumuman</SelectItem>
                <SelectItem value="DELETE_ANNOUNCEMENT">Hapus Pengumuman</SelectItem>
                <SelectItem value="PIN_ANNOUNCEMENT">Pin Pengumuman</SelectItem>
                <SelectItem value="VERIFY_USER">Verifikasi Pengguna</SelectItem>
                <SelectItem value="DELETE_USER">Hapus Pengguna</SelectItem>
                <SelectItem value="CREATE_CLASS">Buat Kelas</SelectItem>
                <SelectItem value="UPDATE_CLASS">Update Kelas</SelectItem>
                <SelectItem value="DELETE_CLASS">Hapus Kelas</SelectItem>
                <SelectItem value="CREATE_SUBJECT">Buat Mapel</SelectItem>
                <SelectItem value="UPDATE_SUBJECT">Update Mapel</SelectItem>
                <SelectItem value="DELETE_SUBJECT">Hapus Mapel</SelectItem>
                {/* Add more specific actions as needed */}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Tipe Target</TableHead>
                  <TableHead>ID Target</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive">{error}</TableCell>
                  </TableRow>
                )}
                {!loading && !error && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Tidak ada data log aktivitas yang cocok dengan filter/pencarian.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                       {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: id })}
                    </TableCell>
                    <TableCell className="text-xs">{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs whitespace-nowrap">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.target_type || '-'}</TableCell>
                    <TableCell className="text-xs">{log.target_id || '-'}</TableCell>
                    {/* Render details - could be string or JSON */}
                    <TableCell className="text-xs max-w-xs truncate">
                        {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end items-center space-x-2 pt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                    Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                >
                    Berikutnya
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extend users table in Supabase with email if not already present
// Add indexes on timestamp and action columns in audit_logs for better query performance
// Consider adding a full-text search index on the 'details' JSONB column if complex searching is needed.
