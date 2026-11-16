import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { env } from '../env';
import { apiFetch } from '../api/client';
import { oauthErrorCopy } from './signupErrors';

WebBrowser.maybeCompleteAuthSession();

// Allowlisted on the backend: must match exactly.
const NATIVE_REDIRECT = 'sureground://oauth';

export type OAuthResult =
  | { kind: 'session'; accessToken: string; refreshToken: string; isNewUser?: boolean }
  /** The account has an authenticator app: finish with its code, like a password sign-in. */
  | { kind: 'challenge'; challengeToken: string };

export class OAuthCancelled extends Error {
  constructor() {
    super('Sign-in was cancelled');
    this.name = 'OAuthCancelled';
  }
}

// The flag may come as a JSON boolean, a string, or `new_user=1` on the redirect.
const truthy = (v: unknown) => v === true || v === 'true' || v === '1' || v === 1;

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
  if (refusal === 'OAUTH_CANCELLED') throw new OAuthCancelled();
  if (refusal) throw new Error(oauthErrorCopy(refusal));
  const flaggedNew = truthy(params.get('new_user')) || truthy(params.get('isNewUser'));

  // The redirect carries a one-time code; the tokens come back only to the holder of the secret.
  const code = params.get('code');
  if (code) {
    const result = await apiFetch<Record<string, string | boolean>>('/auth/oauth/native/exchange', {
      method: 'POST',
      anonymous: true,
      body: { code, verifier },
    });
    if (typeof result.challenge_token === 'string' && result.challenge_token)
      return { kind: 'challenge', challengeToken: result.challenge_token };
    const { access_token: accessToken, refresh_token: refreshToken } = result;
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      throw new Error('Sign-in response was incomplete. Please try again.');
    }
    const isNewUser =
      flaggedNew ||
      truthy(result.isNewUser) ||
      truthy(result.is_new_user) ||
      truthy(result.new_user);
    return isNewUser
      ? { kind: 'session', accessToken, refreshToken, isNewUser }
      : { kind: 'session', accessToken, refreshToken };
  }

  const challengeToken = params.get('challenge_token');
  if (challengeToken) return { kind: 'challenge', challengeToken };

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Sign-in response was incomplete. Please try again.');
  }
  return flaggedNew
    ? { kind: 'session', accessToken, refreshToken, isNewUser: true }
    : { kind: 'session', accessToken, refreshToken };
}
