import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthProfile } from '../api/auth';

/**
 * The signed-in user's profile, kept on disk so a cold start with no network can
 * still work out which portal to open.
 *
 * A stored token is not enough on its own. The portal a person gets is derived
 * from their roles, so an app holding a session but no profile cannot place the
 * user anywhere and falls back to "no portal". That is precisely the guard whose
 * phone restarted at the barrier — locked out of the console they need, at the
 * moment the offline queue exists to help them.
 *
 * Deliberately not in secure storage: a profile is identity, not a credential,
 * and this only ever mirrors what `/auth/me` already returned to this device.
 */
const KEY = 'getrentos.profile';

export async function readCachedProfile(): Promise<AuthProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthProfile) : null;
  } catch {
    // A corrupt cache must not break the bootstrap; `/auth/me` is still the
    // authority on the next online start.
    return null;
  }
}

export async function writeCachedProfile(profile: AuthProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Losing the cache only costs an offline start; never fail a sign-in for it.
  }
}

export async function clearCachedProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Best effort. A stale profile is replaced on the next successful fetch.
  }
}
