import { NextResponse, type NextRequest } from 'next/server';

// FairPlan middleware: surface the current pathname to server components via
// a request header (Astro's Astro.url.pathname replacement). Auth + lang are
// resolved per-request in server helpers — see src/lib/auth-server.ts and
// src/lib/i18n-server.ts — so middleware stays edge-runtime safe and never
// touches D1.
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip API routes, Next internals, and static assets — they don't need
  // x-pathname and matching them just wastes budget.
  matcher: ['/((?!api|_next/static|_next/image|favicon.svg).*)'],
};
