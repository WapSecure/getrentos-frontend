import { STORAGE_KEYS } from '@/lib/constants/auth';
import { clearAuthSession, getAuthToken, getStoredUser, saveAuthSession } from '@/lib/authStorage';

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
// The refresh token is exchanged for a fresh access/refresh pair. Rotation is
// enabled on the backend, so concurrent 401s MUST share a single refresh call
// (the first one rotates the token; later ones would fail with the old token).
let refreshPromise: Promise<boolean> | null = null;

/** Reads the stored refresh token, preferring the persistent (remember-me) tier. */
function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ??
    sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  );
}

/**
 * Exchanges the stored refresh token for a fresh token pair and persists it to
 * the same tier the session was originally stored in (localStorage for
 * remember-me, sessionStorage otherwise). Single-flight: concurrent callers
 * share one in-flight refresh to avoid rotation races.
 *
 * Returns true when the session is valid again, false when it could not be
 * refreshed (in which case the session is cleared so the UI redirects to login).
 */
export async function refreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;

    // remember-me sessions live in localStorage; ephemeral ones in sessionStorage.
    const rememberMe = !!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthSession();
        return false;
      }

      const data = await res.json();
      if (!data?.accessToken || !data?.refreshToken) {
        clearAuthSession();
        return false;
      }

      const user = getStoredUser<Record<string, unknown>>() ?? {};
      saveAuthSession(
        { accessToken: data.accessToken, refreshToken: data.refreshToken, user },
        rememberMe
      );
      return true;
    } catch {
      clearAuthSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
 * page. If the access token is missing/expired and a refresh token exists, it
 * is silently exchanged for a fresh pair (remember-me survives restarts). If
 * the session can no longer be restored the storage is cleared so the caller's
 * `isAuthenticated()` check routes the user to the login page.
 */
export async function ensureValidSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const token = getAuthToken();
  const refreshToken = getStoredRefreshToken();

  if (!token && !refreshToken) return false;
  if (refreshToken) {
    const exp = token ? accessTokenExpiry(token) : null;
    if (!token || (exp !== null && exp <= Date.now() + 30_000)) {
      // Expired (or about to expire) — rotate before the first request.
      return refreshSession();
    }
  }
  return true;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Don't set Content-Type for FormData bodies — the browser must set it
  // itself (including the multipart boundary).
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
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
