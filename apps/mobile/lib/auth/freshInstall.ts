import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGACY_PREFIX, NEW_PREFIX } from '../legacyStorage';
import { secureStorage } from '../storage';

const INSTALLED_KEY = 'sureground.installed';
const PROFILE_CACHE_KEY = 'sureground.profile';

// iOS keeps Keychain items after an uninstall while AsyncStorage is wiped, so a reinstall would
// resume the old session. A cached profile marks an install that predates the marker: keep it signed in.
export async function clearSecureLeftoversOnFreshInstall(secureKeys: string[]): Promise<void> {
  try {
    const [[, installed], [, cachedProfile]] = await AsyncStorage.multiGet([
      INSTALLED_KEY,
      PROFILE_CACHE_KEY,
    ]);
    if (installed || cachedProfile) {
      if (!installed) await AsyncStorage.setItem(INSTALLED_KEY, '1');
      return;
    }
    // A pre-rename key would be moved back under the new name on its first read.
    const keys = secureKeys.flatMap((key) =>
      key.startsWith(NEW_PREFIX) ? [key, LEGACY_PREFIX + key.slice(NEW_PREFIX.length)] : [key]
    );
    await Promise.all(keys.map((key) => secureStorage.remove(key).catch(() => undefined)));
    await AsyncStorage.setItem(INSTALLED_KEY, '1');
  } catch {
    // Storage unavailable: skip the check rather than block sign-in.
  }
}
