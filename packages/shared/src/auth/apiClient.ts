import { STORAGE_KEYS } from './constants';
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from './authStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await readResponseBody<never>(response)) as BackendErrorBody | undefined;
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : body?.message || fallbackMessage(response.status);
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

/** Marks that the session could not be restored (shown on the login screen). */
export function markSessionExpired() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_EXPIRED_KEY, '1');
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
        headers: { 'Content-Type': 'application/json' },
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
      const user = getStoredUser<Record<string, unknown>>() ?? {};
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
 * Signs out on both sides: revokes the refresh token on the backend (via the
 * httpOnly cookie) and clears all client-side session state. Always resolves.
 */
export async function logoutSession(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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

  const body = await readResponseBody<T>(response);

  if (!response.ok) {
    const errorBody = body as BackendErrorBody | undefined;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message || fallbackMessage(response.status);
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
