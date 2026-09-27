import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Portal } from './roles';

/**
 * The workspace someone chose to open, for accounts with more than one (an
 * owner who also rents property out, say). Per device, and cleared on sign-out
 * so the next person on the phone starts fresh.
 */
const KEY = 'getrentos.preferredPortal';

export async function readPreferredPortal(): Promise<Portal | null> {
  try {
    return ((await AsyncStorage.getItem(KEY)) as Portal | null) ?? null;
  } catch {
    return null;
  }
}

export async function writePreferredPortal(portal: Portal | null): Promise<void> {
  try {
    if (portal) await AsyncStorage.setItem(KEY, portal);
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // Best effort: the choice still applies for this session.
  }
}
