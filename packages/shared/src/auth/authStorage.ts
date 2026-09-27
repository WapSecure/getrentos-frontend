import { STORAGE_KEYS } from './constants';

type AuthSession = {
  accessToken: string;
  /** Kept optional for backwards compatibility; never persisted (httpOnly cookie). */
  refreshToken?: string;
  user: Record<string, unknown>;
};

const storages = () =>
  typeof window === 'undefined' ? [] : ([localStorage, sessionStorage] as const);

const REMEMBERED_IDENTIFIER_KEY = 'getrentos_remembered_identifier';

export function getAuthToken() {
  return (
    storages()
      .map((storage) => storage.getItem(STORAGE_KEYS.AUTH_TOKEN))
      .find(Boolean) ?? null
  );
}

export function getStoredUser<T>() {
  const raw = storages()
    .map((storage) => storage.getItem(STORAGE_KEYS.USER))
    .find(Boolean);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Merges fields into the saved user in whichever storage holds it, e.g. new
 * roles after the account gains a workspace. No-op when nobody is signed in.
 */
export function updateStoredUser(patch: Record<string, unknown>) {
  for (const storage of storages()) {
    const raw = storage.getItem(STORAGE_KEYS.USER);
    if (!raw) continue;
    try {
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify({ ...JSON.parse(raw), ...patch }));
    } catch {
      // Unreadable entry: leave it for the next sign-in to replace.
    }
  }
}

/**
 * Persists a login across browser restarts only when the user opts in.
 * NOTE: the refresh token is NOT stored here — it lives in an httpOnly cookie
 * (set by the backend) so it is invisible to JavaScript and immune to XSS.
 * Only the short-lived access token and profile are kept client-side.
 */
export function saveAuthSession(session: AuthSession, rememberMe: boolean) {
  if (typeof window === 'undefined') return;
  clearAuthSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.accessToken);
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
}

export function clearAuthSession() {
  for (const storage of storages()) {
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER);
  }
}

/** Remembers the sign-in identifier (email/phone) for prefill when "Remember me" is checked. */
export function saveRememberedIdentifier(identifier: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier);
}

export function getRememberedIdentifier(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) ?? '';
}

export function clearRememberedIdentifier() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
}

export const REMEMBERED_IDENTIFIER_STORAGE_KEY = REMEMBERED_IDENTIFIER_KEY;
