'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Building,
  DollarSign,
  Bell,
  UserCheck,
  ShieldCheck,
  FileCheck,
  Newspaper,
  Warehouse,
  CreditCard,
  FileSignature,
  BookMarked, // Example for Materi
  Home, // Example for Dashboard
  UserCog, // Example for Profile/Settings
} from 'lucide-react';
import Link from 'next/link';

// Define menu items based on roles
const menuItems: Record<string, { label: string; icon: React.ElementType; path: string; subItems?: { label: string; path: string }[] }[]> = {
  Admin: [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Verifikasi Pengguna', icon: UserCheck, path: '/admin/verify-users' },
    { label: 'Manajemen Pengguna', icon: Users, path: '/admin/manage-users' },
    { label: 'Manajemen Kelas', icon: Building, path: '/admin/manage-classes' },
    { label: 'Manajemen Mapel', icon: BookOpen, path: '/admin/manage-subjects' },
    { label: 'Log Aktivitas', icon: ClipboardList, path: '/admin/audit-logs' },
    { label: 'Pengaturan', icon: Settings, path: '/settings' },
  ],
  Guru: [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Jadwal Mengajar', icon: Calendar, path: '/teacher/schedule' },
    { label: 'Manajemen Kelas', icon: Users, path: '/teacher/manage-class' }, // View students, maybe attendance shortcut
    {
      label: 'Akademik',
      icon: GraduationCap,
      path: '#',
      subItems: [
        { label: 'Input Nilai', path: '/teacher/grades' },
        { label: 'Input Absensi', path: '/teacher/attendance' },
        { label: 'Upload Materi', path: '/teacher/materials' },
        { label: 'Kelola Tugas', path: '/teacher/assignments' },
      ],
    },
     { label: 'Pengumuman', icon: Bell, path: '/announcements' },
    { label: 'Profil', icon: UserCog, path: '/profile' },
  ],
  Siswa: [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Jadwal Pelajaran', icon: Calendar, path: '/student/schedule' },
    { label: 'Nilai', icon: BarChart3, path: '/student/grades' },
    { label: 'Absensi', icon: ClipboardList, path: '/student/attendance' },
    { label: 'Materi Pelajaran', icon: BookMarked, path: '/student/materials' },
    { label: 'Tugas', icon: FileText, path: '/student/assignments' },
     { label: 'Pengumuman', icon: Bell, path: '/announcements' },
    { label: 'Profil', icon: UserCog, path: '/profile' },
  ],
  'Tata Usaha': [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Manajemen Data Siswa', icon: Users, path: '/staff/manage-students' },
    { label: 'Administrasi Keuangan', icon: CreditCard, path: '/staff/finances' },
    { label: 'Pengelolaan Surat', icon: FileSignature, path: '/staff/documents' },
    { label: 'Inventaris Sekolah', icon: Warehouse, path: '/staff/inventory' },
     { label: 'Pengumuman', icon: Bell, path: '/announcements' },
    { label: 'Profil', icon: UserCog, path: '/profile' },
  ],
  'Kepala Sekolah': [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Statistik Sekolah', icon: BarChart3, path: '/principal/statistics' },
    { label: 'Monitoring Guru', icon: UserCheck, path: '/principal/monitor-teachers' },
    { label: 'Persetujuan Dokumen', icon: FileCheck, path: '/principal/approve-documents' },
    { label: 'Laporan Akademik', icon: Newspaper, path: '/principal/academic-reports' },
     { label: 'Pengumuman', icon: Bell, path: '/announcements' },
    { label: 'Profil', icon: UserCog, path: '/profile' },
  ],
};

// Helper function to get role from user metadata
const getUserRole = (user: any): string | null => {
  // Adjust based on where you store the role (e.g., app_metadata or user_metadata)
  return user?.user_metadata?.role || null;
};

// Helper function to get full name from user metadata
const getUserFullName = (user: any): string => {
   return user?.user_metadata?.full_name || user?.email || 'Pengguna';
};

// Helper function to get avatar URL (assuming it's stored or constructed)
const getUserAvatarUrl = (user: any): string | undefined => {
  // Replace with your actual logic to get avatar URL
  return user?.user_metadata?.avatar_url; // Example
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
     // Optional: Check for verification status if needed for all app routes
     // if (!loading && user && !user.user_metadata?.is_verified) {
     //   // Redirect to a pending verification page or show a banner
     //   console.log("User not verified");
     //   // Example: router.push('/pending-verification');
     // }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex h-screen items-center justify-center">
         <div>Loading dashboard...</div>
         {/* Or use Skeleton components */}
       </div>
     );
  }

  if (!user) {
     // Should be redirected by useEffect, but as a fallback:
     return null; // Or a message indicating redirection
   }

  const userRole = getUserRole(user);
  const currentMenuItems = userRole ? menuItems[userRole] || [] : [];
  const userName = getUserFullName(user);
  const userAvatar = getUserAvatarUrl(user);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsible="icon">
        <SidebarHeader className="items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
              {userName}
            </span>
          </div>
           {/* Mobile Trigger */}
           <SidebarTrigger className="md:hidden" />
        </SidebarHeader>

        <SidebarContent>
           {/* Desktop Trigger - positioned absolutely or within header */}
           <div className="hidden md:flex justify-end p-2 group-data-[collapsible=icon]:justify-center">
               <SidebarTrigger />
           </div>
          <SidebarMenu>
            {currentMenuItems.length === 0 && !loading && userRole && (
              <SidebarMenuItem>
                 <div className="p-2 text-muted-foreground text-sm">Menu tidak tersedia untuk peran ini.</div>
              </SidebarMenuItem>
             )}
             {currentMenuItems.length === 0 && loading && (
                 <>
                     <SidebarMenuSkeleton showIcon />
                     <SidebarMenuSkeleton showIcon />
                     <SidebarMenuSkeleton showIcon />
                 </>
             )}
            {currentMenuItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                {item.subItems ? (
                  // Group for items with submenus (using Accordion or similar might be better)
                  <SidebarGroup>
                     <SidebarMenuButton> {/* Consider making this a non-clickable label */}
                         <item.icon />
                         <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                     </SidebarMenuButton>
                     <SidebarMenuSub>
                       {item.subItems.map((subItem, subIndex) => (
                         <SidebarMenuSubItem key={subIndex}>
                           <Link href={subItem.path} passHref legacyBehavior>
                             <SidebarMenuSubButton asChild>
                               <a>{subItem.label}</a>
                             </SidebarMenuSubButton>
                           </Link>
                         </SidebarMenuSubItem>
                       ))}
                     </SidebarMenuSub>
                  </SidebarGroup>

                ) : (
                  // Regular menu item
                  <Link href={item.path} passHref legacyBehavior>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <a>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                  <SidebarMenuButton asChild tooltip="Pengaturan">
                    <a>
                      <Settings />
                      <span className="group-data-[collapsible=icon]:hidden">Pengaturan</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
             </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} tooltip="Keluar">
                <LogOut />
                <span className="group-data-[collapsible=icon]:hidden">Keluar</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Use SidebarInset to wrap the main content area */}
       <SidebarInset className="flex-1 overflow-auto">
            {/* Header for the main content area (optional) */}
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                {/* Mobile Sidebar Trigger - Place here if preferred */}
                 {/* <SidebarTrigger className="sm:hidden" /> */}
                 {/* Breadcrumbs or Title */}
                 <h1 className="text-xl font-semibold">EduPortal</h1>
                 {/* Other header elements like search, notifications */}
             </header>
              {/* Main content */}
              <main className="flex-1 p-4 md:p-6">
                   {children}
              </main>
        </SidebarInset>

    </div>
  );
}
