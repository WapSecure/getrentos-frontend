import { useState } from 'react';
import { View } from 'react-native';
import { Info } from '@sureground/icons/native';
import { indicativeAmount, indicativeRateLabel } from '@sureground/shared';
import { IconButton, Text, useTheme } from '@sureground/ui-native';
import { useIndicativeRates } from '@/hooks/useIndicativeRates';

/**
 * "about £82,000" beside a naira price, as on web. Display only: naira stays the price and the
 * payment currency. Renders nothing when the rate is unavailable or over 24 hours old (the API
 * reports both as unavailable). `popover` keeps the source line behind an info button for tight
 * spaces such as figures; `inline` shows it under the amount.
 */
export function IndicativeAmount({
  naira,
  currency,
  labelDisplay = 'inline',
}: {
  /** Whole naira: a number, or a digit string for BIGINT amounts. */
  naira: number | string | bigint;
  /** GBP, USD, EUR or CAD; NGN or anything else renders nothing. */
  currency: string;
  labelDisplay?: 'inline' | 'popover';
}) {
  const { colors, spacing } = useTheme();
  const rates = useIndicativeRates();
  const [open, setOpen] = useState(false);
  if (!rates.available || !rates.source || !rates.asOf) return null;
  const figure = indicativeAmount(
    naira,
    rates.rates[currency as keyof typeof rates.rates],
    currency
  );
  const label = indicativeRateLabel(rates.source, rates.asOf);
  if (!figure || !label) return null;

  if (labelDisplay === 'popover') {
    return (
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text variant="caption" color="mutedForeground">
            {figure.text}
          </Text>
          <IconButton
            accessibilityLabel="About this figure"
            accessibilityState={{ expanded: open }}
            variant="ghost"
            onPress={() => setOpen((o) => !o)}
            icon={<Info size={14} color={colors.mutedForeground} />}
          />
        </View>
        {open ? (
          <Text variant="caption" color="mutedForeground">
            {label}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ gap: 2 }}>
      <Text variant="callout" color="mutedForeground">
        {figure.text}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
    </View>
  );
}
