import { NextResponse, type NextRequest } from 'next/server';
import {
  EMBED_FRAME_ORIGINS,
  MAP_TILE_ORIGINS,
  STRICT_TRANSPORT_SECURITY,
  buildContentSecurityPolicy,
  cspHeaderName,
  isLocalHost,
  parseOriginList,
} from '@getrentos/shared/csp';

/**
 * CSP rollout switch. This is the customer-facing app, with more third parties
 * (map tiles, video and 360° tour embeds, uploads served from storage) than the
 * back office, so by default the policy is sent as
 * Content-Security-Policy-Report-Only: browsers log every violation to the
 * console (and POST it to CSP_REPORT_URI when set) but block nothing. Watch it
 * in staging/production, add any missing origin, then build with
 * NEXT_PUBLIC_CSP_ENFORCE=true to enforce it. Inlined at build time.
 */
const ENFORCE_CSP = process.env.NEXT_PUBLIC_CSP_ENFORCE === 'true';
const DEV = process.env.NODE_ENV !== 'production';

/**
 * Next 16 proxy (formerly known as middleware). Runs on the Node.js runtime
 * for every matching request.
 *
 * Responsibility: apply hardening security headers to every response,
 * including a per-request nonce Content-Security-Policy (policy built in
 * @getrentos/shared/csp) and, in production over HTTPS, Strict-Transport-Security.
 *
 * Nonce wiring: the policy is set on the response and also on the forwarded
 * request, because Next reads the nonce back out of the request's CSP header and
 * stamps it on every script it renders. `x-nonce` carries it to the root layout
 * for the theme script (next-themes). A fresh nonce per request means pages must
 * render dynamically: a prerendered page would carry no nonce and its scripts
 * would be blocked, which is why the root layout reads `x-nonce`.
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
export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  // HTTPS-only behaviour (HSTS, upgrade-insecure-requests) stays off in dev and
  // for `next start` on localhost. `nextUrl.hostname` is the server's own bind
  // host, so read the public host the request was addressed to.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const secure = !DEV && !isLocalHost(host);
  const policy = buildContentSecurityPolicy({
    nonce,
    dev: DEV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    // Upload storage/CDN origins when they differ from the API (comma
    // separated; server-only, read at runtime).
    mediaOrigins: parseOriginList(process.env.CSP_MEDIA_ORIGINS),
    // Leaflet tiles, and Mux posters on shortlet listing videos.
    imgSrc: [...MAP_TILE_ORIGINS, 'https://image.mux.com'],
    // YouTube/Vimeo players and 360° tour providers on shortlet listings.
    frameSrc: EMBED_FRAME_ORIGINS,
    // Browsers ignore it in a Report-Only policy (and warn), so only when enforcing.
    upgradeInsecureRequests: secure && ENFORCE_CSP,
    reportUri: process.env.CSP_REPORT_URI,
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
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=()');
  headers.set('X-DNS-Prefetch-Control', 'on');
  return response;
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.[\\w]+$).*)'],
};
