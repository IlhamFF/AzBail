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
import { ChevronLeft, ChevronRight, Search, Filter, UserCircle, Info, List, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea for JSON display
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert component

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

// Predefined actions for filtering (can be expanded)
const ACTIONS = [
    'CREATE_ANNOUNCEMENT', 'UPDATE_ANNOUNCEMENT', 'DELETE_ANNOUNCEMENT', 'PIN_ANNOUNCEMENT',
    'VERIFY_USER', 'DELETE_USER',
    'CREATE_CLASS', 'UPDATE_CLASS', 'DELETE_CLASS',
    'CREATE_SUBJECT', 'UPDATE_SUBJECT', 'DELETE_SUBJECT',
    // Add more actions as they are implemented in the application
];

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
      // IMPORTANT: Ensure RLS policies allow Admins to select from 'audit_logs' and join 'users'.
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_details ( email )
        `, { count: 'exact' }) // Join with user_details to get email
        .order('timestamp', { ascending: false })
        .range(from, to);

      if (filterAction !== 'all') {
        query = query.eq('action', filterAction);
      }

      if (searchTerm) {
        // Basic search on action, email, target_type, target_id, and details message
        // Note: Searching within JSONB (details->>message) might be slow on large tables without proper indexing.
        query = query.or(`action.ilike.%${searchTerm}%,user_details.email.ilike.%${searchTerm}%,target_type.ilike.%${searchTerm}%,target_id.ilike.%${searchTerm}%,details->>message.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Supabase fetch audit logs error:', fetchError); // Log the detailed error
        throw fetchError; // Rethrow the error
      }

      const formattedData = data?.map(log => ({
        ...log,
        user_email: (log.user_details as any)?.email || 'Sistem', // Safely access nested email
      })) || [];

      setLogs(formattedData);
      setTotalCount(count || 0);

    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      setError(`Gagal memuat log aktivitas: ${err.message || 'Terjadi kesalahan server.'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterAction, searchTerm]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterAction(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  const formatDetails = (details: any) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    try {
      // Pretty print JSON with indentation
      return JSON.stringify(details, null, 2);
    } catch {
      return String(details); // Fallback to string conversion
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
             <div>
               <CardTitle>Log Aktivitas Sistem</CardTitle>
               <CardDescription>Lihat riwayat aktivitas penting yang terjadi dalam sistem.</CardDescription>
             </div>
          </div>
          {/* Filtering and Searching */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <div className="relative flex-1 md:grow-0">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari (Aksi, Email, Target, Detail)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 w-full md:w-[250px] lg:w-[350px]"
              />
            </div>
            <Select value={filterAction} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                 <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                {ACTIONS.map(action => <SelectItem key={action} value={action}>{formatActionName(action)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Display */}
           {error && (
             <Alert variant="destructive" className="mb-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Waktu</TableHead>
                  <TableHead className="w-[200px]">Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  [...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                )}
                {!loading && !error && logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Tidak ada data log aktivitas yang cocok dengan filter/pencarian.
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !error && logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                       {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: id })}
                    </TableCell>
                    <TableCell className="text-sm font-medium flex items-center gap-2">
                       <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                       <span className='truncate' title={log.user_email}>{log.user_email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                         <List className="h-3 w-3 mr-1" />
                         {formatActionName(log.action)}
                       </Badge>
                    </TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                        {log.target_type && log.target_id ? (
                           <div className='flex flex-col'>
                              <span className='font-medium'>{log.target_type}</span>
                              <span className='truncate' title={log.target_id}>{log.target_id.substring(0, 8)}...</span>
                           </div>
                        ) : '-'}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">
                       <details>
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-1">
                             <Info className="h-3 w-3 flex-shrink-0" />
                             <span className="truncate">
                                {log.details?.message || (log.details && typeof log.details === 'object' ? 'Lihat JSON' : String(log.details) || '-')}
                             </span>
                          </summary>
                          {log.details && typeof log.details === 'object' && (
                              <ScrollArea className="mt-2 max-h-40 w-full rounded-md border p-2 bg-muted/50">
                                 <pre className="text-xs">{formatDetails(log.details)}</pre>
                              </ScrollArea>
                          )}
                           {log.details && typeof log.details === 'string' && log.details !== log.details?.message && (
                               <p className="mt-1 text-muted-foreground">{log.details}</p>
                           )}
                       </details>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center space-x-2 pt-4">
               <span className="text-sm text-muted-foreground">
                 Total {totalCount} log
               </span>
               <div className="flex items-center space-x-2">
                   <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handlePageChange(currentPage - 1)}
                       disabled={currentPage === 1 || loading}
                   >
                       <ChevronLeft className="h-4 w-4" />
                       <span className="hidden sm:inline ml-1">Sebelumnya</span>
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
                       <span className="hidden sm:inline mr-1">Berikutnya</span>
                       <ChevronRight className="h-4 w-4" />
                   </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
