/**
 * Next.js middleware — route protection.
 *
 * Checks for JWT token in localStorage via cookie (or header).
 * Since middleware runs on the Edge, we can't access localStorage directly.
 * Instead we check for the auth cookie set by the client.
 *
 * Strategy:
 *  - `/admin/*` routes → require auth → redirect to /login if no token
 *  - `/login` → redirect to /admin if already authenticated
 *  - Everything else → pass through
 *
 * Note: This is a lightweight check. The real auth validation happens
 * server-side (Spring Boot) when the JWT is sent with API requests.
 */

import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".") // files with extensions (favicon, images, etc.)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Client guards own auth redirects after zustand rehydrates from localStorage.
  // Middleware cannot read localStorage, so cookie-based redirects can cause page bounce.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
