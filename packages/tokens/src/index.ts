// Single source of truth for web and native: `pnpm tokens:sync` regenerates the web CSS and
// `pnpm tokens:check` verifies the palettes still agree.

export type ColorScheme = 'light' | 'dark';

export interface Palette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  border: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  primary: string;
  primaryHover: string;
  primaryForeground: string;
  destructive: string;
  destructiveForeground: string;
  info: string;
  success: string;
  warning: string;
  purple: string;
  infoSubtle: string;
  successSubtle: string;
  warningSubtle: string;
  purpleSubtle: string;
  destructiveSubtle: string;
  ring: string;
  scrim: string;
}

export const lightColors: Palette = {
  background: '#f8f7f5',
  foreground: '#20232b',
  card: '#ffffff',
  cardForeground: '#20232b',
  border: '#e4e1db',
  secondary: '#f1efea',
  secondaryForeground: '#20232b',
  muted: '#f3f1ec',
  mutedForeground: '#5c5e66',
  accent: '#efede8',
  accentForeground: '#20232b',
  primary: '#20232b',
  primaryHover: '#363a46',
  primaryForeground: '#ffffff',
  destructive: '#c81e1e',
  destructiveForeground: '#ffffff',
  info: '#0057d9',
  success: '#0b7a3e',
  warning: '#99500a',
  purple: '#6840c2',
  infoSubtle: '#eaf3ff',
  successSubtle: '#e7f5ec',
  warningSubtle: '#fbf0e2',
  purpleSubtle: '#f3eefb',
  destructiveSubtle: '#fdecec',
  ring: 'rgba(32, 35, 43, 0.55)',
  scrim: 'rgba(20, 21, 26, 0.45)',
};

export const darkColors: Palette = {
  background: '#111216',
  foreground: '#ecebe6',
  card: '#1a1b20',
  cardForeground: '#ecebe6',
  border: '#2d2e35',
  secondary: '#24252b',
  secondaryForeground: '#ecebe6',
  muted: '#1f2025',
  mutedForeground: '#a9aab0',
  accent: '#26272d',
  accentForeground: '#f1efe9',
  primary: '#f1efe9',
  primaryHover: '#ffffff',
  primaryForeground: '#15161a',
  destructive: '#f05656',
  destructiveForeground: '#111113',
  info: '#7aa9ff',
  success: '#38c57a',
  warning: '#ffb454',
  purple: '#a78bfa',
  infoSubtle: '#142b47',
  successSubtle: '#0e2b1c',
  warningSubtle: '#2e1f0a',
  purpleSubtle: '#251a3f',
  destructiveSubtle: '#3a1517',
  ring: 'rgba(241, 239, 233, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const colors: Record<ColorScheme, Palette> = {
  light: lightColors,
  dark: darkColors,
};

export const getPalette = (scheme: ColorScheme): Palette => colors[scheme];

/** 4-pt spacing scale. Use the semantic names, not raw numbers, in screens. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
  '6xl': 72,
} as const;

export type SpacingKey = keyof typeof spacing;

// Brik-sharp shapes: 2 for controls, 4 for cards and panels, 6 for dialogs and sheets.
export const radius = {
  none: 0,
  sm: 2,
  md: 2,
  lg: 4,
  xl: 4,
  '2xl': 6,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

/** Serif for places and page titles, sans for everything people operate. */
export const fontFamilies = {
  display: 'Newsreader',
  sans: 'Manrope',
} as const;

// On native the ramp sets weight only; the brand face reaches ui-native's ThemeProvider as `fonts`.
export const typography = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -0.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2 },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: -0.1 },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.1 },
  callout: { fontSize: 15, lineHeight: 22, fontWeight: '500', letterSpacing: 0 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.1 },
} as const;

export type TypographyVariant = keyof typeof typography;

// React Native style shape: `elevation` drives Android, `shadow*` iOS; the web keeps its own box-shadows.
export const shadows = {
  none: {},
  xs: {
    shadowColor: '#161b22',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sm: {
    shadowColor: '#161b22',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  md: {
    shadowColor: '#161b22',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  lg: {
    shadowColor: '#161b22',
    shadowOpacity: 0.16,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
} as const;

export type ShadowKey = keyof typeof shadows;

export const duration = { fast: 120, base: 200, slow: 320 } as const;

export const tokens = { colors, spacing, radius, typography, shadows, duration, fontFamilies };
export default tokens;
