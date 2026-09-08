import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Secure key/value storage.
 *
 * Native: the OS secure enclave (iOS Keychain / Android Keystore).
 * Web (dev preview only): `localStorage` — NOT secure, and only used so the app
 * can be previewed in a browser. Production web is not a target.
 */
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const isWeb = Platform.OS === 'web';

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key, SECURE_OPTIONS);
  },
  async set(key: string, value: string): Promise<void> {
    if (isWeb) {
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
