import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import type { TypographyVariant } from '@sureground/tokens';
import { useTheme, withFont } from '../theme';

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
  uppercase?: boolean;
  /** `accessibilityRole="header"` alone renders an <h1> on web, so state the level. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Text({
  variant = 'body',
  color = 'foreground',
  center,
  uppercase,
  headingLevel,
  style,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const t = theme.typography[variant];

  return (
    <RNText
      maxFontSizeMultiplier={2}
      accessibilityRole={headingLevel ? 'header' : rest.accessibilityRole}
      {...(headingLevel ? { 'aria-level': headingLevel } : {})}
      style={withFont(theme, [
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
      ])}
      {...rest}
    >
      {children}
    </RNText>
  );
}
