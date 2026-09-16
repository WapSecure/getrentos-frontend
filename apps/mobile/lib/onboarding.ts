import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'getrentos.onboardingSeen';

/**
 * Whether the intro flow has been completed on this device.
 * `null` while the stored value is still being read — routing waits on that so
 * a returning user never sees onboarding flash before the welcome screen.
 */
export function useOnboardingSeen() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (alive) setSeen(v === '1');
      })
      .catch(() => {
        if (alive) setSeen(true); // never trap someone behind a storage failure
      });
    return () => {
      alive = false;
    };
  }, []);

  const markSeen = useCallback(() => {
    setSeen(true);
    AsyncStorage.setItem(KEY, '1').catch(() => undefined);
  }, []);

  return { seen, markSeen };
}

/** Clears the flag so the intro plays again. Used by the dev-only replay shortcut. */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
