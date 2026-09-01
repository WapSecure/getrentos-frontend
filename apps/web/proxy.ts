import { NextResponse } from 'next/server';

/**
 * Next 16 proxy (formerly known as middleware). Runs on the Node.js runtime
 * for every matching request.
 *
 * Responsibility: apply hardening security headers to every response.
 *
 * It does NOT gate auth. The session lives in two places the proxy cannot see:
 * the access token is in web storage (JS-only, by design), and the refresh
 * token is an httpOnly cookie set by the API on a different origin
 * (localhost:4000 in dev) and scoped `Path=/auth` — so it is never attached to
 * a request for a page route on this origin. Auth is enforced client-side by
 * the role layouts (`ensureValidSession()` + `isAuthenticated()` + role check).
 * A server-side gate only becomes possible once the app and API share an origin
 * and the refresh cookie is path-`/`; revisit this then.
 */
export default function proxy() {
  const response = NextResponse.next();
  const headers = response.headers;
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  headers.set('X-DNS-Prefetch-Control', 'on');
  return response;
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.[\\w]+$).*)'],
};
