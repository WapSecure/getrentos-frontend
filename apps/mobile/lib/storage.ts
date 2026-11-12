import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { LEGACY_PREFIX, NEW_PREFIX } from './legacyStorage';

// Web (dev preview only) falls back to localStorage, which is NOT secure, so only in development builds.
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const isWeb = Platform.OS === 'web';

// Outside a development build, the web fallback keeps values (sign-in tokens) in memory only: a
// page reload signs the user out, but nothing sensitive is left in clear text in localStorage.
const webPersists = isWeb && typeof __DEV__ !== 'undefined' && __DEV__;
const webMemory = new Map<string, string>();

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      if (!webPersists) return webMemory.get(key) ?? null;
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    const value = await SecureStore.getItemAsync(key, SECURE_OPTIONS);
    if (value !== null || !key.startsWith(NEW_PREFIX)) return value;
    // Saved before the GetRentos → Sureground rename: move it to the new key.
    const legacyKey = LEGACY_PREFIX + key.slice(NEW_PREFIX.length);
    const legacy = await SecureStore.getItemAsync(legacyKey, SECURE_OPTIONS);
    if (legacy !== null) {
      await SecureStore.setItemAsync(key, legacy, SECURE_OPTIONS);
      await SecureStore.deleteItemAsync(legacyKey, SECURE_OPTIONS);
    }
    return legacy;
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
      if (!webPersists) {
        webMemory.set(key, value);
        return;
      }
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* private mode / storage disabled */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  },
  async remove(key: string): Promise<void> {
    if (isWeb) {
      webMemory.delete(key);
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  },
};
