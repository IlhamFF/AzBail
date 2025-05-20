
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, Edit, Trash2, Package, CheckSquare, XSquare, AlertTriangle as AlertCircleIcon, FileWarning, AlertTriangle } from 'lucide-react'; // AlertTriangle for general error
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InventoryItem {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  location: string;
  quantity: number;
  condition: string;
}

export default function StaffInventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchInventoryItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('inventory_items') // Ganti dengan nama tabel inventaris Anda
        .select('*')
        .order('item_name', { ascending: true });

      if (fetchError) {
        console.error("Error fetching inventory items:", fetchError);
        throw fetchError;
      }
      setInventoryItems(data || []);
    } catch (err: any) {
      console.error('Error processing inventory items:', err);
      setError('Gagal memuat data inventaris. Pastikan tabel "inventory_items" ada dan RLS mengizinkan akses.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Inventaris',
        description: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filteredInventoryItems = inventoryItems.filter(item =>
    item.item_code.toLowerCase().includes(searchTerm) ||
    item.item_name.toLowerCase().includes(searchTerm) ||
    item.location.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm)
  );

  const getConditionBadge = (condition: string) => {
     switch (condition.toLowerCase()) {
       case 'baik':
         return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><CheckSquare className="mr-1 h-3 w-3" />Baik</Badge>;
       case 'perlu perbaikan':
         return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900 hover:bg-yellow-600"><AlertCircleIcon className="mr-1 h-3 w-3" />Perlu Perbaikan</Badge>;
       case 'rusak':
         return <Badge variant="destructive"><XSquare className="mr-1 h-3 w-3" />Rusak</Badge>;
       default:
         return <Badge variant="outline">{condition}</Badge>;
     }
   };

  const renderSkeletonRows = () => (
    [...Array(5)].map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableCell>
        <TableCell className="text-right space-x-1">
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block" />
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inventaris Sekolah</h1>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
             <div>
                <CardTitle>Daftar Inventaris Barang</CardTitle>
                <CardDescription>Kelola data barang inventaris sekolah.</CardDescription>
             </div>
             <div className="flex gap-2 flex-wrap">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                    placeholder="Cari (Kode/Nama/Lokasi)..." 
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchTerm}
                    onChange={handleSearch}
                   />
                </div>
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Tambah Barang</Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
           {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
              {loading ? renderSkeletonRows() : 
                filteredInventoryItems.length > 0 ? filteredInventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.item_code}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                     {getConditionBadge(item.condition)}
                   </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled>
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Hapus</span>
                     </Button>
                  </TableCell>
                </TableRow>
              )) : (
                 <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                       <div className="flex flex-col items-center justify-center">
                         <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                         Tidak ada data inventaris.
                       </div>
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    