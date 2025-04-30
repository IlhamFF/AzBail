// src/app/admin/(dashboard)/dashboard/page.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext'; // Make sure path is correct

export default function AdminDashboardPage() {
   const { user } = useAuth(); // Use auth context if needed

   // Add Admin-specific dashboard content here
   const adminStats = { users: 125, pendingVerifications: 8, classes: 16 }; // Example data


  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              {/* Icon */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifikasi Tertunda</CardTitle>
               {/* Icon */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.pendingVerifications}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Kelas</CardTitle>
               {/* Icon */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.classes}</div>
            </CardContent>
          </Card>
          {/* Add more admin-specific cards or components */}
       </div>
    </div>
  );
}
