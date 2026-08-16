import { STORAGE_KEYS } from './constants';
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from './authStorage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

if (process.env.NODE_ENV === 'production' && !API_BASE_URL.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_API_URL must use https:// in production');
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface BackendErrorBody {
  message?: string | string[];
  error?: string;
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
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body: BackendErrorBody | T | undefined = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const errorBody = body as BackendErrorBody | undefined;
    const message = Array.isArray(errorBody?.message)
      ? errorBody.message.join(', ')
      : errorBody?.message || 'Something went wrong. Please try again.';
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}
