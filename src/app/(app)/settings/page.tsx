
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

   // State for theme (example, needs implementation)
   const [darkMode, setDarkMode] = React.useState(false); 
   const [isClient, setIsClient] = React.useState(false);

   React.useEffect(() => {
    setIsClient(true);
    // Optionally, load saved theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);


   const handleThemeChange = (checked: boolean) => {
     setDarkMode(checked);
     document.documentElement.classList.toggle('dark', checked);
     localStorage.setItem('theme', checked ? 'dark' : 'light'); // Save theme preference
     toast({ title: `Mode ${checked ? 'Gelap' : 'Terang'} Diaktifkan`});
   };

   const handleSignOut = async () => {
      try {
         await signOut();
         toast({ title: 'Anda telah keluar.' });
         // AuthProvider should handle redirection
      } catch (error: any) {
         toast({ variant: 'destructive', title: 'Gagal Keluar', description: error.message });
      }
   }

  if (loading || !isClient) { // Wait for client-side mount for theme
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-1/2 mb-6" /> {/* Title Skeleton */}
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!user) {
    // Should be redirected by layout or AuthContext
    return null;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Pengaturan Akun</h1>

      <Card>
        <CardHeader>
          <CardTitle>Preferensi Tampilan</CardTitle>
          <CardDescription>Atur tampilan aplikasi sesuai keinginan Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
              <span>Mode Gelap</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Aktifkan tema gelap untuk tampilan yang nyaman di malam hari.
              </span>
            </Label>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleThemeChange}
              aria-label="Toggle dark mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
          <CardDescription>Kelola pengaturan keamanan akun Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
               <Button variant="outline" onClick={() => toast({ title: 'Fitur Ganti Password (Belum Tersedia)'})}>
                  Ganti Password
               </Button>
               <p className="text-sm text-muted-foreground mt-2">
                  Ubah password akun Anda secara berkala.
               </p>
            </div>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Sesi</CardTitle>
          <CardDescription>Keluar dari akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button variant="destructive" onClick={handleSignOut}>
             Keluar dari Akun
           </Button>
        </CardContent>
      </Card>

    </div>
  );
}

    