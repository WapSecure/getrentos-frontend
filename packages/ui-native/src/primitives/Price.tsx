import { Text as RNText, type TextStyle } from 'react-native';
import type { TypographyVariant } from '@getrentos/tokens';
import { useTheme } from '../theme';

type PricePeriod = 'month' | 'year' | 'night' | 'total' | null;

const PERIOD_LABEL: Record<Exclude<PricePeriod, null>, string> = {
  month: '/mo',
  year: '/yr',
  night: '/night',
  total: '',
};

export interface PriceProps {
  /** Major-unit Naira. (Backend money is major-unit today — see mobile lib/format.) */
  amount: number;
  /** Rate suffix, rendered muted after the figure. `total` / null = no suffix. */
  period?: PricePeriod;
  /** ₦2.4M / ₦950K instead of the full grouped figure. */
  compact?: boolean;
  /** Type-ramp size for the figure. Default `subheading`. */
  variant?: TypographyVariant;
  /** Figure colour. Default `foreground`. */
  color?: 'foreground' | 'primary' | 'success' | 'destructive';
  style?: TextStyle;
}

function formatFigure(amount: number, compact: boolean): string {
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `₦${trimZero((amount / 1_000_000).toFixed(1))}M`;
    if (abs >= 1_000) return `₦${Math.round(amount / 1_000)}K`;
  }
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

const trimZero = (s: string) => (s.endsWith('.0') ? s.slice(0, -2) : s);

/**
 * The single money renderer. Locks every price to ₦, grouped digits and
 * tabular figures (so lists don't jitter as amounts change), with the rate
 * period in muted text.
 */
export function Price({
  amount,
  period = null,
  compact = false,
  variant = 'subheading',
  color = 'foreground',
  style,
}: PriceProps) {
  const theme = useTheme();
  const t = theme.typography[variant];
  const suffix = period ? PERIOD_LABEL[period] : '';

  return (
    <RNText
      maxFontSizeMultiplier={2}
      style={[
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight as TextStyle['fontWeight'],
          letterSpacing: t.letterSpacing,
          color: theme.colors[color],
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
    >
      {formatFigure(amount, compact)}
      {suffix ? (
        <RNText
          style={{
            fontSize: theme.typography.caption.fontSize,
            fontWeight: '500',
            color: theme.colors.mutedForeground,
          }}
        >
          {' '}
          {suffix}
        </RNText>
      ) : null}
    </RNText>
  );
}
