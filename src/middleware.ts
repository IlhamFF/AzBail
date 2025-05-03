import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Function to create Supabase client specifically for middleware
const createMiddlewareClient = (request: NextRequest) => {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Middleware: Missing Supabase URL or Anon Key.");
    // Return a response indicating configuration error, or handle gracefully
    // For simplicity, we'll return the original response, but logging is crucial
    return { supabase: null, response };
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  return { supabase, response };
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session if needed - important!
  const { data: { session } } = await supabase.auth.getSession();

  const userRole = session?.user?.user_metadata?.role;
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin/login';
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin/login';

  // --- Admin Route Protection ---
  if (isAdminRoute && !isAdminLoginPage) {
    // If accessing admin routes (not admin login) and not logged in or not Admin, redirect to admin login
    if (!session || userRole !== 'Admin') {
      console.log(`Middleware: Denying access to admin route ${pathname} for user role ${userRole}. Redirecting to /admin/login.`);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // --- Admin Login Page Handling ---
  if (isAdminLoginPage) {
    // If accessing admin login page BUT already logged in as Admin, redirect to admin dashboard
    if (session && userRole === 'Admin') {
      console.log(`Middleware: Admin user already logged in. Redirecting from ${pathname} to /admin/dashboard.`);
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Allow access for anyone else (including non-admins trying to log in)
  }

  // --- General Protected Route Protection ---
  // Check if the route requires general authentication (not admin, not public auth pages, not root)
  const requiresGeneralAuth = !isAdminRoute && !isAuthPage && pathname !== '/';
  if (requiresGeneralAuth && !session) {
    console.log(`Middleware: Denying access to general protected route ${pathname}. Redirecting to /login.`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- General Auth Page Handling ---
  if (isAuthPage && !isAdminLoginPage) { // Exclude admin login page here
    // If accessing general login/register page BUT already logged in, redirect to general dashboard
    if (session) {
      console.log(`Middleware: User already logged in. Redirecting from ${pathname} to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If all checks pass, continue to the requested route
  console.log(`Middleware: Allowing access to ${pathname} for user role ${userRole}.`);
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

    