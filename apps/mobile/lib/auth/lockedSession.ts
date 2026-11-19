import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import { secureStorage } from '../storage';
import { clearTokens, writeTokens } from './tokenStore';

// Only the key is behind biometrics. The token is sealed with it in a plain entry, so a rotation
// re-seals with the in-memory key and never prompts.
const LOCK_KEY = 'sureground.lockKey';
export const SEALED_REFRESH_KEY = 'sureground.sealedRefreshToken';
// The first locked format kept the token itself behind biometrics; still read once, to migrate it.
export const PER_TOKEN_MARKER_KEY = 'sureground.lockedSession';
const PER_TOKEN_REFRESH_KEY = 'sureground.lockedRefreshToken';

export const UNLOCK_PROMPT = 'Unlock Sureground';
const SAVE_PROMPT = 'Confirm it’s you to lock Sureground';

// An auth-bound entry needs its own key alias/service: one shared with plain entries never gets a fresh auth key.
function lockedOptions(prompt: string): SecureStore.SecureStoreOptions {
  return {
    keychainService: 'sureground.locked',
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
    authenticationPrompt: prompt,
  };
}

let unlockedKey: AESEncryptionKey | null = null;

export function forgetLockKey() {
  unlockedKey = null;
}

export function canLockWithBiometrics(): boolean {
  if (Platform.OS === 'web') return false;
  try {
    return SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

export type LockedRead =
  | { status: 'ok'; refreshToken: string }
  /** No entry, or the OS invalidated the key because the phone's biometrics changed: sign in again. */
  | { status: 'gone' }
  | { status: 'cancelled' }
  | { status: 'failed' };

export function lockFailure(err: unknown): 'cancelled' | 'failed' {
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message) ? 'cancelled' : 'failed';
}

export type LockedFormat = 'sealed' | 'perToken' | null;

/** Which locked session is saved, read without a prompt. */
export async function lockedSessionFormat(): Promise<LockedFormat> {
  if (await secureStorage.get(SEALED_REFRESH_KEY).catch(() => null)) return 'sealed';
  if ((await secureStorage.get(PER_TOKEN_MARKER_KEY).catch(() => null)) === '1') return 'perToken';
  return null;
}

async function seal(refreshToken: string, key: AESEncryptionKey): Promise<void> {
  // Tokens are ASCII, and the AES API takes string input as base64.
  const sealed = await aesEncryptAsync(btoa(refreshToken), key);
  await secureStorage.set(SEALED_REFRESH_KEY, await sealed.combined('base64'));
}

async function unseal(key: AESEncryptionKey): Promise<string | null> {
  const combined = await secureStorage.get(SEALED_REFRESH_KEY);
  if (!combined) return null;
  try {
    const plain = await aesDecryptAsync(AESSealedData.fromCombined(combined), key, {
      output: 'base64',
    });
    return atob(plain);
  } catch {
    return null;
  }
}

async function removePerTokenFormat(): Promise<void> {
  await secureStorage.remove(PER_TOKEN_MARKER_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(PER_TOKEN_REFRESH_KEY, lockedOptions(SAVE_PROMPT)).catch(
    () => undefined
  );
}

/**
 * Makes a new biometric-bound key and seals the token with it. Android prompts on the key write;
 * iOS doesn't prompt when creating an entry, so `prove` reads the key back there. Throws when the prompt fails.
 */
export async function lockSession(
  refreshToken: string,
  { prove = false }: { prove?: boolean } = {}
): Promise<void> {
  const key = await AESEncryptionKey.generate(AESKeySize.AES256);
  const encoded = await key.encoded('base64');
  if (Platform.OS === 'ios') {
    await SecureStore.deleteItemAsync(LOCK_KEY, lockedOptions(SAVE_PROMPT)).catch(() => undefined);
  }
  await SecureStore.setItemAsync(LOCK_KEY, encoded, lockedOptions(SAVE_PROMPT));
  if (prove && Platform.OS === 'ios') {
    const read = await SecureStore.getItemAsync(LOCK_KEY, lockedOptions(UNLOCK_PROMPT));
    if (read !== encoded) throw new Error('The lock key could not be read back');
  }
  unlockedKey = key;
  await seal(refreshToken, key);
  await removePerTokenFormat();
  await clearTokens();
}

/** One OS prompt. Keeps the key in memory until the app locks again. */
export async function unlockLockedSession(): Promise<LockedRead> {
  const format = await lockedSessionFormat();
  if (format === 'sealed') {
    let encoded: string | null;
    try {
      encoded = await SecureStore.getItemAsync(LOCK_KEY, lockedOptions(UNLOCK_PROMPT));
    } catch (err) {
      return { status: lockFailure(err) };
    }
    if (!encoded) return { status: 'gone' };
    const key = await AESEncryptionKey.import(encoded, 'base64').catch(() => null);
    const refreshToken = key ? await unseal(key) : null;
    if (!key || !refreshToken) return { status: 'gone' };
    unlockedKey = key;
    return { status: 'ok', refreshToken };
  }
  if (format === 'perToken') {
    let refreshToken: string | null;
    try {
      refreshToken = await SecureStore.getItemAsync(
        PER_TOKEN_REFRESH_KEY,
        lockedOptions(UNLOCK_PROMPT)
      );
    } catch (err) {
      return { status: lockFailure(err) };
    }
    if (!refreshToken) return { status: 'gone' };
    // If the move fails the old format stays, and the next unlock tries again.
    await lockSession(refreshToken).catch(() => undefined);
    return { status: 'ok', refreshToken };
  }
  return { status: 'gone' };
}

/** A rotated token, sealed with the in-memory key: no prompt. False when the app is locked. */
export async function resealRefreshToken(refreshToken: string): Promise<boolean> {
  const key = unlockedKey;
  if (!key) return false;
  try {
    await seal(refreshToken, key);
    return true;
  } catch {
    return false;
  }
}

/** Drops the sealed token only, so a stale copy can't be replayed; the key stays for the next unlock. */
export async function clearSealedToken(): Promise<void> {
  await secureStorage.remove(SEALED_REFRESH_KEY).catch(() => undefined);
}

export async function clearLockedSession(): Promise<void> {
  forgetLockKey();
  await clearSealedToken();
  await SecureStore.deleteItemAsync(LOCK_KEY, lockedOptions(SAVE_PROMPT)).catch(() => undefined);
  await removePerTokenFormat();
}

/** Turning the lock off: the session goes back to plain secure storage. */
export async function storeUnlockedSession(tokens: {
  accessToken: string | null;
  refreshToken: string;
}): Promise<void> {
  await writeTokens(tokens);
  await clearLockedSession();
}
