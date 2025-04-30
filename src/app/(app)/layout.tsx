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
  SidebarMenuSubButton, // Corrected import
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSkeleton,
  SidebarMenuSubItem // Added import
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button'; // Button only used for logout, handled by SidebarMenuButton
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
  ChevronDown, // For sub-menu indicator
  UserPlus, // For Verify Users
  DatabaseBackup // Example for Audit Logs, could use ClipboardList too
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname

// Define menu items based on roles
interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  subItems?: { label: string; path: string }[];
}

const menuItems: Record<string, MenuItem[]> = {
  Admin: [
    { label: 'Dashboard', icon: Home, path: '/admin/dashboard' }, // Updated path
    { label: 'Verifikasi Pengguna', icon: UserPlus, path: '/admin/verify-users' }, // Use UserPlus
    { label: 'Manajemen Pengguna', icon: Users, path: '/admin/manage-users' },
    { label: 'Manajemen Kelas', icon: Building, path: '/admin/manage-classes' },
    { label: 'Manajemen Mapel', icon: BookOpen, path: '/admin/manage-subjects' },
    { label: 'Log Aktivitas', icon: DatabaseBackup, path: '/admin/audit-logs' }, // Use DatabaseBackup or similar
    { label: 'Pengumuman', icon: Bell, path: '/announcements' }, // Admin can also see/manage announcements
    { label: 'Pengaturan', icon: Settings, path: '/settings' },
  ],
  Guru: [
    { label: 'Dashboard', icon: Home, path: '/dashboard' },
    { label: 'Jadwal Mengajar', icon: Calendar, path: '/teacher/schedule' },
    { label: 'Manajemen Kelas', icon: Users, path: '/teacher/manage-class' }, // View students, maybe attendance shortcut
    {
      label: 'Akademik',
      icon: GraduationCap,
      path: '#', // Indicate it's a dropdown trigger
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
  const { user, signOut, loading } = useAuth(); // Only need user info and signout
  const pathname = usePathname(); // Get current path

  // Determine role and menu items, handle loading/no user state gracefully
  const userRole = loading ? null : getUserRole(user);
  const currentMenuItems = (!loading && userRole && menuItems[userRole]) ? menuItems[userRole] : [];
  const userName = loading ? 'Loading...' : (user ? getUserFullName(user) : 'Pengguna');
  const userAvatar = loading ? undefined : (user ? getUserAvatarUrl(user) : undefined);


   // Loading state for the layout itself can be simplified as AuthProvider handles the main loading/redirect
   if (loading) {
      // You might want a minimal loading UI within the layout structure
      return (
          <div className="flex min-h-screen">
             {/* Basic Sidebar structure during load */}
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

   // If somehow layout renders without user (middleware/AuthProvider should prevent this for protected routes)
   if (!user) {
       // This case should ideally not happen for routes using this layout due to protection
       // You could return null or a redirecting message, but middleware is better
       return null; // Or redirect logic if necessary, though middleware is preferred
   }

  // Function to check if a menu item or sub-item is active
  const isItemActive = (path: string): boolean => {
    if (path === '#') return false; // Dropdown triggers are never active themselves
    // Exact match or parent path match for sub-routes
    return pathname === path || pathname.startsWith(path + '/');
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
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden truncate max-w-[100px]">
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
            {currentMenuItems.length === 0 && userRole && (
              <SidebarMenuItem>
                 <div className="p-2 text-muted-foreground text-sm">Menu tidak tersedia.</div>
              </SidebarMenuItem>
             )}
            {currentMenuItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                {item.subItems ? (
                  // Group for items with submenus
                  // Using simple disclosure for now, Accordion can be complex here
                  <SidebarGroup>
                      {/* Sub-menu Trigger Button */}
                     <SidebarMenuButton
                         aria-expanded="false" // Manage state if using Accordion
                         className="justify-between"
                         isActive={item.subItems.some(sub => isItemActive(sub.path))} // Highlight if any sub-item is active
                     >
                         <div className="flex items-center gap-2">
                             <item.icon />
                             <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                         </div>
                         <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                     </SidebarMenuButton>
                     {/* Sub-menu Content */}
                     <SidebarMenuSub>
                       {item.subItems.map((subItem, subIndex) => (
                         <SidebarMenuSubItem key={subIndex}>
                           <Link href={subItem.path} passHref legacyBehavior>
                             <SidebarMenuSubButton asChild isActive={isItemActive(subItem.path)}>
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
                    <SidebarMenuButton asChild tooltip={item.label} isActive={isItemActive(item.path)}>
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
                  <SidebarMenuButton asChild tooltip="Pengaturan" isActive={isItemActive('/settings')}>
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

      {/* SidebarInset wraps the main content area */}
       <SidebarInset className="flex-1 overflow-auto">
            {/* Optional Header for main content area */}
             <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
                 <h1 className="text-xl font-semibold">EduPortal {userRole ? `(${userRole})` : ''}</h1>
             </header>
              {/* Main content */}
              <main className="flex-1 p-4 md:p-6">
                   {children}
              </main>
        </SidebarInset>

    </div>
  );
}
