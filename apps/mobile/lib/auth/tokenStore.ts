import { secureStorage } from '../storage';

// The refresh token is rotated on every use.
const ACCESS_KEY = 'sureground.accessToken';
const REFRESH_KEY = 'sureground.refreshToken';

export const TOKEN_KEYS = [ACCESS_KEY, REFRESH_KEY];

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface StoredTokens {
  accessToken: string | null;
  refreshToken: string;
}

export async function readTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([
    secureStorage.get(ACCESS_KEY),
    secureStorage.get(REFRESH_KEY),
  ]);
  if (!refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function writeTokens(tokens: StoredTokens): Promise<void> {
  await Promise.all([
    tokens.accessToken
      ? secureStorage.set(ACCESS_KEY, tokens.accessToken)
      : secureStorage.remove(ACCESS_KEY),
    secureStorage.set(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([secureStorage.remove(ACCESS_KEY), secureStorage.remove(REFRESH_KEY)]);
}

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
