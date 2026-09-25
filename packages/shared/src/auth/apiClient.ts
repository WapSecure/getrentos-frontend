import { BACKEND_ROLE_TO_ID, STORAGE_KEYS } from './constants';
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from './authStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Which app this bundle is, sent as `x-client-app`.
 *
 * The API namespaces the refresh cookie per app, because cookies are neither
 * port- nor app-scoped: several front ends on one host share a single cookie
 * jar. Without this, signing into one app rotated the cookie for all of them and
 * the others silently picked up the wrong identity. Declaring the app also lets
 * the API refuse a non-staff account at staff sign-in.
 *
 * Unset means the main web app — its cookie name is unchanged.
 */
export const CLIENT_APP = process.env.NEXT_PUBLIC_CLIENT_APP || undefined;

if (process.env.NODE_ENV === 'production' && !API_BASE_URL.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_API_URL must use https:// in production');
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  code?: string;
  requestId?: string;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    const errorBody = details as BackendErrorBody | undefined;
    this.code = errorBody?.error;
    this.requestId = errorBody?.requestId;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

interface BackendErrorBody {
  message?: string | string[];
  error?: string;
  requestId?: string;
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: 'Please check the information you entered and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested information could not be found.',
  409: 'This action conflicts with an existing record. Refresh and try again.',
  413: 'The selected file is too large.',
  429: 'Too many requests. Please wait a moment and try again.',
};

function fallbackMessage(status: number): string {
  if (FALLBACK_MESSAGES[status]) return FALLBACK_MESSAGES[status];
  if (status >= 500) return 'The service is temporarily unavailable. Please try again shortly.';
  return 'We could not complete your request. Please try again.';
}

/**
 * Known backend error codes that always get this exact copy, regardless of
 * whatever `message` the body happens to carry — keeps wording consistent
 * across every call site, including ones that don't render a dedicated
 * upsell component for the code (see VerificationRequiredNotice/
 * UpgradeToProModal, which read the structured `error`/`reason` fields
 * directly and are unaffected by this — this only reshapes the plain-text
 * fallback every other call site shows via `err.message`).
 */
const FRIENDLY_ERROR_CODES: Record<string, string> = {
  // PLAN_UPGRADE_REQUIRED is deliberately NOT in this table.
  //
  // A fixed sentence here read "This feature requires the Pro plan", and it
  // overrode whatever the backend sent. That was survivable while Pro was the
  // only paid tier; it is now wrong for every Enterprise gate, where it told an
  // estate on Pro to buy the plan they already had. The backend composes this
  // one per feature and names the tier it needs — "Contractor passes is an
  // Enterprise feature. Upgrade to Enterprise to use it." — so the body's own
  // message is the good copy, and the table entry was only ever hiding it.
  PLAN_LIMIT_REACHED:
    "You've reached the limit for your current plan. Upgrade to Pro to remove it.",
};

/**
 * Catches raw technical text that shouldn't reach an end user even when it
 * arrived as a normal single-string `message` (an unhandled exception's own
 * message/name leaking through in a non-production environment, a stray
 * Prisma error code, a JS TypeError from a bug — see http-exception.filter.ts
 * for what's already sanitized server-side; this is the client-side backstop).
 */
const TECHNICAL_MESSAGE_PATTERN =
  /Exception\b|Cannot read propert|undefined is not|is not a function|^P\d{4}\b|ECONNREFUSED|ENOTFOUND|Unexpected token|SyntaxError|null is not an object|at\s+\w+\s+\(/i;

/**
 * Resolves the single user-facing string for a failed response. Priority:
 * a known error code's fixed copy, then a generic message for validation
 * failures (class-validator's auto-generated messages use raw camelCase
 * field names like "fullName should not be empty" — never join those
 * verbatim), then the body's own message IF it doesn't look like raw
 * technical text, then a friendly per-status fallback.
 */
function resolveFriendlyMessage(status: number, body: BackendErrorBody | undefined): string {
  const code = body?.error;
  if (code && FRIENDLY_ERROR_CODES[code]) return FRIENDLY_ERROR_CODES[code];

  if (Array.isArray(body?.message)) {
    // class-validator's raw field messages ("documents.0.property url should not
    // exist") are unhelpful to users, but they are the only clue when a request
    // shape drifts from the DTO — surface them to developers, never to users.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[api] validation rejected the request:', body.message);
    }
    return 'Please check the highlighted fields and try again.';
  }

  const raw = body?.message;
  if (typeof raw === 'string' && raw.trim() && !TECHNICAL_MESSAGE_PATTERN.test(raw)) {
    return raw;
  }

  return fallbackMessage(status);
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await readResponseBody<never>(response)) as BackendErrorBody | undefined;
  const message = resolveFriendlyMessage(response.status, body);
  return new ApiError(response.status, message, {
    ...body,
    requestId: body?.requestId ?? response.headers.get('x-request-id') ?? undefined,
  });
}

async function readResponseBody<T>(response: Response): Promise<T | BackendErrorBody | undefined> {
  if (response.status === 204 || response.status === 205) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  if (!response.headers.get('content-type')?.includes('application/json')) return undefined;

  try {
    return JSON.parse(text) as T | BackendErrorBody;
  } catch {
    return undefined;
  }
}

// ---- Silent session refresh (remember-me) -----------------------------------
// The refresh token lives in an httpOnly cookie (set by the backend), so it is
// invisible to JavaScript and immune to XSS. Refreshing just calls the backend
// with credentials so the cookie is sent automatically. Rotation is enabled on
// the backend, so concurrent 401s MUST share a single refresh call (the first
// one rotates the token; later ones would fail with the old token).
let refreshPromise: Promise<boolean> | null = null;

const SESSION_EXPIRED_KEY = 'gr_session_expired';

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

/**
 * Subscribes to "the session could not be restored". Fires after the access
 * token has been cleared, so listeners can send the user to sign in rather
 * than leaving them on a page that quietly renders empty data forever.
 * Returns an unsubscribe function.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

/** Marks that the session could not be restored (shown on the login screen). */
export function markSessionExpired() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
  // A listener must never break the others, or a throwing one would silently
  // stop every later subscriber from being told.
  for (const listener of sessionExpiredListeners) {
    try {
      listener();
    } catch {
      // ignored on purpose
    }
  }
}

export function consumeSessionExpiredFlag(): boolean {
  if (typeof window === 'undefined') return false;
  const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === '1';
  if (expired) sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return expired;
}

/**
 * Exchanges the refresh-token cookie for a fresh access token. Single-flight:
 * concurrent callers share one in-flight refresh to avoid rotation races.
 *
 * Returns true when the session is valid again, false when it could not be
 * refreshed (the session is cleared and the login screen shows a notice).
 */
export async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(CLIENT_APP ? { 'x-client-app': CLIENT_APP } : {}),
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        clearAuthSession();
        markSessionExpired();
        return false;
      }

      const data = await res.json();
      if (!data?.accessToken) {
        clearAuthSession();
        markSessionExpired();
        return false;
      }

      // remember-me sessions live in localStorage; ephemeral ones in sessionStorage.
      const rememberMe = !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const user =
        getStoredUser<Record<string, unknown>>() ?? (await fetchSessionProfile(data.accessToken));
      saveAuthSession({ accessToken: data.accessToken, user }, rememberMe);
      return true;
    } catch {
      clearAuthSession();
      markSessionExpired();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Rebuilds the profile for a session that was restored from the refresh cookie
 * while nothing was in storage.
 *
 * The refresh cookie is not port-scoped, so a sibling app on another port can
 * hand us a session this app knows nothing about. Writing `{}` as the profile
 * still marks the session as authenticated, but every role check then reads it
 * as "signed in with no roles" — which is how a visitor ends up on a dashboard
 * for a role they do not have. Falls back to `{}` when the profile cannot be
 * read, so the session behaves exactly as it did before.
 */
async function fetchSessionProfile(accessToken: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return {};
    const me = await res.json();
    if (!me?.id) return {};
    // Mirrors the shape saved at sign-in: the profile plus the client-side
    // `fullName`/`role` fields the shared helpers read.
    return {
      ...me,
      fullName: me.legalName,
      role: BACKEND_ROLE_TO_ID[me.roles?.[0]] ?? 'renter',
    };
  } catch {
    return {};
  }
}

/**
 * Signs out on both sides: revokes the refresh token on the backend (via the
 * httpOnly cookie) and clears all client-side session state. Always resolves.
 */
export async function logoutSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(CLIENT_APP ? { 'x-client-app': CLIENT_APP } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch {
      // Server may be unreachable — still clear the local session.
    } finally {
      clearAuthSession();
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    }
  }
}

/** Decodes a JWT's exp claim (seconds). Returns null when unreadable. */
function accessTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Makes sure the stored session is usable before the UI renders a protected
 * page. If the access token is missing/expired and a refresh cookie exists, it
 * is silently exchanged for a fresh access token (remember-me survives
 * restarts). If no session can be restored the storage is cleared so the
 * caller's `isAuthenticated()` check routes the user to the login page.
 */
export async function ensureValidSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = getAuthToken();
  const exp = token ? accessTokenExpiry(token) : null;

  if (token && exp !== null && exp > Date.now() + 30_000) {
    // Valid (or still far enough from expiry) — nothing to do.
    return true;
  }

  // Missing or expired access token — try the refresh cookie.
  return refreshSession();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRefreshRetry = true
): Promise<T> {
  // Don't set Content-Type for FormData bodies — the browser must set it
  // itself (including the multipart boundary).
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch (error) {
    // Preserve cancellation semantics for query libraries and route changes.
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  // The access token is deliberately short-lived, so a 401 usually just means
  // it lapsed while the user was working — not that the session is over. Spend
  // the refresh cookie on it and replay the request once before treating the
  // user as signed out.
  //
  // Only when there is a local session to save: a 401 on a *public* page (an
  // anonymous visitor, or one whose token has gone stale) must not trigger a
  // refresh at all, because a failed refresh clears the session and fires the
  // expired listeners — which would bounce someone browsing the marketplace to
  // the sign-in screen. `/auth/*` is exempt too; a 401 there is the real thing.
  if (
    response.status === 401 &&
    allowRefreshRetry &&
    !path.startsWith('/auth/') &&
    Boolean(getAuthToken())
  ) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch<T>(path, options, false);
  }

  const body = await readResponseBody<T>(response);

  if (!response.ok) {
    const errorBody = body as BackendErrorBody | undefined;
    const message = resolveFriendlyMessage(response.status, errorBody);
    throw new ApiError(response.status, message, {
      ...errorBody,
      requestId: errorBody?.requestId ?? response.headers.get('x-request-id') ?? undefined,
    });
  }

  return body as T;
}

/** Fetches a binary response while preserving the same API error contract. */
export async function apiDownload(path: string, options: RequestInit = {}): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: { ...options.headers },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  if (!response.ok) throw await toApiError(response);
  return response.blob();
}
