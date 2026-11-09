import { NextResponse, type NextRequest } from 'next/server';
import {
  STRICT_TRANSPORT_SECURITY,
  buildContentSecurityPolicy,
  isLocalHost,
  parseOriginList,
  cspReportUri,
} from '@sureground/shared/csp';

const DEV = process.env.NODE_ENV !== 'production';

// Security headers plus a per-request nonce CSP, enforced from the start (staff-only, nothing third-party).
// The nonce also goes on the forwarded request because Next stamps rendered scripts from it, so pages must render dynamically.
// Not an auth gate: the access token lives in page memory and the httpOnly gr_refresh cookie belongs to the API origin with Path=/auth, so no page request carries a session.
export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // HTTPS-only headers stay off on localhost; nextUrl.hostname is the bind host, so read the host the request was addressed to.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const secure = !DEV && !isLocalHost(host);
  const policy = buildContentSecurityPolicy({
    nonce,
    dev: DEV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    mediaOrigins: parseOriginList(process.env.CSP_MEDIA_ORIGINS),
    upgradeInsecureRequests: secure,
    reportUri: cspReportUri(process.env.CSP_REPORT_URI, process.env.NEXT_PUBLIC_API_URL),
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const headers = response.headers;
  headers.set('Content-Security-Policy', policy);
  if (secure) headers.set('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  headers.set('X-DNS-Prefetch-Control', 'on');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.[\\w]+$).*)'],
};
