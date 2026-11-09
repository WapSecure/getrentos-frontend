import { NextResponse, type NextRequest } from 'next/server';
import {
  EMBED_FRAME_ORIGINS,
  MAP_TILE_ORIGINS,
  STRICT_TRANSPORT_SECURITY,
  buildContentSecurityPolicy,
  cspHeaderName,
  isLocalHost,
  parseOriginList,
  cspReportUri,
} from '@sureground/shared/csp';

// Report-Only by default (violations logged, nothing blocked); build with NEXT_PUBLIC_CSP_ENFORCE=true to enforce. Inlined at build time.
const ENFORCE_CSP = process.env.NEXT_PUBLIC_CSP_ENFORCE === 'true';
const LIVE_CAPTURE_PATH = /\/(verification|trust-score)(\/|$)/;
const DEV = process.env.NODE_ENV !== 'production';

// The nonce is set on the response and the forwarded request (Next reads it from there); `x-nonce` carries it to the root layout.
// No auth gate: the access token lives in page memory and the refresh cookie is on the API origin with Path=/auth, so the role layouts enforce auth.
export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // HTTPS-only behaviour stays off on localhost; `nextUrl.hostname` is the bind host, so read the public host.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const secure = !DEV && !isLocalHost(host);
  // Only the verification pages run Smile ID's live selfie: camera, WebAssembly
  // and Smile's hosts are allowed there and nowhere else.
  const liveCapture = LIVE_CAPTURE_PATH.test(request.nextUrl.pathname);
  const policy = buildContentSecurityPolicy({
    nonce,
    dev: DEV,
    liveCapture,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    // Server-only, read at runtime.
    mediaOrigins: parseOriginList(process.env.CSP_MEDIA_ORIGINS),
    imgSrc: [...MAP_TILE_ORIGINS, 'https://image.mux.com'],
    frameSrc: EMBED_FRAME_ORIGINS,
    // Browsers ignore it in a Report-Only policy (and warn), so only when enforcing.
    upgradeInsecureRequests: secure && ENFORCE_CSP,
    reportUri: cspReportUri(process.env.CSP_REPORT_URI, process.env.NEXT_PUBLIC_API_URL),
  });
  const cspHeader = cspHeaderName(ENFORCE_CSP);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(cspHeader, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const headers = response.headers;
  headers.set(cspHeader, policy);
  if (secure) headers.set('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    `camera=${liveCapture ? '(self)' : '()'}, microphone=(), geolocation=(self), payment=()`
  );
  headers.set('X-DNS-Prefetch-Control', 'on');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.[\\w]+$).*)'],
};
