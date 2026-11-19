import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '../storage';
import { clearTokens, writeTokens } from './tokenStore';

const LOCKED_REFRESH_KEY = 'sureground.lockedRefreshToken';
// Plain marker, so launch can tell a locked session exists without triggering the biometric prompt.
export const LOCKED_SESSION_KEY = 'sureground.lockedSession';

export const UNLOCK_PROMPT = 'Unlock Sureground';
const SAVE_PROMPT = 'Confirm it’s you to keep Sureground locked';

// An auth-bound entry needs its own key alias/service: one shared with plain entries never gets a fresh auth key.
function lockedOptions(prompt: string): SecureStore.SecureStoreOptions {
  return {
    keychainService: 'sureground.locked',
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
    authenticationPrompt: prompt,
  };
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
  /** No entry, or the OS invalidated it because the phone's biometrics changed: the session must sign in again. */
  | { status: 'gone' }
  | { status: 'cancelled' }
  | { status: 'failed' };

function isCancellation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /cancel/i.test(message);
}

export function lockFailure(err: unknown): 'cancelled' | 'failed' {
  return isCancellation(err) ? 'cancelled' : 'failed';
}

export async function hasLockedSession(): Promise<boolean> {
  return (await secureStorage.get(LOCKED_SESSION_KEY).catch(() => null)) === '1';
}

/** Shows the OS biometric prompt. */
export async function readLockedRefreshToken(): Promise<LockedRead> {
  try {
    const token = await SecureStore.getItemAsync(LOCKED_REFRESH_KEY, lockedOptions(UNLOCK_PROMPT));
    return token ? { status: 'ok', refreshToken: token } : { status: 'gone' };
  } catch (err) {
    return { status: lockFailure(err) };
  }
}

/**
 * Saves the refresh token behind biometrics and drops the plain copies. Android prompts on every write;
 * iOS prompts only on update, so the entry is recreated there. `prove` reads it back on iOS, so turning the
 * lock on always asks for the biometric once. Throws when the prompt fails; the marker is then left unset.
 */
export async function storeLockedSession(
  refreshToken: string,
  { prove = false }: { prove?: boolean } = {}
): Promise<void> {
  await secureStorage.remove(LOCKED_SESSION_KEY).catch(() => undefined);
  if (Platform.OS === 'ios') {
    await SecureStore.deleteItemAsync(LOCKED_REFRESH_KEY, lockedOptions(SAVE_PROMPT)).catch(
      () => undefined
    );
  }
  await SecureStore.setItemAsync(LOCKED_REFRESH_KEY, refreshToken, lockedOptions(SAVE_PROMPT));
  if (prove && Platform.OS === 'ios') {
    const read = await SecureStore.getItemAsync(LOCKED_REFRESH_KEY, lockedOptions(UNLOCK_PROMPT));
    if (read !== refreshToken) throw new Error('The saved session could not be read back');
  }
  await secureStorage.set(LOCKED_SESSION_KEY, '1');
  await clearTokens();
}

export async function clearLockedSession(): Promise<void> {
  await secureStorage.remove(LOCKED_SESSION_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(LOCKED_REFRESH_KEY, lockedOptions(SAVE_PROMPT)).catch(
    () => undefined
  );
}

/** Turning the lock off: the session goes back to plain secure storage. */
export async function storeUnlockedSession(tokens: {
  accessToken: string | null;
  refreshToken: string;
}): Promise<void> {
  await writeTokens(tokens);
  await clearLockedSession();
}
