import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const waitlistMode = process.env.NEXT_PUBLIC_WAITLIST_MODE === 'true';
  const isWaitlistPage = request.nextUrl.pathname === '/waitlist';

  // If waitlist mode is enabled and user is not on waitlist page, redirect to waitlist
  if (waitlistMode && !isWaitlistPage) {
    // Don't redirect static files, API routes, or Next.js internals
    if (
      !request.nextUrl.pathname.startsWith('/_next') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf|css|js)$/)
    ) {
      return NextResponse.redirect(new URL('/waitlist', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
