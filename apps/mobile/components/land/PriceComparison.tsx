import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { percentileWords } from '@sureground/shared';
import { Card, Divider, PressableScale, Progress, Text, useTheme } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landApi } from '@/lib/api/land';
import { formatNaira } from '@/lib/format';
import { useAuth } from '@/lib/auth/AuthProvider';
import { openMarketListing } from '@/lib/pendingListing';

/**
 * Where a parcel's price per m² sits among comparable verified land, and
 * those comparables (web: the "How this parcel compares" section). Public
 * data; when it can't load, or there is nothing to compare, it stays hidden
 * rather than getting in the way of the listing.
 */
export function PriceComparison({ listingId }: { listingId: string }) {
  const { spacing } = useTheme();
  const { usablePortal } = useAuth();
  const q = useQuery({
    queryKey: qk.land.comparables(listingId),
    queryFn: () => landApi.comparables(listingId),
    retry: false,
  });
  const d = q.data;
  if (!d || (d.subjectPercentile === undefined && d.comparables.length === 0)) return null;
  const percentile = d.subjectPercentile;

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="heading">How this price compares</Text>
      {percentile !== undefined ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout">This parcel is {percentileWords(percentile)}.</Text>
          <Progress
            value={Math.max(0.03, Math.min(1, percentile / 100))}
            height={8}
            accessibilityLabel={`Price per square metre: ${percentileWords(percentile)}`}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="caption" color="mutedForeground">
              Cheaper
            </Text>
            <Text variant="caption" color="mutedForeground">
              Dearer
            </Text>
          </View>
          <Text variant="caption" color="mutedForeground">
            {d.subjectPricePerSqm ? `${formatNaira(d.subjectPricePerSqm)}/m² here` : ''}
            {d.subjectPricePerSqm && d.comparablesMedianPricePerSqm ? ' · ' : ''}
            {d.comparablesMedianPricePerSqm
              ? `median ${formatNaira(d.comparablesMedianPricePerSqm)}/m²`
              : ''}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Among {d.comparables.length} comparable verified listing
            {d.comparables.length === 1 ? '' : 's'}; asking prices, not sale prices.
          </Text>
        </View>
      ) : null}
      {d.comparables.map((c) => (
        <PressableScale
          key={c.id}
          onPress={() => openMarketListing('land', c.id, usablePortal)}
          accessibilityRole="button"
          accessibilityLabel={c.title}
        >
          <View style={{ gap: 2 }}>
            <Divider style={{ marginBottom: spacing.sm }} />
            <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
              {c.title}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {[c.estateName, c.city].filter(Boolean).join(', ')} · {formatNaira(c.price)}
              {c.pricePerSqm ? ` · ${formatNaira(c.pricePerSqm)}/m²` : ''}
            </Text>
          </View>
        </PressableScale>
      ))}
      <Text variant="caption" color="mutedForeground">
        Area-by-area land prices are on getsureground.io.
      </Text>
    </Card>
  );
}
