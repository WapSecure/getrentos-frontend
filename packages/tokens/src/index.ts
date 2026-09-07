/**
 * GetRentos design tokens — the single source of truth for colour, spacing,
 * radius, typography and elevation across web (Tailwind) and native (RN).
 *
 * The web app currently declares the same values as CSS custom properties in
 * `packages/ui/src/styles/index.css`; those should be generated from this file
 * so the brand can never drift between platforms.
 */

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
  ring: string;
  /** Opaque overlay for modals / sheets. */
  scrim: string;
}

export const lightColors: Palette = {
  background: '#f6f7f9',
  foreground: '#161b22',
  card: '#ffffff',
  cardForeground: '#161b22',
  border: '#e5e8ee',
  secondary: '#eef0f4',
  secondaryForeground: '#161b22',
  muted: '#f3f4f7',
  mutedForeground: '#667085',
  accent: '#eaf2ff',
  accentForeground: '#0b63ce',
  primary: '#0071e3',
  primaryHover: '#0a84ff',
  primaryForeground: '#ffffff',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  info: '#0071e3',
  success: '#16a34a',
  warning: '#c2650b',
  purple: '#7c5cd6',
  infoSubtle: '#eaf2ff',
  successSubtle: '#e7f7ef',
  warningSubtle: '#fdf1e3',
  purpleSubtle: '#f3eefb',
  ring: 'rgba(0, 113, 227, 0.28)',
  scrim: 'rgba(22, 27, 34, 0.45)',
};

export const darkColors: Palette = {
  background: '#0a0c11',
  foreground: '#ececf0',
  card: '#14171e',
  cardForeground: '#ececf0',
  border: '#252a33',
  secondary: '#1d2129',
  secondaryForeground: '#ececf0',
  muted: '#151920',
  mutedForeground: '#98a1b0',
  accent: '#0d2b52',
  accentForeground: '#83b4f7',
  primary: '#2f8cff',
  primaryHover: '#54a1ff',
  primaryForeground: '#ffffff',
  destructive: '#f05656',
  destructiveForeground: '#ffffff',
  info: '#2f8cff',
  success: '#38c57a',
  warning: '#ffb454',
  purple: '#a78bfa',
  infoSubtle: '#0d2b52',
  successSubtle: '#0e2b1c',
  warningSubtle: '#2e1f0a',
  purpleSubtle: '#251a3f',
  ring: 'rgba(47, 140, 255, 0.4)',
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

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;

/**
 * Type ramp. `-apple-system` on the web resolves to San Francisco; on native
 * we let the platform pick its own UI face (SF on iOS, Roboto on Android) by
 * leaving `fontFamily` undefined and only setting weight.
 */
export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontSize: 17, lineHeight: 24, fontWeight: '600', letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: -0.1 },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600', letterSpacing: -0.1 },
  callout: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6 },
} as const;

export type TypographyVariant = keyof typeof typography;

/**
 * Elevation. Shaped for React Native's `style` object; the web keeps its own
 * multi-layer box-shadows. `elevation` drives Android, `shadow*` drives iOS.
 */
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

export const tokens = { colors, spacing, radius, typography, shadows, duration };
export default tokens;
