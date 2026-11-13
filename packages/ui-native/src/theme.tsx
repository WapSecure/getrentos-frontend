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

export type FontWeight = '400' | '500' | '600' | '700' | '800';

/** One static face per weight; empty means the platform UI face. */
export type FontFamilies = Partial<Record<FontWeight, string>>;

export interface Theme {
  scheme: ColorScheme;
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadows: typeof shadows;
  fonts: FontFamilies;
  /** The serif for page titles and display text; absent until it loads, then the UI face is used. */
  displayFont?: string;
  /** With a loaded static face the weight resets to normal, or platforms embolden it a second time. */
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

export function withFont(
  theme: Pick<Theme, 'font'>,
  style: StyleProp<TextStyle>
): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) ?? {};
  if (flat.fontFamily) return style;
  return [style, theme.font(flat.fontWeight)];
}

/**
 * A token colour at a given opacity, for soft tints such as the blue pill behind an active tab.
 * Takes `#rgb` or `#rrggbb`; any other form is returned unchanged rather than guessed at.
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().replace(/^#/, '');
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return color;
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const n = parseInt(full, 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function buildTheme(scheme: ColorScheme, fonts: FontFamilies, displayFont?: string): Theme {
  return {
    scheme,
    colors: getPalette(scheme),
    spacing,
    radius,
    typography,
    shadows,
    fonts,
    displayFont,
    font: (weight) => {
      const fontFamily = resolveFontFamily(fonts, weight);
      return fontFamily ? { fontFamily, fontWeight: 'normal' } : { fontWeight: weight };
    },
  };
}

// Persisting the preference is the app's job: pass initialPreference after reading it back.
export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
  fonts,
  displayFont,
}: {
  children: ReactNode;
  initialPreference?: ThemePreference;
  onPreferenceChange?: (preference: ThemePreference) => void;
  fonts?: FontFamilies;
  displayFont?: string;
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
    () => ({ ...buildTheme(scheme, fonts ?? NO_FONTS, displayFont), preference, setPreference }),
    [scheme, fonts, displayFont, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}

export function useThemedStyles<T extends Record<string, object>>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
