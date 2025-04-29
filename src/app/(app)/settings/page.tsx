'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

   // State for theme (example, needs implementation)
   const [darkMode, setDarkMode] = React.useState(false); // Replace with actual theme logic

   const handleThemeChange = (checked: boolean) => {
     setDarkMode(checked);
     // Implement theme switching logic here (e.g., using context, localStorage, CSS variables)
     toast({ title: `Mode ${checked ? 'Gelap' : 'Terang'} Diaktifkan`});
     document.documentElement.classList.toggle('dark', checked); // Basic example
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

  if (loading) {
    return <div>Loading settings...</div>; // Or use Skeleton
  }

  if (!user) {
    // Should be redirected by layout
    return null;
  }

  return (
    <div className="space-y-6">
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
           {/* Add password change form/button here */}
            <div>
               <Button variant="outline" onClick={() => toast({ title: 'Fitur Ganti Password (Belum Tersedia)'})}>
                  Ganti Password
               </Button>
               <p className="text-sm text-muted-foreground mt-2">
                  Ubah password akun Anda secara berkala.
               </p>
            </div>
            {/* Add other security settings like 2FA if applicable */}
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
