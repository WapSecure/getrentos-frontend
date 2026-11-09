import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, type StyleProp, type TextStyle } from 'react-native';
import {
  getPalette,
  radius,
  shadows,
  spacing,
  typography,
  type ColorScheme,
  type Palette,
} from '@sureground/tokens';

/** The weights the type ramp and screens ask for. */
export type FontWeight = '400' | '500' | '600' | '700' | '800';

/**
 * The font family the app has loaded for each weight: static faces, one file
 * per weight (e.g. `{ '600': 'Manrope_600SemiBold' }`). Empty means the
 * platform's own UI face, with weight applied the usual way.
 */
export type FontFamilies = Partial<Record<FontWeight, string>>;

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  fonts: FontFamilies;
  /**
   * The family and weight to render text of this weight in. With a loaded
   * static face the weight is reset to normal: the face already carries it,
   * and iOS, Android and the browser would otherwise embolden it a second time.
   */
  font: (weight: TextStyle['fontWeight']) => Pick<TextStyle, 'fontFamily' | 'fontWeight'>;
}

export type ThemePreference = ColorScheme | 'system';

interface ThemeContextValue extends Theme {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const NO_FONTS: FontFamilies = {};

const WEIGHTS: FontWeight[] = ['400', '500', '600', '700', '800'];

function normalizeWeight(weight: TextStyle['fontWeight']): FontWeight {
  const named: Record<string, FontWeight> = {
    normal: '400',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '800',
  };
  const n = typeof weight === 'number' ? weight : Number(weight);
  if (Number.isFinite(n) && n > 0) {
    if (n <= 400) return '400';
    return (WEIGHTS.find((w) => Number(w) >= n) ?? '800') as FontWeight;
  }
  return (weight && named[String(weight).toLowerCase()]) || '400';
}

/** The loaded family for this weight: the exact one, else the nearest below, else the nearest above. */
export function resolveFontFamily(
  fonts: FontFamilies,
  weight: TextStyle['fontWeight']
): string | undefined {
  const want = normalizeWeight(weight);
  if (fonts[want]) return fonts[want];
  const i = WEIGHTS.indexOf(want);
  const below = WEIGHTS.slice(0, i)
    .reverse()
    .find((w) => fonts[w]);
  const above = WEIGHTS.slice(i + 1).find((w) => fonts[w]);
  return (below && fonts[below]) || (above && fonts[above]) || undefined;
}

/**
 * Appends the theme's font to a text style so whatever weight the caller set
 * (in the ramp or an inline `fontWeight`) renders in the loaded face.
 */
export function withFont(
  theme: Pick<Theme, 'font'>,
  style: StyleProp<TextStyle>
): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  return [style, theme.font(flat.fontWeight)];
}

function buildTheme(scheme: ColorScheme, fonts: FontFamilies): Theme {
  return {
    scheme,
    colors: getPalette(scheme),
    spacing,
    radius,
    typography,
    shadows,
    fonts,
    font: (weight) => {
      const fontFamily = resolveFontFamily(fonts, weight);
      return fontFamily ? { fontFamily, fontWeight: 'normal' } : { fontWeight: weight };
    },
  };
}

/**
 * App-wide theme. Follows the OS appearance by default; `setPreference` lets a
 * settings screen pin light or dark. Persisting the choice is the app's job —
 * pass `initialPreference` after reading it back from storage.
 */
export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
  fonts,
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
  /** Fired whenever the preference changes — use it to persist the choice. */
  onPreferenceChange?: (preference: ThemePreference) => void;
  /** The brand typeface, by weight, once the app has loaded it; omit for the platform face. */
  fonts?: FontFamilies;
}) {
  const rawScheme = useColorScheme();
  const system: ColorScheme = rawScheme === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const scheme: ColorScheme = preference === 'system' ? system : preference;

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ ...buildTheme(scheme, fonts ?? NO_FONTS), preference, setPreference }),
    [scheme, fonts, preference, setPreference]
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
