import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEY = 'getrentos.installId';

/**
 * A random id this install keeps for itself, sent with sign-ups so the API can
 * notice many new accounts coming from one device. It identifies the install,
 * not the person. Undefined if storage fails — signing up never depends on it.
 */
export async function getInstallId(): Promise<string | undefined> {
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = Crypto.randomUUID();
    await AsyncStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return undefined;
  }
}
