import * as WebBrowser from 'expo-web-browser';
import { env } from '../env';

WebBrowser.maybeCompleteAuthSession();

/** Allowlisted on the backend — must match exactly. */
const NATIVE_REDIRECT = 'getrentos://oauth';

export type OAuthResult =
  | { kind: 'session'; accessToken: string; refreshToken: string }
  /** The account has an authenticator app: finish with its code, like a password sign-in. */
  | { kind: 'challenge'; challengeToken: string };

export class OAuthCancelled extends Error {
  constructor() {
    super('Sign-in was cancelled');
    this.name = 'OAuthCancelled';
  }
}

/**
 * Runs a provider sign-in in a secure system browser tab and returns the tokens
 * the backend hands back on the `getrentos://oauth#...` deep link.
 */
export async function startOAuth(provider: 'google'): Promise<OAuthResult> {
  const authUrl =
    `${env.apiUrl}/auth/oauth/${provider}` + `?redirect_uri=${encodeURIComponent(NATIVE_REDIRECT)}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, NATIVE_REDIRECT, {
    showInRecents: false,
    preferEphemeralSession: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') throw new OAuthCancelled();
  if (result.type !== 'success' || !result.url) {
    throw new Error('Sign-in did not complete. Please try again.');
  }

  // Tokens come back in the URL fragment or query:
  //   getrentos://oauth#access_token=…&refresh_token=…
  const { url } = result;
  const afterHash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const afterQuery = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(afterHash || afterQuery);

  // The API refused the sign-in (e.g. a suspended account) — show its reason.
  const refusal = params.get('error');
  if (refusal) throw new Error(refusal);

  const challengeToken = params.get('challenge_token');
  if (challengeToken) return { kind: 'challenge', challengeToken };

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Sign-in response was incomplete. Please try again.');
  }
  return { kind: 'session', accessToken, refreshToken };
}
