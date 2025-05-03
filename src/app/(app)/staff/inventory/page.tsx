'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, Edit, Trash2, Package, CheckSquare, XSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Placeholder data - replace with actual data fetching
const inventoryItems = [
  { id: 'I1', code: 'BRG-001', name: 'Laptop Guru A', category: 'Elektronik', location: 'Ruang Guru', quantity: 1, condition: 'Baik' },
  { id: 'I2', code: 'BRG-002', name: 'Proyektor Kelas 10A', category: 'Elektronik', location: 'Kelas 10A', quantity: 1, condition: 'Perlu Perbaikan' },
  { id: 'I3', code: 'BRG-003', name: 'Meja Siswa', category: 'Mebel', location: 'Gudang', quantity: 5, condition: 'Baik' },
  { id: 'I4', code: 'BRG-004', name: 'Spidol Whiteboard', category: 'ATK', location: 'Ruang TU', quantity: 50, condition: 'Baik' },
];

export default function StaffInventoryPage() {
  // Add state for search, filters, pagination, and inventory data
  // Add functions for fetching data, CRUD operations

   const getConditionBadge = (condition: string) => {
     switch (condition) {
       case 'Baik':
         return <Badge variant="default"><CheckSquare className="mr-1 h-3 w-3" />Baik</Badge>;
       case 'Perlu Perbaikan':
         return <Badge variant="secondary"><AlertCircle className="mr-1 h-3 w-3" />Perlu Perbaikan</Badge>; // Assuming AlertCircle exists
       case 'Rusak':
         return <Badge variant="destructive"><XSquare className="mr-1 h-3 w-3" />Rusak</Badge>;
       default:
         return <Badge variant="outline">{condition}</Badge>;
     }
   };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inventaris Sekolah</h1>

      {/* Maybe add Tabs for different views (All Items, By Location, By Category) if needed */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div>
                <CardTitle>Daftar Inventaris Barang</CardTitle>
                <CardDescription>Kelola data barang inventaris sekolah.</CardDescription>
             </div>
             <div className="flex gap-2">
                <div className="relative w-full sm:w-auto">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input placeholder="Cari (Kode/Nama/Lokasi)..." className="pl-8 w-full sm:w-[250px]" />
                </div>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang</Button>
             </div>
          </div>
           {/* Add Filter dropdowns (by category, location, condition) if needed */}
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Barang</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-center">Jumlah</TableHead>
                <TableHead className="text-center">Kondisi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                     {getConditionBadge(item.condition)}
                   </TableCell>
                  <TableCell className="text-right space-x-2">
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
               {inventoryItems.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={7} className="text-center text-muted-foreground">
                       Data inventaris tidak ditemukan.
                     </TableCell>
                  </TableRow>
               )}
            </TableBody>
          </Table>
           {/* Add Pagination component here */}
        </CardContent>
      </Card>

      {/* Add Modals/Dialogs for Add/Edit Item */}
    </div>
  );
}

// Placeholder AlertCircle if not available in lucide-react
const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);
