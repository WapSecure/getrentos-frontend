import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  getPalette,
  radius,
  shadows,
  spacing,
  typography,
  type ColorScheme,
  type Palette,
} from '@getrentos/tokens';

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
}

export type ThemePreference = ColorScheme | 'system';

interface ThemeContextValue extends Theme {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildTheme(scheme: ColorScheme): Theme {
  return { scheme, colors: getPalette(scheme), spacing, radius, typography, shadows };
}

/**
 * App-wide theme. Follows the OS appearance by default; `setPreference` lets a
 * settings screen pin light or dark. Persisting the choice is the app's job —
 * pass `initialPreference` after reading it back from storage.
 */
export function ThemeProvider({
  children,
  initialPreference = 'system',
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
}) {
  const detectedScheme = useColorScheme();
  const system: ColorScheme = detectedScheme === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const scheme: ColorScheme = preference === 'system' ? system : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(scheme), preference, setPreference }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}

/**
 * Build a StyleSheet from the current theme. Keeps screens declarative:
 *   const styles = useThemedStyles((t) => ({ box: { backgroundColor: t.colors.card } }));
 */
export function useThemedStyles<T extends Record<string, object>>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
