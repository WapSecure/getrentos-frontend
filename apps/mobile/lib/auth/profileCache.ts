import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthProfile } from '../api/auth';

// Lets an offline cold start pick a portal, which comes from the roles. Not in secure storage: a profile is identity, not a credential.
const KEY = 'sureground.profile';

export async function readCachedProfile(): Promise<AuthProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthProfile) : null;
  } catch {
    // A corrupt cache must not break the bootstrap; `/auth/me` stays the authority.
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
