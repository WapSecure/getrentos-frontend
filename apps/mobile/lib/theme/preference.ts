import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '@getrentos/ui-native';

const KEY = 'getrentos.themePreference';
const VALID: ThemePreference[] = ['system', 'light', 'dark'];

/**
 * Loads the saved appearance preference once on startup and returns a setter
 * that persists future changes. `ready` gates the first render so the app never
 * flashes the wrong theme.
 */
export function useStoredThemePreference() {
  const [initial, setInitial] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (alive && v && (VALID as string[]).includes(v)) setInitial(v as ThemePreference);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: ThemePreference) => {
    AsyncStorage.setItem(KEY, next).catch(() => undefined);
  }, []);

  return { initial, ready, persist };
}
