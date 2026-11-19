// Structural so it serves every Sentry SDK (web, back office, mobile) without depending on one.
interface ScrubbableBreadcrumb {
  message?: string;
  data?: Record<string, unknown>;
}

interface ScrubbableEvent {
  request?: { url?: string; method?: string };
  user?: { ip_address?: string | null };
  message?: string;
  transaction?: string;
  breadcrumbs?: ScrubbableBreadcrumb[];
  exception?: { values?: Array<{ value?: string }> };
  spans?: Array<{ description?: string; data?: Record<string, unknown> }>;
}

export const FILTERED = '[Filtered]';

const SENSITIVE_WORDS = new Set([
  'token',
  'code',
  'invite',
  'magic',
  'reset',
  'otp',
  'password',
  'pin',
  'nin',
  'bvn',
  'account',
  'claim',
  'secret',
  'verifier',
]);

const BODY_KEYS = new Set([
  'body',
  'data',
  'request_body',
  'response_body',
  'requestBody',
  'responseBody',
]);

function words(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function isSensitiveName(name: string): boolean {
  const parts = words(name);
  // `status_code` is an HTTP status, not a secret code.
  if (parts.includes('status')) return false;
  return parts.some((w) => SENSITIVE_WORDS.has(w) || SENSITIVE_WORDS.has(w.replace(/s$/, '')));
}

// Opaque ids and secrets: UUIDs, long mixed tokens, and 10+ digit numbers (NIN, BVN, account numbers).
function looksOpaque(segment: string): boolean {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true;
  if (/^\d{10,}$/.test(segment)) return true;
  return segment.length >= 20 && /\d/.test(segment) && /^[A-Za-z0-9._~%-]+$/.test(segment);
}

function scrubPath(path: string): string {
  let afterSensitive = false;
  return path
    .split('/')
    .map((segment) => {
      if (!segment) return segment;
      if (isSensitiveName(segment)) {
        afterSensitive = true;
        return segment;
      }
      const redact = afterSensitive || looksOpaque(segment);
      afterSensitive = false;
      return redact ? FILTERED : segment;
    })
    .join('/');
}

export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  const base = cut === -1 ? url : url.slice(0, cut);
  const origin = /^[a-z][a-z0-9+.-]*:\/\/[^/]*/i.exec(base)?.[0] ?? '';
  return origin + scrubPath(base.slice(origin.length));
}

const URL_OR_PATH = /(^|[\s"'(])((?:[a-z][a-z0-9+.-]*:\/\/|\/)[^\s"'<>)]+)/gi;
// The lookbehind and length cap keep a long run of word characters with no `=` linear (ReDoS).
const KEY_VALUE = /(?<![\w-])([A-Za-z][\w-]{0,63})=([^&\s#"']+)/g;

export function scrubText(text: string): string {
  return text
    .replace(KEY_VALUE, (match, name: string) =>
      isSensitiveName(name) ? `${name}=${FILTERED}` : match
    )
    .replace(URL_OR_PATH, (_match, lead: string, url: string) => lead + scrubUrl(url));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (depth > 4 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  return scrubRecord(value as Record<string, unknown>, depth + 1);
}

function scrubRecord(record: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (BODY_KEYS.has(key)) continue;
    out[key] =
      isSensitiveName(key) && typeof value !== 'object' ? FILTERED : scrubValue(value, depth);
  }
  return out;
}

export function scrubBreadcrumb<T extends ScrubbableBreadcrumb>(breadcrumb: T): T {
  return {
    ...breadcrumb,
    message: breadcrumb.message ? scrubText(breadcrumb.message) : breadcrumb.message,
    data: breadcrumb.data ? scrubRecord(breadcrumb.data) : breadcrumb.data,
  };
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const scrubbed: ScrubbableEvent = { ...event };
  // An allowlist, so bodies, query strings, cookies and headers (Authorization) never leave.
  if (event.request) {
    const { url, method } = event.request;
    scrubbed.request = { url: url ? scrubUrl(url) : url, method };
  }
  if (event.user) {
    const user = { ...event.user };
    delete user.ip_address;
    scrubbed.user = user;
  }
  if (event.message) scrubbed.message = scrubText(event.message);
  if (event.transaction) scrubbed.transaction = scrubText(event.transaction);
  if (event.breadcrumbs) scrubbed.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);
  if (event.exception?.values) {
    scrubbed.exception = {
      ...event.exception,
      values: event.exception.values.map((ex) => ({
        ...ex,
        value: ex.value ? scrubText(ex.value) : ex.value,
      })),
    };
  }
  if (event.spans) {
    scrubbed.spans = event.spans.map((span) => ({
      ...span,
      description: span.description ? scrubText(span.description) : span.description,
      data: span.data ? scrubRecord(span.data) : span.data,
    }));
  }
  return scrubbed as T;
}

export function scrubbedSentryOptions(dsn: string) {
  return {
    dsn,
    sendDefaultPii: false,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  };
}
