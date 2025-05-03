'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, Edit, Trash2, FileSignature, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Placeholder data - replace with actual data fetching
const incomingLetters = [
  { id: 'IN1', date: new Date(Date.now() - 86400000), number: '001/DINAS/VII/2024', sender: 'Dinas Pendidikan Kota', subject: 'Undangan Sosialisasi Kurikulum', status: 'Didisposisikan' },
  { id: 'IN2', date: new Date(), number: 'B/123/VENDOR/VII/2024', sender: 'PT Vendor ATK', subject: 'Penawaran Alat Tulis Kantor', status: 'Diterima' },
];

const outgoingLetters = [
    { id: 'OUT1', date: new Date(Date.now() - 172800000), number: '001/SKL/ADM/VII/2024', recipient: 'Orang Tua Siswa Kelas 10', subject: 'Pemberitahuan Libur Semester', status: 'Terkirim' },
];

export default function StaffDocumentsPage() {
  // Add state for search, filters, dates, and data
  // Add functions for fetching data, recording letters

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pengelolaan Surat Menyurat</h1>

       <Tabs defaultValue="incoming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="incoming">Surat Masuk</TabsTrigger>
            <TabsTrigger value="outgoing">Surat Keluar</TabsTrigger>
          </TabsList>

           {/* Incoming Letters Tab */}
           <TabsContent value="incoming" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                        <CardTitle>Data Surat Masuk</CardTitle>
                        <CardDescription>Catat dan kelola surat yang diterima sekolah.</CardDescription>
                     </div>
                     <div className="flex gap-2">
                        <div className="relative w-full sm:w-auto">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input placeholder="Cari (Nomor/Pengirim/Perihal)..." className="pl-8 w-full sm:w-[250px]" />
                        </div>
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Catat Surat Masuk</Button>
                     </div>
                  </div>
                   {/* Add Date Range Picker or Filters here */}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal Terima</TableHead>
                        <TableHead>Nomor Surat</TableHead>
                        <TableHead>Pengirim</TableHead>
                        <TableHead>Perihal</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomingLetters.map((letter) => (
                        <TableRow key={letter.id}>
                          <TableCell>{letter.date.toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{letter.number}</TableCell>
                          <TableCell>{letter.sender}</TableCell>
                          <TableCell>{letter.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={letter.status === 'Didisposisikan' ? 'default' : 'secondary'}>
                              {letter.status}
                            </Badge>
                          </TableCell>
                           <TableCell className="text-right space-x-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <FileSignature className="h-4 w-4" />
                               <span className="sr-only">Lihat/Disposisi</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Download className="h-4 w-4" />
                               <span className="sr-only">Unduh Lampiran</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Edit className="h-4 w-4" />
                               <span className="sr-only">Edit</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Hapus</span>
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {incomingLetters.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Belum ada data surat masuk.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Add Pagination */}
                </CardContent>
              </Card>
           </TabsContent>

           {/* Outgoing Letters Tab */}
           <TabsContent value="outgoing" className="mt-4">
               <Card>
                <CardHeader>
                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                         <CardTitle>Data Surat Keluar</CardTitle>
                         <CardDescription>Buat dan kelola surat yang dikeluarkan sekolah.</CardDescription>
                      </div>
                      <div className="flex gap-2">
                         <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Cari (Nomor/Penerima/Perihal)..." className="pl-8 w-full sm:w-[250px]" />
                         </div>
                         <Button><PlusCircle className="mr-2 h-4 w-4" /> Buat Surat Keluar</Button>
                      </div>
                   </div>
                   {/* Add Date Range Picker or Filters here */}
                 </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal Surat</TableHead>
                        <TableHead>Nomor Surat</TableHead>
                        <TableHead>Penerima</TableHead>
                        <TableHead>Perihal</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outgoingLetters.map((letter) => (
                        <TableRow key={letter.id}>
                          <TableCell>{letter.date.toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{letter.number}</TableCell>
                          <TableCell>{letter.recipient}</TableCell>
                          <TableCell>{letter.subject}</TableCell>
                          <TableCell className="text-center">
                             <Badge variant="default">{letter.status}</Badge>
                           </TableCell>
                           <TableCell className="text-right space-x-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <FileSignature className="h-4 w-4" />
                               <span className="sr-only">Lihat/Cetak</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                               <Edit className="h-4 w-4" />
                               <span className="sr-only">Edit</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                               <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Hapus</span>
                             </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {outgoingLetters.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Belum ada data surat keluar.
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

      {/* Add Modals/Dialogs for creating/editing letters */}
    </div>
  );
}
