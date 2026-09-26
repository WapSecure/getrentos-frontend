import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

/**
 * Sign in with Apple (iOS). Apple returns a signed identity token; the API
 * verifies it. A fresh nonce is generated per attempt: Apple embeds its
 * SHA-256 in the token and the API checks the raw value, so an intercepted
 * token can't be replayed.
 */

export class AppleSignInCancelled extends Error {}

export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

export async function requestAppleCredential(): Promise<{
  identityToken: string;
  nonce: string;
  fullName?: string;
}> {
  const nonce = Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join(
    ''
  );
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });
    if (!credential.identityToken) throw new Error('Apple did not return an identity token.');
    const fullName = credential.fullName
      ? AppleAuthentication.formatFullName(credential.fullName).trim() || undefined
      : undefined;
    return { identityToken: credential.identityToken, nonce, fullName };
  } catch (err) {
    if ((err as { code?: string }).code === 'ERR_REQUEST_CANCELED')
      throw new AppleSignInCancelled();
    throw err;
  }
}
