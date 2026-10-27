import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const AUTH_PAGES = ['/login', '/register'];

// Runs on every page navigation. It is also where a rotated access token is persisted:
// server components cannot write cookies, the proxy can.
export default auth((req) => {
  const { pathname, search, origin } = req.nextUrl;
  const signedIn = !!req.auth && !req.auth.error;
  const onAuthPage = AUTH_PAGES.includes(pathname);

  if (!signedIn && !onAuthPage) {
    const url = new URL('/login', origin);
    url.searchParams.set('callbackUrl', pathname + search);
    if (req.auth?.error) url.searchParams.set('reason', 'session_expired');
    return NextResponse.redirect(url);
  }
  if (signedIn && onAuthPage) return NextResponse.redirect(new URL('/rooms', origin));
});

export const config = {
  // Everything except the Auth.js endpoints, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
