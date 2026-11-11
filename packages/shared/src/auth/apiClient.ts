import { resolvePrimaryRoleId } from './constants';
import { installIdHeader } from './installId';
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  hasStoredSession,
  isSessionRemembered,
  saveAuthSession,
} from './authStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Sent as `x-client-app`: apps on one host share a cookie jar, so the API namespaces the refresh
// cookie per app, and it lets the API refuse non-staff accounts at staff sign-in. Unset = main web app.
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

// Known codes always get this copy, whatever message the body carries.
const FRIENDLY_ERROR_CODES: Record<string, string> = {
  // PLAN_UPGRADE_REQUIRED is deliberately absent: the backend's message names the tier the
  // feature needs, and a fixed sentence here would hide it.
  PLAN_LIMIT_REACHED:
    "You've reached the limit for your current plan. Upgrade to Pro to remove it.",
};

// Client-side backstop for raw technical text (exception names, Prisma codes, stack frames).
const TECHNICAL_MESSAGE_PATTERN =
  /Exception\b|Cannot read propert|undefined is not|is not a function|^P\d{4}\b|ECONNREFUSED|ENOTFOUND|Unexpected token|SyntaxError|null is not an object|at\s+\w+\s+\(/i;

function resolveFriendlyMessage(status: number, body: BackendErrorBody | undefined): string {
  const code = body?.error;
  if (code && FRIENDLY_ERROR_CODES[code]) return FRIENDLY_ERROR_CODES[code];

  if (Array.isArray(body?.message)) {
    // Raw class-validator messages reveal DTO drift to developers but mean nothing to users.
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

// Refresh rotates the cookie, so concurrent 401s must share one refresh call or the later ones
// fail with the old token.
let refreshPromise: Promise<boolean> | null = null;

// Tabs share the cookie and the API treats reuse as a race (or, after 30 s, theft that ends every
// session), so a per-app Web Lock queues refreshes across tabs.
const REFRESH_LOCK = `sureground-auth-refresh:${CLIENT_APP ?? 'web'}`;

const REFRESH_RETRY_DELAY_MS = 750;

const REFRESH_RATE_LIMIT_PAUSE_MS = 30_000;
let refreshBlockedUntil = 0;

function withRefreshLock<T>(work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  // The DOM typings nest the promise, hence the cast.
  return locks ? (locks.request(REFRESH_LOCK, work) as Promise<T>) : work();
}

function postRefresh(): Promise<Response> {
  return fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(CLIENT_APP ? { 'x-client-app': CLIENT_APP } : {}),
      ...installIdHeader(),
    },
    body: JSON.stringify({}),
  });
}

const SESSION_EXPIRED_KEY = 'gr_session_expired';

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function markSessionExpired() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
  // One throwing listener must not stop the rest being told.
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

// A refused refresh is retried once: without Web Locks another tab may have just rotated the
// cookie, and the retry stays inside the API's 30-second race window so it is never taken for theft.
export async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshPromise) return refreshPromise;
  if (Date.now() < refreshBlockedUntil) return false;

  refreshPromise = withRefreshLock(async () => {
    try {
      let res: Response;
      try {
        res = await postRefresh();
        if (res.status === 401) {
          await new Promise((resolve) => setTimeout(resolve, REFRESH_RETRY_DELAY_MS));
          res = await postRefresh();
        }
      } catch {
        // No answer (offline): not a reason to end the session.
        return false;
      }

      // The API is down or unreachable: the refresh cookie may still be good, so keep the session.
      if (res.status >= 500) return false;

      // Rate limited: the cookie is still good, so keep the session and wait before trying again.
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'));
        refreshBlockedUntil =
          Date.now() + (retryAfter > 0 ? retryAfter * 1000 : REFRESH_RATE_LIMIT_PAUSE_MS);
        return false;
      }

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

      // The cookie is shared by every app on this host, so it may belong to someone else; end the
      // session rather than show one person's profile over another's token.
      const storedUser = getStoredUser<Record<string, unknown>>();
      const refreshedUserId = tokenSubject(data.accessToken);
      if (
        storedUser &&
        typeof storedUser.id === 'string' &&
        refreshedUserId &&
        storedUser.id !== refreshedUserId
      ) {
        clearAuthSession();
        markSessionExpired();
        return false;
      }

      const rememberMe = isSessionRemembered();
      const user = storedUser ?? (await fetchSessionProfile(data.accessToken));
      saveAuthSession({ accessToken: data.accessToken, user }, rememberMe);
      return true;
    } catch {
      clearAuthSession();
      markSessionExpired();
      return false;
    }
  }).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// The cookie is not port-scoped, so a sibling app can hand us a session with no stored profile;
// writing `{}` instead would read as "signed in with no roles".
async function fetchSessionProfile(accessToken: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return {};
    const me = await res.json();
    if (!me?.id) return {};
    // Must match the shape saved at sign-in.
    return {
      ...me,
      fullName: me.legalName,
      role: resolvePrimaryRoleId(me.roles),
    };
  } catch {
    return {};
  }
}

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

function tokenPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}

export function tokenSubject(token: string): string | null {
  const sub = tokenPayload(token)?.sub;
  return typeof sub === 'string' ? sub : null;
}

function accessTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function ensureValidSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = getAuthToken();
  const exp = token ? accessTokenExpiry(token) : null;

  if (token && exp !== null && exp > Date.now() + 30_000) {
    return true;
  }

  return refreshSession();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  allowRefreshRetry = true
): Promise<T> {
  // The browser must set the multipart Content-Type itself, including the boundary.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...installIdHeader(),
        ...options.headers,
      },
    });
  } catch (error) {
    // Rethrow aborts so query libraries still see a cancellation.
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  // Only refresh when there is a local session: on a public page a failed refresh would fire the
  // expired listeners and bounce the visitor to sign-in. A 401 from /auth/* is real.
  if (
    response.status === 401 &&
    allowRefreshRetry &&
    !path.startsWith('/auth/') &&
    (Boolean(getAuthToken()) || hasStoredSession())
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

export interface UploadOptions {
  /** Whole percent of the request body sent, 0 to 100. 100 means sent; the server may still be working. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

const abortError = () => new DOMException('The upload was cancelled.', 'AbortError');

/**
 * A multipart POST like `apiFetch`, over XHR so the upload can report progress (fetch cannot).
 * Errors become the same `ApiError`s, with the same friendly messages; a cancel rejects with an `AbortError`.
 * No refresh retry here: `authUpload` owns that, as `authFetch` does for `apiFetch`.
 */
export function apiUpload<T>(
  path: string,
  body: FormData,
  headers: Record<string, string> = {},
  { onProgress, signal }: UploadOptions = {}
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.withCredentials = true;
    // The browser sets the multipart Content-Type itself, including the boundary.
    Object.entries({ ...installIdHeader(), ...headers }).forEach(([name, value]) =>
      xhr.setRequestHeader(name, value)
    );

    let last = -1;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const percent = Math.min(100, Math.floor((event.loaded / event.total) * 100));
      if (percent !== last) onProgress((last = percent));
    };
    const onAbort = () => xhr.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    const done = () => signal?.removeEventListener('abort', onAbort);

    xhr.onabort = () => {
      done();
      reject(abortError());
    };
    xhr.onerror = () => {
      done();
      reject(new ApiError(0, 'Unable to reach the server. Please check your connection.'));
    };
    xhr.onload = () => {
      done();
      // A Response lets the shared body and error handling read it exactly as they read fetch results.
      const nullBody = xhr.status === 204 || xhr.status === 205;
      const response = new Response(nullBody ? null : xhr.responseText, {
        status: xhr.status,
        headers: {
          'content-type': xhr.getResponseHeader('content-type') ?? '',
          'x-request-id': xhr.getResponseHeader('x-request-id') ?? '',
        },
      });
      void readResponseBody<T>(response).then((parsed) => {
        if (response.ok) return resolve(parsed as T);
        const errorBody = parsed as BackendErrorBody | undefined;
        reject(
          new ApiError(response.status, resolveFriendlyMessage(response.status, errorBody), {
            ...errorBody,
            requestId: errorBody?.requestId ?? (response.headers.get('x-request-id') || undefined),
          })
        );
      }, reject);
    };
    xhr.send(body);
  });
}

export async function currentAccessToken(): Promise<string | null> {
  const token = getAuthToken();
  if (token || !hasStoredSession()) return token;
  await refreshSession();
  return getAuthToken();
}

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
