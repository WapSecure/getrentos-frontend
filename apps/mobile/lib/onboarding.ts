import { useCallback, useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sureground.onboardingSeen';

// One module-level value for every caller, so finishing the intro reaches the root router.
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

// `null` while reading; routing waits so a returning user never sees onboarding flash.
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

export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
  emit(false);
}

export function __resetOnboardingCacheForTests() {
  seen = null;
  loading = null;
}
