import { useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Scale } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Skeleton,
  Text,
  useTheme,
  type BadgeTone,
} from '@sureground/ui-native';
import { errorMessage } from '@/lib/api/client';
import { rentDecisionApi, type ComparedHome } from '@/lib/api/rentDecision';

const CHECK: Record<ComparedHome['listingCheck'], { label: string; tone: BadgeTone }> = {
  looks_good: { label: 'Looks good', tone: 'success' },
  check_carefully: { label: 'Check carefully', tone: 'warning' },
  be_cautious: { label: 'Be cautious', tone: 'danger' },
};

export function ShortlistCompareCard({ listingIds }: { listingIds: string[] }) {
  const { colors, spacing, radius } = useTheme();
  const ids = listingIds.slice(0, 4);
  const [asked, setAsked] = useState(false);
  const q = useQuery({
    queryKey: ['renter', 'shortlist-comparison', [...ids].sort().join(',')],
    queryFn: () => rentDecisionApi.compare(ids),
    enabled: asked && ids.length >= 2,
    staleTime: 10 * 60_000,
    retry: false,
  });
  if (ids.length < 2) return null;

  return (
    <Card elevated padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Scale size={18} color={colors.primary} />
          <Text variant="bodyStrong" headingLevel={2}>
            Compare these homes
          </Text>
        </View>
        {!asked ? (
          <>
            <Text variant="caption" color="mutedForeground">
              Rent, cash to move in and each home&apos;s safety check, side by side
              {listingIds.length > 4 ? ' (the first 4 in this list)' : ''}.
            </Text>
            <Button label="Compare" size="sm" variant="secondary" onPress={() => setAsked(true)} />
          </>
        ) : q.isLoading ? (
          <Skeleton height={120} radius={radius.md} />
        ) : q.isError || !q.data ? (
          <Text variant="caption" color="mutedForeground">
            {errorMessage(q.error, 'Could not compare these homes right now.')}
          </Text>
        ) : (
          <>
            <Text variant="callout">{q.data.overview}</Text>
            {q.data.homes.map((h) => (
              <View
                key={h.listingId}
                style={{
                  gap: 2,
                  padding: spacing.sm,
                  borderRadius: radius.md,
                  backgroundColor: colors.secondary,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                    {h.label} · {h.title}
                  </Text>
                  <Badge label={CHECK[h.listingCheck].label} tone={CHECK[h.listingCheck].tone} />
                </View>
                <Text variant="caption" color="mutedForeground">
                  {h.rentPerYear} a year · {h.pricePosition} Move in: {h.moveInCash}
                </Text>
                {h.warnings.map((w) => (
                  <Text key={w} variant="caption" color="destructive">
                    {w}
                  </Text>
                ))}
                <Text variant="caption">{h.standsOut}</Text>
              </View>
            ))}
            <Text variant="caption" color="mutedForeground">
              {q.data.disclaimer}
            </Text>
          </>
        )}
      </View>
    </Card>
  );
}
