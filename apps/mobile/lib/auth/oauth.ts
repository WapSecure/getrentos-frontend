import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../env';
import { apiFetch } from '../api/client';

WebBrowser.maybeCompleteAuthSession();

// Allowlisted on the backend: must match exactly.
const NATIVE_REDIRECT = 'sureground://oauth';

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

const base64url = (b64: string) => b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** The secret stays in the app; only its hash goes to the browser, so a code caught from the redirect is useless to another app. */
async function appSecret(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(btoa(String.fromCharCode(...Crypto.getRandomBytes(32))));
  const challenge = base64url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    })
  );
  return { verifier, challenge };
}

export async function startOAuth(provider: 'google'): Promise<OAuthResult> {
  const { verifier, challenge } = await appSecret();
  const authUrl =
    `${env.apiUrl}/auth/oauth/${provider}` +
    `?redirect_uri=${encodeURIComponent(NATIVE_REDIRECT)}&app_challenge=${challenge}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, NATIVE_REDIRECT, {
    showInRecents: false,
    preferEphemeralSession: true,
  });

  if (result.type === 'cancel' || result.type === 'dismiss') throw new OAuthCancelled();
  if (result.type !== 'success' || !result.url) {
    throw new Error('Sign-in did not complete. Please try again.');
  }

  // Tokens come back in either the URL fragment or the query.
  const { url } = result;
  const afterHash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const afterQuery = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const params = new URLSearchParams(afterHash || afterQuery);

  const refusal = params.get('error');
  if (refusal) throw new Error(refusal);

  // The redirect carries a one-time code; the tokens come back only to the holder of the secret.
  const code = params.get('code');
  if (code) {
    const result = await apiFetch<Record<string, string>>('/auth/oauth/native/exchange', {
      method: 'POST',
      anonymous: true,
      body: { code, verifier },
    });
    if (result.challenge_token)
      return { kind: 'challenge', challengeToken: result.challenge_token };
    if (!result.access_token || !result.refresh_token) {
      throw new Error('Sign-in response was incomplete. Please try again.');
    }
    return {
      kind: 'session',
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
    };
  }

  const challengeToken = params.get('challenge_token');
  if (challengeToken) return { kind: 'challenge', challengeToken };

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Sign-in response was incomplete. Please try again.');
  }
  return { kind: 'session', accessToken, refreshToken };
}
