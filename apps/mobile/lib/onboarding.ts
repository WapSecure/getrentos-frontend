import { useCallback, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'getrentos.onboardingSeen';

/*
 * One module-level value shared by every caller. Each screen used to keep its
 * own copy, so finishing the intro never reached the root router — signing out
 * later in the same session replayed onboarding.
 */
let seen: boolean | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: boolean) {
  seen = next;
  listeners.forEach((l) => l());
}

function load() {
  loading ??= AsyncStorage.getItem(KEY)
    .then((v) => {
      if (seen === null) emit(v === '1');
    })
    .catch(() => {
      if (seen === null) emit(true); // never trap someone behind a storage failure
    });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => seen;

/**
 * Whether the intro flow has been completed on this device.
 * `null` while the stored value is still being read — routing waits on that so
 * a returning user never sees onboarding flash before the welcome screen.
 */
export function useOnboardingSeen() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    load();
  }, []);

  const markSeen = useCallback(() => {
    emit(true);
    AsyncStorage.setItem(KEY, '1').catch(() => undefined);
  }, []);

  return { seen: value, markSeen };
}

/** Clears the flag so the intro plays again. Used by the dev-only replay shortcut. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  emit(false);
}

/** Test hook: forget the cached value so the next read goes back to storage. */
export function __resetOnboardingCacheForTests() {
  seen = null;
  loading = null;
}
