import { Text as RNText, type TextStyle } from 'react-native';
import type { TypographyVariant } from '@sureground/tokens';
import { useTheme, withFont } from '../theme';

type PricePeriod = 'month' | 'year' | 'night' | 'total' | null;

const PERIOD_LABEL: Record<Exclude<PricePeriod, null>, string> = {
  month: '/mo',
  year: '/yr',
  night: '/night',
  total: '',
};

export interface PriceProps {
  /** Major-unit naira. Optional: the API omits it when a unit has no asking rent yet. */
  amount?: number | null;
  period?: PricePeriod;
  compact?: boolean;
  variant?: TypographyVariant;
  color?: 'foreground' | 'primary' | 'success' | 'destructive';
  /** For use over photos, where `mutedForeground` has no contrast. */
  periodColor?: string;
  style?: TextStyle;
}

// Without this guard an unset figure rendered as "₦NaN".
const isAmount = (amount: number | null | undefined): amount is number =>
  typeof amount === 'number' && Number.isFinite(amount);

function formatFigure(amount: number, compact: boolean): string {
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `₦${trimZero((amount / 1_000_000).toFixed(1))}M`;
    if (abs >= 1_000) return `₦${Math.round(amount / 1_000)}K`;
  }
  return `₦${Math.round(amount).toLocaleString('en-NG')}`;
}

const trimZero = (s: string) => (s.endsWith('.0') ? s.slice(0, -2) : s);

export function Price({
  amount,
  period = null,
  compact = false,
  variant = 'subheading',
  color = 'foreground',
  periodColor,
  style,
}: PriceProps) {
  const theme = useTheme();
  const t = theme.typography[variant];
  const hasAmount = isAmount(amount);
  const suffix = hasAmount && period ? PERIOD_LABEL[period] : '';

  return (
    <RNText
      maxFontSizeMultiplier={2}
      style={withFont(theme, [
        {
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          fontWeight: t.fontWeight as TextStyle['fontWeight'],
          letterSpacing: t.letterSpacing,
          color: theme.colors[color],
          fontVariant: ['tabular-nums'],
        },
        style,
      ])}
    >
      {hasAmount ? formatFigure(amount, compact) : '—'}
      {suffix ? (
        <RNText
          style={{
            fontSize: theme.typography.caption.fontSize,
            color: periodColor ?? theme.colors.mutedForeground,
            ...theme.font('500'),
          }}
        >
          {' '}
          {suffix}
        </RNText>
      ) : null}
    </RNText>
  );
}
