'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, FileDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Placeholder data - replace with actual data fetching
const payments = [
  { id: 'P1', date: new Date(), nis: '1001', name: 'Ahmad Subarjo', type: 'SPP Bulan Juli', amount: 300000, status: 'Lunas' },
  { id: 'P2', date: new Date(Date.now() - 86400000), nis: '1002', name: 'Budi Doremi', type: 'Uang Pangkal', amount: 1500000, status: 'Lunas' },
  { id: 'P3', date: new Date(Date.now() - 172800000), nis: '1101', name: 'Citra Kirana', type: 'SPP Bulan Juli', amount: 300000, status: 'Belum Lunas' },
];

const expenses = [
    { id: 'E1', date: new Date(), category: 'ATK', description: 'Pembelian Kertas HVS', amount: 150000 },
    { id: 'E2', date: new Date(Date.now() - 86400000), category: 'Listrik', description: 'Pembayaran Listrik Bulan Juni', amount: 750000 },
];

export default function StaffFinancesPage() {
  // Add state for search, filters, dates, and data
  // Add functions for fetching data, recording payments/expenses

   const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administrasi Keuangan</h1>

       <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Penerimaan (Pembayaran Siswa)</TabsTrigger>
            <TabsTrigger value="expenses">Pengeluaran Sekolah</TabsTrigger>
          </TabsList>

           {/* Payments Tab */}
           <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                        <CardTitle>Data Pembayaran Siswa</CardTitle>
                        <CardDescription>Catat dan lihat riwayat pembayaran SPP, uang pangkal, dll.</CardDescription>
                     </div>
                     <div className="flex gap-2">
                        <div className="relative w-full sm:w-auto">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="Cari (NIS/Nama/Jenis)..." className="pl-8 w-full sm:w-[250px]" />
                        </div>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Catat Pembayaran</Button>
                         <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Ekspor Data</Button>
                     </div>
                  </div>
                   {/* Add Date Range Picker or Filters here */}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>NIS</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Jenis Pembayaran</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        {/* Add Aksi column if needed */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.date.toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{payment.nis}</TableCell>
                          <TableCell>{payment.name}</TableCell>
                          <TableCell>{payment.type}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={payment.status === 'Lunas' ? 'default' : 'destructive'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {payments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Belum ada data pembayaran.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Add Pagination */}
                </CardContent>
              </Card>
           </TabsContent>

           {/* Expenses Tab */}
           <TabsContent value="expenses" className="mt-4">
               <Card>
                <CardHeader>
                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                         <CardTitle>Data Pengeluaran Sekolah</CardTitle>
                         <CardDescription>Catat dan lihat riwayat pengeluaran operasional sekolah.</CardDescription>
                      </div>
                      <div className="flex gap-2">
                         <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari (Kategori/Deskripsi)..." className="pl-8 w-full sm:w-[250px]" />
                         </div>
                         <Button><PlusCircle className="mr-2 h-4 w-4" /> Catat Pengeluaran</Button>
                         <Button variant="outline"><FileDown className="mr-2 h-4 w-4" /> Ekspor Data</Button>
                      </div>
                   </div>
                   {/* Add Date Range Picker or Filters here */}
                 </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                         {/* Add Aksi column if needed */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date.toLocaleDateString('id-ID')}</TableCell>
                          <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      ))}
                      {expenses.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Belum ada data pengeluaran.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Add Pagination */}
                </CardContent>
              </Card>
           </TabsContent>

       </Tabs>

      {/* Add Modals/Dialogs for recording payments/expenses */}
    </div>
  );
}
