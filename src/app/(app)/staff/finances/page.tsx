
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, FileDown, AlertTriangle, FileWarning } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';

interface StudentPayment {
  id: string;
  payment_date: string; 
  student_nis: string;
  student_name: string;
  payment_type: string;
  amount: number;
  status: string;
}

interface SchoolExpense {
  id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
}

export default function StaffFinancesPage() {
  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [expenses, setExpenses] = useState<SchoolExpense[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTermPayments, setSearchTermPayments] = useState('');
  const [searchTermExpenses, setSearchTermExpenses] = useState('');
  const { toast } = useToast();

  const fetchPayments = async () => {
    setLoadingPayments(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('student_payments') // Ganti dengan nama tabel pembayaran Anda
        .select('*')
        .order('payment_date', { ascending: false });

      if (fetchError) {
        console.error("Error fetching payments:", fetchError);
        throw fetchError;
      }
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error processing payments:', err);
      setError('Gagal memuat data pembayaran siswa. Pastikan tabel "student_payments" ada dan RLS mengizinkan akses.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Pembayaran',
        description: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    setError(null); // Reset error untuk fetch ini
    try {
      const { data, error: fetchError } = await supabase
        .from('school_expenses') // Ganti dengan nama tabel pengeluaran Anda
        .select('*')
        .order('expense_date', { ascending: false });

      if (fetchError) {
        console.error("Error fetching expenses:", fetchError);
        throw fetchError;
      }
      setExpenses(data || []);
    } catch (err: any) {
      console.error('Error processing expenses:', err);
      setError((prevError) => prevError ? `${prevError}\nGagal memuat data pengeluaran.` : 'Gagal memuat data pengeluaran. Pastikan tabel "school_expenses" ada dan RLS mengizinkan akses.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Pengeluaran',
        description: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };
  
  const filteredPayments = payments.filter(p => 
    p.student_nis.toLowerCase().includes(searchTermPayments.toLowerCase()) ||
    p.student_name.toLowerCase().includes(searchTermPayments.toLowerCase()) ||
    p.payment_type.toLowerCase().includes(searchTermPayments.toLowerCase())
  );

  const filteredExpenses = expenses.filter(e =>
    e.category.toLowerCase().includes(searchTermExpenses.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTermExpenses.toLowerCase())
  );

  const renderSkeletonRows = (cols: number) => (
    [...Array(3)].map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        {[...Array(cols)].map((_, j) => (
          <TableCell key={`cell-skeleton-${i}-${j}`}><Skeleton className="h-5 w-full" /></TableCell>
        ))}
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Administrasi Keuangan</h1>

       <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Penerimaan (Pembayaran Siswa)</TabsTrigger>
            <TabsTrigger value="expenses">Pengeluaran Sekolah</TabsTrigger>
          </TabsList>

           <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                        <CardTitle>Data Pembayaran Siswa</CardTitle>
                        <CardDescription>Catat dan lihat riwayat pembayaran SPP, uang pangkal, dll.</CardDescription>
                     </div>
                     <div className="flex gap-2 flex-wrap">
                        <div className="relative w-full sm:w-auto grow sm:grow-0">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                            placeholder="Cari (NIS/Nama/Jenis)..." 
                            className="pl-8 w-full sm:w-[250px]"
                            value={searchTermPayments}
                            onChange={(e) => setSearchTermPayments(e.target.value)}
                           />
                        </div>
                        <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Catat Pembayaran</Button>
                         <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4" /> Ekspor Data</Button>
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {error && !loadingPayments && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error Pembayaran</AlertTitle>
                      <AlertDescription>{error.includes('pembayaran') ? error : 'Gagal memuat data pembayaran siswa.'}</AlertDescription>
                    </Alert>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>NIS</TableHead>
                        <TableHead>Nama Siswa</TableHead>
                        <TableHead>Jenis Pembayaran</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingPayments ? renderSkeletonRows(6) : 
                        filteredPayments.length > 0 ? filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.payment_date), "dd MMM yyyy", { locale: LocaleID })}</TableCell>
                          <TableCell>{payment.student_nis}</TableCell>
                          <TableCell>{payment.student_name}</TableCell>
                          <TableCell>{payment.payment_type}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={payment.status === 'Lunas' ? 'default' : 'destructive'}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                             <div className="flex flex-col items-center justify-center">
                               <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                               Tidak ada data pembayaran siswa.
                             </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
           </TabsContent>

           <TabsContent value="expenses" className="mt-4">
               <Card>
                <CardHeader>
                   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                         <CardTitle>Data Pengeluaran Sekolah</CardTitle>
                         <CardDescription>Catat dan lihat riwayat pengeluaran operasional sekolah.</CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                         <div className="relative w-full sm:w-auto grow sm:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Cari (Kategori/Deskripsi)..." 
                              className="pl-8 w-full sm:w-[250px]"
                              value={searchTermExpenses}
                              onChange={(e) => setSearchTermExpenses(e.target.value)}
                            />
                         </div>
                         <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Catat Pengeluaran</Button>
                         <Button variant="outline" disabled><FileDown className="mr-2 h-4 w-4" /> Ekspor Data</Button>
                      </div>
                   </div>
                 </CardHeader>
                <CardContent>
                  {error && !loadingExpenses && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error Pengeluaran</AlertTitle>
                      <AlertDescription>{error.includes('pengeluaran') ? error : 'Gagal memuat data pengeluaran.'}</AlertDescription>
                    </Alert>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingExpenses ? renderSkeletonRows(4) : 
                        filteredExpenses.length > 0 ? filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.expense_date), "dd MMM yyyy", { locale: LocaleID })}</TableCell>
                          <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      )) : (
                         <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                            <div className="flex flex-col items-center justify-center">
                               <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                               Tidak ada data pengeluaran.
                             </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
           </TabsContent>
       </Tabs>
    </div>
  );
}

    