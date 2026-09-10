import * as WebBrowser from 'expo-web-browser';
import { env } from '../env';

WebBrowser.maybeCompleteAuthSession();

/** Allowlisted on the backend — must match exactly. */
const NATIVE_REDIRECT = 'getrentos://oauth';

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

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
export async function startOAuth(provider: 'google'): Promise<OAuthTokens> {
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
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Sign-in response was incomplete. Please try again.');
  }
  return { accessToken, refreshToken };
}
