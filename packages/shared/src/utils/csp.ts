/**
 * Content-Security-Policy and Strict-Transport-Security for the Next.js apps.
 *
 * Both proxies (apps/web/proxy.ts, apps/backoffice/proxy.ts) build their policy
 * here so the two stay in step; each passes only the third parties it really
 * loads. Pure string building, no Next or Node imports, so it is safe to import
 * from the proxy and testable from the mobile jest suite.
 *
 * Scripts are locked down with a per-request nonce plus 'strict-dynamic': Next
 * stamps the nonce on its own <script> tags (it reads it back from the request's
 * Content-Security-Policy header), and scripts those load are trusted in turn.
 * A host allowlist for scripts is deliberately absent; with 'strict-dynamic'
 * browsers ignore it anyway.
 */
import { TOUR_HOSTS } from './videoSource';

export interface ContentSecurityPolicyOptions {
  /** Fresh per request; base64. */
  nonce: string;
  /** `next dev`: allows 'unsafe-eval' (React/Next dev tooling needs it) and any localhost port. */
  dev: boolean;
  /** The Sureground API base URL (NEXT_PUBLIC_API_URL). Allowed for fetch, websockets, images, media and framed documents. */
  apiUrl?: string | null;
  /** Upload storage / CDN origins when they differ from the API (e.g. the S3 host behind presigned URLs). */
  mediaOrigins?: readonly string[];
  /** Extra origins per directive, for the third parties an app actually uses. */
  connectSrc?: readonly string[];
  imgSrc?: readonly string[];
  mediaSrc?: readonly string[];
  frameSrc?: readonly string[];
  /**
   * Adds `upgrade-insecure-requests`. Only for production over HTTPS: on
   * http://localhost it would rewrite the page's own assets to https and break
   * it, and browsers ignore it in a Report-Only policy.
   */
  upgradeInsecureRequests?: boolean;
  /** Where browsers POST violation reports (`report-uri`). */
  reportUri?: string | null;
  /**
   * Pages that run Smile ID's live selfie capture (@smileid/web-sdk): its face
   * tracker is WebAssembly with models from Smile's model host, it may run in
   * blob workers, its instruction animations fetch a player from jsDelivr or
   * unpkg, and the capture is sent straight to Smile's API. Only those pages.
   */
  liveCapture?: boolean;
}

/** Everything Smile ID's browser capture contacts (see `liveCapture`). */
export const SMILE_LIVE_CAPTURE_ORIGINS = [
  'https://web-models.smileidentity.com',
  'https://api.smileidentity.com',
  'https://testapi.smileidentity.com',
  'https://cdn.jsdelivr.net',
  'https://unpkg.com',
] as const;

/** Sent only in production over HTTPS; never on localhost (it would pin the dev host to HTTPS). */
export const STRICT_TRANSPORT_SECURITY = 'max-age=31536000; includeSubDomains';

/**
 * Listing video players (see videoSource.ts) and 360° tour providers, which
 * the shortlet detail page frames. Tour hosts match their subdomains too, as
 * `tourSource` does.
 */
export const EMBED_FRAME_ORIGINS: readonly string[] = [
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
  ...TOUR_HOSTS.flatMap((host) => [`https://${host}`, `https://*.${host}`]),
];

/** Hosts the Leaflet tiles in mapTiles.ts load from (Mapbox with a token, OpenStreetMap without). */
export const MAP_TILE_ORIGINS: readonly string[] = [
  'https://api.mapbox.com',
  'https://*.tile.openstreetmap.org',
];

/** Same-machine origins `next dev` talks to: the API, MinIO uploads and HMR on any port. */
const DEV_LOCAL_ORIGINS = ['http://localhost:*', 'http://127.0.0.1:*'];
const DEV_LOCAL_SOCKETS = ['ws://localhost:*', 'ws://127.0.0.1:*'];

/** `https://api.x.com/v1` → `https://api.x.com`; null for anything that is not an http(s) URL. */
export function httpOrigin(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

/** The websocket origin matching an http(s) URL: `https://api.x.com` → `wss://api.x.com`. */
export function websocketOrigin(url: string | null | undefined): string | null {
  const origin = httpOrigin(url);
  return origin ? origin.replace(/^http/, 'ws') : null;
}

/** Splits a comma/space separated env value into valid origins, dropping the rest. */
export function parseOriginList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\s,]+/)
    .map((entry) => httpOrigin(entry))
    .filter((origin): origin is string => origin !== null);
}

/**
 * True when a Host / X-Forwarded-Host value (port allowed, e.g. `localhost:3100`,
 * `[::1]:3000`) names this machine, which only ever serves plain-HTTP local
 * development. Null/empty counts as local, so HTTPS-only headers fail closed.
 */
export function isLocalHost(hostHeader: string | null | undefined): boolean {
  const first = hostHeader?.split(',')[0]?.trim().toLowerCase();
  if (!first) return true;
  const host = first.startsWith('[') ? first.slice(1, first.indexOf(']')) : first.split(':')[0];
  return (
    host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '::1'
  );
}

/**
 * Where violation reports go: CSP_REPORT_URI when set, otherwise the API's
 * receiver (POST /security/csp-report), so a report-only rollout collects
 * data without extra configuration.
 */
export function cspReportUri(
  configured: string | null | undefined,
  apiUrl: string | null | undefined
): string | null {
  if (configured && configured.trim()) return configured.trim();
  const api = apiUrl?.trim().replace(/\/+$/, '');
  return api && httpOrigin(api) ? `${api}/security/csp-report` : null;
}

/** Header name for an enforced or a watch-only policy. */
export function cspHeaderName(
  enforce: boolean
): 'Content-Security-Policy' | 'Content-Security-Policy-Report-Only' {
  return enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
}

function sourceList(...groups: ReadonlyArray<readonly (string | null | undefined)[]>): string {
  const seen = new Set<string>();
  for (const group of groups) {
    for (const source of group) {
      if (source) seen.add(source);
    }
  }
  return [...seen].join(' ');
}

/** The full policy string for one response. */
export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  const { nonce, dev } = options;
  const api = httpOrigin(options.apiUrl);
  const apiSocket = websocketOrigin(options.apiUrl);
  const media = options.mediaOrigins ?? [];
  const local = dev ? DEV_LOCAL_ORIGINS : [];

  const directives: Array<[string, string]> = [
    ['default-src', "'self'"],
    [
      'script-src',
      sourceList(
        ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
        dev ? ["'unsafe-eval'"] : [],
        // WebAssembly only, not eval: Smile's face tracker on capture pages.
        options.liveCapture ? ["'wasm-unsafe-eval'"] : []
      ),
    ],
    // 'unsafe-inline' for styles: React `style={…}` props, Leaflet and the
    // animation libraries all write inline styles, and Next injects <style>
    // tags for next/font. Inline styles cannot run code; scripts stay nonce-only.
    // (No nonce here: a nonce would make browsers ignore 'unsafe-inline'.)
    ['style-src', "'self' 'unsafe-inline'"],
    ['img-src', sourceList(["'self'", 'data:', 'blob:', api], media, local, options.imgSrc ?? [])],
    ['font-src', "'self' data:"],
    [
      'connect-src',
      sourceList(
        ["'self'", api, apiSocket],
        local,
        dev ? DEV_LOCAL_SOCKETS : [],
        options.connectSrc ?? [],
        options.liveCapture ? SMILE_LIVE_CAPTURE_ORIGINS : []
      ),
    ],
    ...(options.liveCapture ? ([['worker-src', "'self' blob:"]] as Array<[string, string]>) : []),
    ['media-src', sourceList(["'self'", 'blob:', api], media, local, options.mediaSrc ?? [])],
    // Uploaded PDFs/CSVs are previewed in an iframe straight from storage.
    ['frame-src', sourceList(["'self'", 'blob:', api], media, local, options.frameSrc ?? [])],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'none'"],
  ];

  if (options.upgradeInsecureRequests) directives.push(['upgrade-insecure-requests', '']);
  if (options.reportUri) directives.push(['report-uri', options.reportUri]);

  return directives.map(([name, value]) => (value ? `${name} ${value}` : name)).join('; ');
}
