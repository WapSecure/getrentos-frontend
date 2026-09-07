import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import type { TypographyVariant } from '@getrentos/tokens';
import { useTheme } from '../theme';

type ColorToken =
  | 'foreground'
  | 'mutedForeground'
  | 'primary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'accentForeground'
  | 'primaryForeground';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  center?: boolean;
  /** Uppercases and applies label tracking — for eyebrows / section labels. */
  uppercase?: boolean;
}

/**
 * The only text component screens should use. Locks every string to the type
 * ramp and the theme palette; never hard-code font sizes or hex values.
 */
export function Text({
  variant = 'body',
  color = 'foreground',
  center,
  uppercase,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const t = theme.typography[variant];

  return (
    <RNText
      // Respect the user's Dynamic Type setting but keep layouts sane.
      maxFontSizeMultiplier={2}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight as TextStyle['fontWeight'],
          letterSpacing: uppercase ? 0.6 : t.letterSpacing,
          color: theme.colors[color],
          textAlign: center ? 'center' : undefined,
          textTransform: uppercase ? 'uppercase' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
