import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { session }, // Use session which includes user data if logged in
  } = await supabase.auth.getSession(); // Use getSession for middleware

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAdminLoginPage = request.nextUrl.pathname === '/admin/login';
  const userRole = session?.user?.user_metadata?.role;

  // If trying to access admin routes (excluding admin login page)
  if (isAdminRoute && !isAdminLoginPage) {
     // If no session or user is not an Admin, redirect to admin login
    if (!session || userRole !== 'Admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // If trying to access admin login page BUT already logged in as Admin, redirect to admin dashboard
   if (isAdminLoginPage && session && userRole === 'Admin') {
       return NextResponse.redirect(new URL('/admin/dashboard', request.url)); // Adjust dashboard path if needed
   }


  // If trying to access general protected routes (e.g., /dashboard, /profile) and not logged in, redirect to general login
  const isGeneralProtectedRoute = !isAdminRoute && !isAdminLoginPage && request.nextUrl.pathname !== '/login' && request.nextUrl.pathname !== '/register' && request.nextUrl.pathname !== '/';
   if (isGeneralProtectedRoute && !session) {
     return NextResponse.redirect(new URL('/login', request.url));
   }

   // If logged in (any role) and trying to access general login/register pages, redirect to general dashboard
   const isGeneralAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register';
   if (session && isGeneralAuthPage) {
       return NextResponse.redirect(new URL('/dashboard', request.url));
   }


  // Refresh session if needed - important!
  await supabase.auth.getSession();

  return response;
}

// Specify which routes the middleware should run for
export const config = {
  matcher: [
     /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
