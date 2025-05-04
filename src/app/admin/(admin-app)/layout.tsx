'use client';

import React from 'react';
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
  SidebarMenuSkeleton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  LogOut,
  Bell,
  UserPlus, // For Verify Users
  Building, // For Manage Classes
  DatabaseBackup, // For Audit Logs
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter

// Define menu items specific to Admin
interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const adminMenuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Verifikasi Pengguna', icon: UserPlus, path: '/admin/verify-users' },
  { label: 'Manajemen Pengguna', icon: Users, path: '/admin/manage-users' },
  { label: 'Manajemen Kelas', icon: Building, path: '/admin/manage-classes' },
  { label: 'Manajemen Mapel', icon: BookOpen, path: '/admin/manage-subjects' },
  { label: 'Log Aktivitas', icon: DatabaseBackup, path: '/admin/audit-logs' },
  { label: 'Pengumuman', icon: Bell, path: '/announcements' }, // General page, keep if admin needs access
  // { label: 'Pengaturan', icon: Settings, path: '/settings' }, // General page, keep if admin needs access
];

const getUserRole = (user: any): string | null => user?.user_metadata?.role || null;
const getUserFullName = (user: any): string => user?.user_metadata?.full_name || user?.email || 'Admin';
const getUserAvatarUrl = (user: any): string | undefined => user?.user_metadata?.avatar_url;

export default function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect non-admins away from admin layout
  React.useEffect(() => {
    if (!loading && (!user || getUserRole(user) !== 'Admin')) {
      router.replace('/login'); // Redirect to general login if not admin
    }
  }, [user, loading, router]);

  const userRole = loading ? null : getUserRole(user);
  const userName = loading ? 'Loading...' : (user ? getUserFullName(user) : 'Admin');
  const userAvatar = loading ? undefined : (user ? getUserAvatarUrl(user) : undefined);

  if (loading || !user || userRole !== 'Admin') {
    // Show loading or redirecting state while auth check completes or if user is not admin
    return (
      <div className="flex min-h-screen">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-20 ml-2" /></SidebarHeader>
          <SidebarContent><SidebarMenuSkeleton showIcon /><SidebarMenuSkeleton showIcon /></SidebarContent>
          <SidebarFooter><SidebarMenuSkeleton showIcon /></SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 p-4 md:p-6">
          <div>Loading or redirecting...</div>
        </SidebarInset>
      </div>
    );
  }

  const isItemActive = (path: string): boolean => pathname === path || (path !== '/' && pathname.startsWith(path + '/'));

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
            {adminMenuItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                <Link href={item.path} passHref legacyBehavior>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={isItemActive(item.path)}>
                    <a>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
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

      <SidebarInset className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
