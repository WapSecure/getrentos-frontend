import { useState } from 'react';
import { View } from 'react-native';
import { Info } from '@sureground/icons/native';
import { indicativeAmount, indicativeRateLabel } from '@sureground/shared';
import { IconButton, Text, useTheme } from '@sureground/ui-native';
import { useIndicativeRates } from '@/hooks/useIndicativeRates';

/** Display only: naira stays the price and payment currency. Renders nothing when the rate is unavailable or stale. */
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
