'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext'; // Context still needed for user info display
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
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard, // Keep for potential future non-admin use, or general dashboard icon
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Building, // Keep if needed for non-admin views
  DollarSign,
  Bell,
  UserCheck,
  ShieldCheck,
  FileCheck,
  Newspaper,
  Warehouse,
  CreditCard,
  FileSignature,
  BookMarked,
  Home,
  UserCog,
  ChevronDown,
  // Remove admin-specific icons if not used elsewhere
  // UserPlus,
  // DatabaseBackup,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

// Define menu items based on roles (excluding Admin)
interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  subItems?: { label: string; path: string }[];
}

// Updated menu items, removing Admin-specific ones for this layout
const menuItems: Record<string, MenuItem[]> = {
  Guru: [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Jadwal Mengajar', icon: Calendar, path: '/teacher/schedule' },
    { label: 'Manajemen Kelas', icon: Users, path: '/teacher/manage-class' },
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
  return user?.user_metadata?.role || null;
};

// Helper function to get full name from user metadata
const getUserFullName = (user: any): string => {
   return user?.user_metadata?.full_name || user?.email || 'Pengguna';
};

// Helper function to get avatar URL
const getUserAvatarUrl = (user: any): string | undefined => {
  return user?.user_metadata?.avatar_url;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();

  // Determine role and menu items, handle loading/no user state gracefully
  const userRole = loading ? null : getUserRole(user);
  // Use empty array if userRole is null, Admin, or not found in menuItems
  const currentMenuItems = (!loading && userRole && menuItems[userRole]) ? menuItems[userRole] : [];
  const userName = loading ? 'Loading...' : (user ? getUserFullName(user) : 'Pengguna');
  const userAvatar = loading ? undefined : (user ? getUserAvatarUrl(user) : undefined);


   if (loading) {
      return (
          <div className="flex min-h-screen">
             <Sidebar collapsible="icon">
                 <SidebarHeader className="p-4"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-20 ml-2" /></SidebarHeader>
                 <SidebarContent><SidebarMenuSkeleton showIcon /><SidebarMenuSkeleton showIcon /></SidebarContent>
                 <SidebarFooter><SidebarMenuSkeleton showIcon /></SidebarFooter>
             </Sidebar>
              <SidebarInset className="flex-1 p-4 md:p-6">
                  <div>Loading...</div>
              </SidebarInset>
          </div>
      );
   }

   // If layout renders without user (AuthContext should handle redirect)
   if (!user) {
       return null;
   }

   // If layout renders for an Admin user (AuthContext should handle redirect)
   if (userRole === 'Admin') {
       // Return minimal loading/redirecting state or null
       return null;
   }

  const isItemActive = (path: string): boolean => {
    if (path === '#') return false;
    return pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
  };


  return (
    <div className="flex min-h-screen">
      <Sidebar collapsible="icon">
        <SidebarHeader className="items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
             <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-sm truncate max-w-[100px]">
                    {userName}
                </span>
                 {userRole && <span className="text-xs text-muted-foreground">{userRole}</span>}
             </div>
          </div>
           <SidebarTrigger className="md:hidden" />
        </SidebarHeader>

        <SidebarContent>
           <div className="hidden md:flex justify-end p-2 group-data-[collapsible=icon]:justify-center">
               <SidebarTrigger />
           </div>
          <SidebarMenu>
            {/* Render menu only if it's not an admin */}
            {userRole !== 'Admin' && currentMenuItems.length === 0 && userRole && (
              <SidebarMenuItem>
                 <div className="p-2 text-muted-foreground text-sm">Menu tidak tersedia untuk peran Anda.</div>
              </SidebarMenuItem>
             )}
            {userRole !== 'Admin' && currentMenuItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                {item.subItems ? (
                  <SidebarGroup>
                     <SidebarMenuButton
                         aria-expanded="false"
                         className="justify-between"
                         isActive={item.subItems.some(sub => isItemActive(sub.path))}
                     >
                         <div className="flex items-center gap-2">
                             <item.icon />
                             <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                         </div>
                         <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                     </SidebarMenuButton>
                     <SidebarMenuSub>
                       {item.subItems.map((subItem, subIndex) => (
                         <SidebarMenuSubItem key={subIndex}>
                           <Link href={subItem.path} passHref>
                             <SidebarMenuSubButton asChild isActive={isItemActive(subItem.path)}>
                               <span>{subItem.label}</span>
                             </SidebarMenuSubButton>
                           </Link>
                         </SidebarMenuSubItem>
                       ))}
                     </SidebarMenuSub>
                  </SidebarGroup>

                ) : (
                  <Link href={item.path} passHref>
                    <SidebarMenuButton asChild tooltip={item.label} isActive={isItemActive(item.path)}>
                      <span>
                        <item.icon />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </span>
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
                <Link href="/settings" passHref>
                  <SidebarMenuButton asChild tooltip="Pengaturan" isActive={isItemActive('/settings')}>
                    <span>
                      <Settings />
                      <span className="group-data-[collapsible=icon]:hidden">Pengaturan</span>
                    </span>
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

       <SidebarInset className="flex-1 overflow-auto">
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                 {/* General Header Title */}
                 <h1 className="text-xl font-semibold">EduPortal</h1>
             </header>
              <main className="flex-1 p-4 md:p-6">
                   {children}
              </main>
        </SidebarInset>

    </div>
  );
}
