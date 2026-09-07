import { secureStorage } from '../storage';

/**
 * Session tokens. On device they live in the OS secure enclave; the access
 * token is short-lived and the refresh token is rotated on every use.
 */
const ACCESS_KEY = 'getrentos.accessToken';
const REFRESH_KEY = 'getrentos.refreshToken';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function readTokens(): Promise<SessionTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    secureStorage.get(ACCESS_KEY),
    secureStorage.get(REFRESH_KEY),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function writeTokens(tokens: SessionTokens): Promise<void> {
  await Promise.all([
    secureStorage.set(ACCESS_KEY, tokens.accessToken),
    secureStorage.set(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([secureStorage.remove(ACCESS_KEY), secureStorage.remove(REFRESH_KEY)]);
}

/** Decodes a JWT `exp` (seconds → ms). Returns null when unreadable. */
export function accessTokenExpiry(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      )
    ) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}
