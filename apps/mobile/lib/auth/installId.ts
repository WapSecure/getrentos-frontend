import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEY = 'sureground.installId';

// Lets the API notice many sign-ups from one device; it identifies the install, not the person. Undefined if storage fails: sign-up never depends on it.
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
