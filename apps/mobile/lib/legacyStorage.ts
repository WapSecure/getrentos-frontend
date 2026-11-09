import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GetRentos became Sureground: move each "getrentos" AsyncStorage key to its "sureground" key once, before
// anything reads them, so queued work survives. A value under the new key wins. Secure-store keys can't be
// listed, so lib/storage moves those on first read.
export const LEGACY_PREFIX = 'getrentos';
export const NEW_PREFIX = 'sureground';

async function migrate(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(LEGACY_PREFIX));
    if (keys.length === 0) return;
    const entries = await AsyncStorage.multiGet(keys);
    const renamed = entries.map(
      ([k, v]) => [NEW_PREFIX + k.slice(LEGACY_PREFIX.length), v] as const
    );
    const existing = new Map(await AsyncStorage.multiGet(renamed.map(([k]) => k)));
    const toWrite = renamed.filter(([k, v]) => v !== null && existing.get(k) == null) as [
      string,
      string,
    ][];
    if (toWrite.length) await AsyncStorage.multiSet(toWrite);
    await AsyncStorage.multiRemove(keys);
  } catch {
    // Storage unavailable: start fresh rather than hold the app.
  }
}

let done = false;
const listeners = new Set<() => void>();
const migration = migrate().finally(() => {
  done = true;
  listeners.forEach((l) => l());
});

// The root layout waits on this.
export function useLegacyStorageMigrated(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => done,
    () => done
  );
}

export const legacyStorageMigration = migration;
