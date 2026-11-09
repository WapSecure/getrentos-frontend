import { STORAGE_KEYS } from './constants';

type AuthSession = {
  accessToken: string;
  // Never persisted: the refresh token is an httpOnly cookie.
  refreshToken?: string;
  user: Record<string, unknown>;
};

const storages = () =>
  typeof window === 'undefined' ? [] : ([localStorage, sessionStorage] as const);

const REMEMBERED_IDENTIFIER_KEY = 'sureground_remembered_identifier';

// Held in memory only, never Web Storage, which any injected script can read.
let accessToken: string | null = null;

const LEGACY_TOKEN_KEYS = [STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN];

// Sign-in forms save `{ ...result }` as the profile, so these must be dropped before storing it.
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

// Earlier builds stored the token: drop it on first load.
try {
  removeLegacyTokens();
} catch {
  // Storage blocked (privacy mode): there is nothing in it to remove.
}

export function getAuthToken() {
  return accessToken;
}

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

export function hasStoredSession(): boolean {
  return storages().some((storage) => Boolean(storage.getItem(STORAGE_KEYS.USER)));
}

export function isSessionRemembered(): boolean {
  return typeof window !== 'undefined' && Boolean(localStorage.getItem(STORAGE_KEYS.USER));
}

// Exact once protected pages have run `ensureValidSession()`, which restores the token or clears the profile.
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(accessToken) || hasStoredSession();
}

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
