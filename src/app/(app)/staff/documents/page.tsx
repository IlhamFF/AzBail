
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, Edit, Trash2, FileSignature, Download, AlertTriangle, FileWarning } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { id as LocaleID } from 'date-fns/locale';

interface DocumentItem {
  id: string;
  date_received_sent: string; // Storing as string, will be formatted
  document_number: string;
  sender_or_recipient: string;
  subject: string;
  status: string;
  document_type: 'incoming' | 'outgoing';
  file_url?: string | null;
}

export default function StaffDocumentsPage() {
  const [incomingDocuments, setIncomingDocuments] = useState<DocumentItem[]>([]);
  const [outgoingDocuments, setOutgoingDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTermIncoming, setSearchTermIncoming] = useState('');
  const [searchTermOutgoing, setSearchTermOutgoing] = useState('');
  const { toast } = useToast();

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .order('date_received_sent', { ascending: false });

      if (fetchError) {
        console.error("Error fetching documents:", fetchError);
        throw fetchError;
      }

      const incoming = data?.filter(doc => doc.document_type === 'incoming') as DocumentItem[] || [];
      const outgoing = data?.filter(doc => doc.document_type === 'outgoing') as DocumentItem[] || [];
      
      setIncomingDocuments(incoming);
      setOutgoingDocuments(outgoing);

    } catch (err: any) {
      console.error('Error processing documents:', err);
      setError('Gagal memuat data surat. Pastikan tabel "documents" ada dan RLS mengizinkan akses.');
      toast({
        variant: 'destructive',
        title: 'Gagal Memuat Data Surat',
        description: err.message || 'Terjadi kesalahan server.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchIncoming = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermIncoming(event.target.value.toLowerCase());
  };

  const handleSearchOutgoing = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermOutgoing(event.target.value.toLowerCase());
  };

  const filteredIncomingDocuments = incomingDocuments.filter(doc => 
    doc.document_number.toLowerCase().includes(searchTermIncoming) ||
    doc.sender_or_recipient.toLowerCase().includes(searchTermIncoming) ||
    doc.subject.toLowerCase().includes(searchTermIncoming)
  );

  const filteredOutgoingDocuments = outgoingDocuments.filter(doc =>
    doc.document_number.toLowerCase().includes(searchTermOutgoing) ||
    doc.sender_or_recipient.toLowerCase().includes(searchTermOutgoing) ||
    doc.subject.toLowerCase().includes(searchTermOutgoing)
  );

  const renderSkeleton = () => (
    [...Array(3)].map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
        <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
        <TableCell className="text-right space-x-1">
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block" />
          <Skeleton className="h-8 w-8 inline-block" />
        </TableCell>
      </TableRow>
    ))
  );

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
                     <div className="flex gap-2 flex-wrap">
                        <div className="relative w-full sm:w-auto grow sm:grow-0">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                            placeholder="Cari (Nomor/Pengirim/Perihal)..." 
                            className="pl-8 w-full sm:w-[250px]"
                            value={searchTermIncoming}
                            onChange={handleSearchIncoming}
                           />
                        </div>
                        <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Catat Surat Masuk</Button>
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
                        <TableHead>Tgl Terima</TableHead>
                        <TableHead>Nomor Surat</TableHead>
                        <TableHead>Pengirim</TableHead>
                        <TableHead>Perihal</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? renderSkeleton() : 
                        filteredIncomingDocuments.length > 0 ? filteredIncomingDocuments.map((letter) => (
                        <TableRow key={letter.id}>
                          <TableCell>{format(new Date(letter.date_received_sent), "dd MMM yyyy", { locale: LocaleID })}</TableCell>
                          <TableCell>{letter.document_number}</TableCell>
                          <TableCell>{letter.sender_or_recipient}</TableCell>
                          <TableCell>{letter.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={letter.status === 'Didisposisikan' ? 'default' : 'secondary'}>
                              {letter.status}
                            </Badge>
                          </TableCell>
                           <TableCell className="text-right space-x-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                               <FileSignature className="h-4 w-4" />
                               <span className="sr-only">Lihat/Disposisi</span>
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!letter.file_url} onClick={() => letter.file_url && window.open(letter.file_url, '_blank')}>
                               <Download className="h-4 w-4" />
                               <span className="sr-only">Unduh Lampiran</span>
                             </Button>
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
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            <div className="flex flex-col items-center justify-center">
                              <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                              Tidak ada data surat masuk.
                            </div>
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
                      <div className="flex gap-2 flex-wrap">
                         <div className="relative w-full sm:w-auto grow sm:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                              placeholder="Cari (Nomor/Penerima/Perihal)..." 
                              className="pl-8 w-full sm:w-[250px]"
                              value={searchTermOutgoing}
                              onChange={handleSearchOutgoing}
                            />
                         </div>
                         <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Buat Surat Keluar</Button>
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
                        <TableHead>Tgl Surat</TableHead>
                        <TableHead>Nomor Surat</TableHead>
                        <TableHead>Penerima</TableHead>
                        <TableHead>Perihal</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? renderSkeleton() : 
                        filteredOutgoingDocuments.length > 0 ? filteredOutgoingDocuments.map((letter) => (
                        <TableRow key={letter.id}>
                          <TableCell>{format(new Date(letter.date_received_sent), "dd MMM yyyy", { locale: LocaleID })}</TableCell>
                          <TableCell>{letter.document_number}</TableCell>
                          <TableCell>{letter.sender_or_recipient}</TableCell>
                          <TableCell>{letter.subject}</TableCell>
                          <TableCell className="text-center">
                             <Badge variant="default">{letter.status}</Badge>
                           </TableCell>
                           <TableCell className="text-right space-x-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                               <FileSignature className="h-4 w-4" />
                               <span className="sr-only">Lihat/Cetak</span>
                             </Button>
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
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                            <div className="flex flex-col items-center justify-center">
                              <FileWarning className="h-12 w-12 text-muted-foreground mb-2" />
                              Tidak ada data surat keluar.
                            </div>
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
    </div>
  );
}
