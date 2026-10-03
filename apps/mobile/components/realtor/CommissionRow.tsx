import { View } from 'react-native';
import { Card, Price, Text, useTheme } from '@getrentos/ui-native';
import type { Commission } from '@/lib/api/realtor';
import { formatDate } from '@/lib/format';
import { StatusPill } from '@/components/host/HostUI';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

const COMMISSION_TONE = {
  available: { label: 'Available', tone: 'success' },
  paid: { label: 'Paid', tone: 'neutral' },
  void: { label: 'Voided', tone: 'danger' },
} as const;

export function CommissionRow({ c }: { c: Commission }) {
  const { spacing } = useTheme();
  const s = COMMISSION_TONE[c.status];
  return (
    <Card
      elevated
      accessible
      accessibilityLabel={`${c.propertyTitle}, ${c.side === 'listing' ? 'listing side' : 'buyer side'}, ${c.ratePct}% of ${naira(c.dealValue)}, ${naira(c.amount)}, ${s.label}${c.voidReason ? `. ${c.voidReason}` : ''}`}
      style={{ gap: spacing.xs }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {c.propertyTitle}
        </Text>
        <Price amount={c.amount} variant="bodyStrong" />
      </View>
      <Text variant="caption" color="mutedForeground">
        {c.side === 'listing' ? 'Listing side' : 'Buyer side'} · {c.ratePct}% of{' '}
        {naira(c.dealValue)} · {c.clientName}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <StatusPill label={s.label} tone={s.tone} />
        <Text variant="caption" color="mutedForeground">
          {c.status === 'paid' && c.paidAt
            ? `Paid ${formatDate(c.paidAt, 'medium')}`
            : `Earned ${formatDate(c.earnedAt, 'medium')}`}
        </Text>
      </View>
      {c.voidReason ? (
        <Text variant="caption" color="mutedForeground">
          {c.voidReason}
        </Text>
      ) : null}
    </Card>
  );
}
