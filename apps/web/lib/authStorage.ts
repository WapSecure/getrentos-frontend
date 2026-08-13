import { STORAGE_KEYS } from '@/lib/constants/auth';

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
};

const storages = () =>
  typeof window === 'undefined' ? [] : [localStorage, sessionStorage] as const;

export function getAuthToken() {
  return storages().map((storage) => storage.getItem(STORAGE_KEYS.AUTH_TOKEN)).find(Boolean) ?? null;
}

export function getStoredUser<T>() {
  const raw = storages().map((storage) => storage.getItem(STORAGE_KEYS.USER)).find(Boolean);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Persists a login across browser restarts only when the user opts in. */
export function saveAuthSession(session: AuthSession, rememberMe: boolean) {
  if (typeof window === 'undefined') return;
  clearAuthSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.accessToken);
  storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken);
  storage.setItem(STORAGE_KEYS.USER, JSON.stringify(session.user));
}

export function clearAuthSession() {
  for (const storage of storages()) {
    storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    storage.removeItem(STORAGE_KEYS.USER);
  }
}
