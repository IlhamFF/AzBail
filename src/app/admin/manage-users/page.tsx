'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Placeholder data - replace with actual data fetching and display
const users = [
  { id: '1', name: 'Budi Santoso', email: 'budi.s@example.com', role: 'Guru', is_verified: true },
  { id: '2', name: 'Citra Lestari', email: 'citra.l@example.com', role: 'Siswa', is_verified: true },
  { id: '3', name: 'Dewi Anggraini', email: 'dewi.a@example.com', role: 'Tata Usaha', is_verified: false },
];

export default function ManageUsersPage() {
  // Add state and functions for data fetching, filtering, searching, pagination, CRUD operations

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Kelola akun pengguna sistem.</CardDescription>
           {/* Add Search/Filter components here */}
        </CardHeader>
        <CardContent>
           {/* Replace with actual Table component displaying users */}
           <div className="border rounded-md p-4">
             <p className="text-muted-foreground">Tabel daftar pengguna akan ditampilkan di sini.</p>
             <ul className="mt-2 space-y-1 text-sm">
               {users.map(user => (
                 <li key={user.id} className="flex justify-between items-center">
                   <span>{user.name} ({user.role}) - {user.email}</span>
                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                     {user.is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'}
                   </span>
                 </li>
               ))}
             </ul>
           </div>
           {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Add Modals/Dialogs for Add/Edit/Delete User */}
    </div>
  );
}
