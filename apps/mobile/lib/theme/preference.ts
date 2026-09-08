import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, type ThemePreference } from '@getrentos/ui-native';

const KEY = 'getrentos.themePreference';
const VALID: ThemePreference[] = ['system', 'light', 'dark'];

/** Persist an appearance choice. Pass to `<ThemeProvider onPreferenceChange>`. */
export function persistThemePreference(next: ThemePreference) {
  AsyncStorage.setItem(KEY, next).catch(() => undefined);
}

/**
 * Render `<HydrateThemePreference />` anywhere inside `<ThemeProvider>`. On
 * mount it reads the saved choice and applies it if it differs from the
 * current one — no render gating, so there's no mount-timing warning.
 */
export function HydrateThemePreference() {
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (!alive || !v || !(VALID as string[]).includes(v)) return;
        if (v !== preference) setPreference(v as ThemePreference);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Run once on mount; we only want the stored value at startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
