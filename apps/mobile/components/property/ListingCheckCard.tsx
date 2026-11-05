import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react-native';
import { Card, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { listingCheckApi, type ListingCheckLevel } from '@/lib/api/listingCheck';

const ICON = {
  looks_good: ShieldCheck,
  check_carefully: ShieldQuestion,
  be_cautious: ShieldAlert,
} as const;

/** "Should I rent this?" on the phone. Shows nothing if the check is unavailable. */
export function ListingCheckCard({ listingId }: { listingId: string }) {
  const { colors, spacing, radius } = useTheme();
  const query = useQuery({
    queryKey: qk.renter.listingCheck(listingId),
    queryFn: () => listingCheckApi.check(listingId),
    staleTime: 10 * 60_000,
  });

  if (query.isLoading) return <Skeleton height={140} radius={radius.md} />;
  const d = query.data;
  if (!d) return null;

  const tone: Record<ListingCheckLevel, string> = {
    looks_good: colors.success,
    check_carefully: colors.warning,
    be_cautious: colors.destructive,
  };
  const Icon = ICON[d.level];
  const p = d.facts.price;

  return (
    <Card padding={spacing.lg} accessibilityLabel={`Should I rent this? ${d.headline}`}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon size={18} color={tone[d.level]} />
          <Text variant="bodyStrong" headingLevel={2}>
            Should I rent this?
          </Text>
        </View>
        <Text variant="callout" style={{ color: tone[d.level], fontWeight: '600' }}>
          {d.headline}
        </Text>
        <Text variant="callout">{d.summary}</Text>
        <Text variant="caption" color="mutedForeground">
          {p.amount} {p.period}
          {p.median ? ` · similar homes typically ${p.median}` : ''} ·{' '}
          {d.facts.landlord.verified
            ? `landlord verified, trust ${d.facts.landlord.trustScore}`
            : 'landlord not verified yet'}
        </Text>
        {d.facts.warnings.length ? (
          <View style={{ gap: 2 }}>
            <Text variant="label">Worth asking about</Text>
            {d.facts.warnings.map((w) => (
              <Text key={w} variant="caption" color="mutedForeground">
                • {w}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={{ gap: 2 }}>
          <Text variant="label">Before you pay</Text>
          {d.checklist.map((item, i) => (
            <Text key={item} variant="caption">
              {i + 1}. {item}
            </Text>
          ))}
        </View>
        <Text variant="caption" color="mutedForeground">
          Figures from GetRentos listings{d.source === 'ai' ? '; wording is automated' : ''}. A
          guide, not a guarantee.
        </Text>
      </View>
    </Card>
  );
}
