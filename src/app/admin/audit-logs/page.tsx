'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Placeholder data - replace with actual data fetching and structure
const auditLogs = [
  { id: 'L1', timestamp: new Date(Date.now() - 3600000), user: 'Admin Utama (admin@example.com)', action: 'UPDATE_USER_ROLE', target: 'Budi Santoso (budi.s@example.com)', details: 'Role changed to Guru' },
  { id: 'L2', timestamp: new Date(Date.now() - 7200000), user: 'Admin Utama (admin@example.com)', action: 'CREATE_CLASS', target: 'Kelas 10A', details: 'Class created successfully' },
  { id: 'L3', timestamp: new Date(Date.now() - 10800000), user: 'Sistem', action: 'USER_LOGIN', target: 'Citra Lestari (citra.l@example.com)', details: 'Login successful' },
];

export default function AuditLogsPage() {
  // Add state and functions for data fetching, filtering by date/user/action, searching

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Log Aktivitas Sistem</h1>

      <Card>
        <CardHeader>
          <CardTitle>Catatan Aktivitas</CardTitle>
          <CardDescription>Lihat riwayat aktivitas penting yang terjadi dalam sistem.</CardDescription>
           {/* Add Filtering/Searching components here */}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(log.timestamp, 'dd MMM yyyy, HH:mm:ss', { locale: id })}
                  </TableCell>
                  <TableCell className="text-xs">{log.user}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{log.target}</TableCell>
                  <TableCell className="text-xs">{log.details}</TableCell>
                </TableRow>
              ))}
               {auditLogs.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={5} className="text-center text-muted-foreground">
                       Tidak ada data log aktivitas.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
          {/* Add Pagination component here */}
        </CardContent>
      </Card>
    </div>
  );
}
