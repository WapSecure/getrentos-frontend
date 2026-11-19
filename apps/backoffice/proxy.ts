import { NextResponse, type NextRequest } from 'next/server';
import {
  STRICT_TRANSPORT_SECURITY,
  buildContentSecurityPolicy,
  parseOriginList,
  cspReportUri,
  sentryConnectSources,
} from '@sureground/shared/csp';

const DEV = process.env.NODE_ENV !== 'production';
// Server-only, read at runtime: lets a production build run over plain http on a developer machine.
const LOCAL_HTTP = process.env.LOCAL_HTTP === 'true';

// Security headers plus a per-request nonce CSP, enforced from the start (staff-only; the only third party is Sentry, when a DSN is set).
// The nonce also goes on the forwarded request because Next stamps rendered scripts from it, so pages must render dynamically.
// Not an auth gate: the access token lives in page memory and the httpOnly gr_refresh cookie belongs to the API origin with Path=/auth, so no page request carries a session.
export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // Decided by configuration, never a request header: any client can send `X-Forwarded-Host: localhost`.
  const secure = !DEV && !LOCAL_HTTP;
  const policy = buildContentSecurityPolicy({
    nonce,
    dev: DEV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    mediaOrigins: parseOriginList(process.env.CSP_MEDIA_ORIGINS),
    connectSrc: sentryConnectSources(process.env.NEXT_PUBLIC_SENTRY_DSN),
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
