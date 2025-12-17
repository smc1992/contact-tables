import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip admin pages during static export
  if (pathname.startsWith('/admin')) {
    // During build/export, return a 404 for admin pages to prevent static generation
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-export') {
      return new NextResponse(null, { status: 404 });
    }
    
    // In normal operation, allow the request to proceed
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

// Configure the middleware to match specific paths
export const config = {
  matcher: ['/admin/:path*'],
};
