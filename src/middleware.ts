import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Request for matched route: ${pathname}`);

  // Prepare response object for potential cookie setting by Supabase
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
      cookieOptions: {
        name: 'contact-tables-auth',
      },
    }
  );

  console.log('[Middleware] Attempting to get session from Supabase...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('[Middleware] Error getting session:', sessionError.message);
    // Allow request to proceed so the page can handle the error, or redirect to an error page
    return response; 
  }

  // If no session, and the route is protected (i.e., it's in the matcher),
  // redirect to login with callbackUrl.
  if (!session) {
    const originalPathAndQuery = pathname + request.nextUrl.search;
    const callbackQueryParam = encodeURIComponent(originalPathAndQuery);
    const redirectTo = `${request.nextUrl.origin}/auth/login?callbackUrl=${callbackQueryParam}`;
    console.log(`[Middleware] No session for matched route ${pathname}. Redirecting to: ${redirectTo}`);
    
    const redirectResponse = NextResponse.redirect(redirectTo);
    // Ensure cookies from the initial 'response' (potentially modified by getSession if it clears tokens)
    // are copied to the redirectResponse.
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // User has a session. Proceed with role checks or allow access.
  const roleFromMetaData = session.user.user_metadata?.data?.role as string || session.user.user_metadata?.role as string || 'CUSTOMER';
  console.log(`[Middleware] User ${session.user.id} has session. Role from data.role or root.role: ${roleFromMetaData}`);
  const userRole = roleFromMetaData;

  // Role-based access control for specific protected paths
  if (pathname.startsWith('/dashboard/admin') && userRole !== 'ADMIN') {
    console.log(`[Middleware] Role mismatch: User ${session.user.id} (role ${userRole}) accessing ADMIN path. Redirecting to /`);
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/restaurant/dashboard')) {
    console.log(`[Middleware] Path is /restaurant/dashboard/*. Current role: ${userRole}. Checking if role is NOT RESTAURANT.`);
    if (userRole !== 'RESTAURANT') {
      console.log(`[Middleware] Role mismatch CONFIRMED: User ${session.user.id} (role ${userRole}) accessing RESTAURANT path. Redirecting to /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Optional: Handle homepage redirection for logged-in users
  // if (pathname === '/' && session) { // Already checked for session
  //   const userDashboard = userRole === 'ADMIN' ? '/dashboard/admin' : userRole === 'RESTAURANT' ? '/restaurant/dashboard' : '/customer/dashboard';
  //   console.log(`[Middleware] User logged in, redirecting from / to ${userDashboard}`);
  //   return NextResponse.redirect(new URL(userDashboard, request.url));
  // }

  console.log(`[Middleware] Access granted for ${userRole} to ${pathname}.`);
  // Pass the response object which may have been modified by Supabase (e.g., Set-Cookie headers for session refresh)
  return response; 
}

export const config = {
  matcher: [
    // Routes that require authentication or special session-aware handling
    '/dashboard/admin/:path*',
    '/restaurant/dashboard/:path*',
    // '/dashboard/user/:path*', // Add if you have a generic user dashboard that's protected

    '/api/restaurant/:path*', // Restaurant API routes
    // DO NOT include /auth/login, /auth/register, /auth/callback etc. here
    // Public API routes that don't need this auth middleware should also be excluded.
    // Example: '/api/public-data'
    // Supabase auth callbacks (e.g. /api/auth/callback) are handled by their own API routes.
  ],
};