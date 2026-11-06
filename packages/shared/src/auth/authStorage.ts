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

/**
 * The access token lives in this module and nowhere else (security gap AU-16).
 *
 * Web Storage is readable by any script on the page, so a token kept there is
 * one injected script away from being stolen. In memory it dies with the page;
 * a reload gets a new one from the refresh-token cookie (httpOnly, so scripts
 * cannot read it either) — see `ensureValidSession`/`refreshSession`.
 */
let accessToken: string | null = null;

/** Token keys earlier builds wrote to Web Storage. Only ever removed now. */
const LEGACY_TOKEN_KEYS = [STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN];

/**
 * Fields of a sign-in response that are credentials, not profile. Sign-in
 * forms save `{ ...result, ... }` as the profile, so these must be dropped
 * before it is stored.
 */
const CREDENTIAL_FIELDS = ['accessToken', 'refreshToken', 'challengeToken'];

function withoutCredentials(user: Record<string, unknown>): Record<string, unknown> {
  const profile = { ...user };
  for (const field of CREDENTIAL_FIELDS) delete profile[field];
  return profile;
}

function removeLegacyTokens() {
  for (const storage of storages()) {
    for (const key of LEGACY_TOKEN_KEYS) storage.removeItem(key);
    // Earlier builds also saved the token inside the profile.
    const raw = storage.getItem(STORAGE_KEYS.USER);
    if (!raw) continue;
    try {
      const user = JSON.parse(raw) as Record<string, unknown>;
      if (CREDENTIAL_FIELDS.some((field) => field in user)) {
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(withoutCredentials(user)));
      }
    } catch {
      storage.removeItem(STORAGE_KEYS.USER);
    }
  }
}

// A browser that signed in on an earlier build still holds its token in
// storage: drop it on first load. The profile stays (minus any token), so the
// session is restored from the refresh cookie like any other reload.
try {
  removeLegacyTokens();
} catch {
  // Storage blocked (privacy mode): there is nothing in it to remove.
}

/** The current access token, held in memory only. Null until signed in or refreshed. */
export function getAuthToken() {
  return accessToken;
}

/** Replaces the in-memory access token (null forgets it). Never written to storage. */
export function setAuthToken(token: string | null) {
  accessToken = token;
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
 * True when this browser has a saved profile from a sign-in, i.e. there is a
 * session worth restoring from the refresh cookie. The profile is display data
 * (name, roles), not a credential.
 */
export function hasStoredSession(): boolean {
  return storages().some((storage) => Boolean(storage.getItem(STORAGE_KEYS.USER)));
}

/**
 * Whether the saved session is a "remember me" one: its profile is kept in
 * localStorage (survives a browser restart) rather than sessionStorage.
 */
export function isSessionRemembered(): boolean {
  return typeof window !== 'undefined' && Boolean(localStorage.getItem(STORAGE_KEYS.USER));
}

/**
 * Signed in, or expected to be: an access token in memory, or a saved profile
 * whose token has not been restored yet (a page that just loaded). Protected
 * pages call `ensureValidSession()` first, which either restores the token or
 * clears the profile, so this is exact by the time they check it.
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(accessToken) || hasStoredSession();
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
      storage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(withoutCredentials({ ...JSON.parse(raw), ...patch }))
      );
    } catch {
      // Unreadable entry: leave it for the next sign-in to replace.
    }
  }
}

/**
 * Starts a session. The access token is kept in memory only; the refresh
 * token is an httpOnly cookie set by the backend, whose lifetime "remember
 * me" decides. Only the profile is stored, in localStorage for a remembered
 * session and sessionStorage otherwise, so the header can render and a reload
 * knows there is a session to restore.
 */
export function saveAuthSession(session: AuthSession, rememberMe: boolean) {
  if (typeof window === 'undefined') return;
  clearAuthSession();
  accessToken = session.accessToken;
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(withoutCredentials(session.user)));
}

export function clearAuthSession() {
  accessToken = null;
  removeLegacyTokens();
  for (const storage of storages()) storage.removeItem(STORAGE_KEYS.USER);
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
