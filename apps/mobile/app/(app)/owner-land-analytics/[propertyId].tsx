import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  QueryState,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { landLayoutApi, type SellerAnalytics } from '@/lib/api/landLayout';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function OwnerLandAnalytics() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.owner.landAnalytics(propertyId),
    queryFn: () => landLayoutApi.analytics(propertyId),
    enabled: !!propertyId,
  });
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Seller analytics"
        subtitle="Listing interest and market position"
        onBack={() => goBack()}
      />
      <QueryState
        query={q}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="Analytics are unavailable"
      >
        {d ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={q.isRefetching}
                onRefresh={() => void q.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            {d.listings.length === 0 ? (
              <Card style={{ gap: spacing.sm }}>
                <Text variant="bodyStrong">No sale listing yet</Text>
                <Text variant="callout" color="mutedForeground">
                  Once this land is listed for sale, views, saves, viewings and offers show here.
                </Text>
                <Button
                  label="Open the parcel"
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/(app)/owner-land-parcel/${propertyId}`)}
                  style={{ alignSelf: 'flex-start' }}
                />
              </Card>
            ) : (
              d.listings.map((l) => <ListingCard key={l.listingId} listing={l} />)
            )}
            {d.market ? <MarketPosition market={d.market} /> : null}
          </ScrollView>
        ) : null}
      </QueryState>
    </View>
  );
}

function ListingCard({ listing: l }: { listing: SellerAnalytics['listings'][number] }) {
  const { spacing } = useTheme();
  const metrics: [string, number][] = [
    ['Views', l.views],
    ['Saves', l.saves],
    ['Viewings', l.viewings],
    ['Offers', l.totalOffers],
  ];
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{formatNaira(l.askingPrice)}</Text>
          <Text variant="caption" color="mutedForeground">
            {l.publishedAt
              ? `Listed ${formatDate(l.publishedAt)}${l.daysOnMarket !== null ? ` · ${l.daysOnMarket} days on market` : ''}`
              : 'Not published yet'}
          </Text>
        </View>
        <Badge
          label={l.status.toLowerCase().replace(/_/g, ' ')}
          tone={l.status === 'PUBLISHED' ? 'success' : 'neutral'}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {metrics.map(([label, value]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <Text variant="heading">{value}</Text>
            <Text variant="caption" color="mutedForeground">
              {label}
            </Text>
          </View>
        ))}
      </View>
      {l.latestOffer ? (
        <Text variant="callout" color="mutedForeground">
          Latest offer {formatNaira(l.latestOffer.amount)} (
          {l.latestOffer.vsAskingPercent > 0 ? '+' : ''}
          {l.latestOffer.vsAskingPercent}% vs asking, {l.latestOffer.status.toLowerCase()}) on{' '}
          {formatDate(l.latestOffer.createdAt)}.
        </Text>
      ) : null}
    </Card>
  );
}

function MarketPosition({ market: m }: { market: NonNullable<SellerAnalytics['market']> }) {
  const { spacing } = useTheme();
  const figures: [string, string][] = [
    [
      'Your price / sqm',
      m.subjectPricePerSqm !== undefined ? formatNaira(m.subjectPricePerSqm) : '—',
    ],
    [
      'Market median / sqm',
      m.marketMedianPricePerSqm !== undefined ? formatNaira(m.marketMedianPricePerSqm) : '—',
    ],
    ['Percentile', m.percentile !== undefined ? `${Math.round(m.percentile)}th` : '—'],
  ];
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">Market position</Text>
        <Text variant="caption" color="mutedForeground">
          Against {m.sampleSize} verified listing{m.sampleSize === 1 ? '' : 's'} in {m.area}.
        </Text>
      </View>
      {figures.map(([label, value]) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="callout" color="mutedForeground">
            {label}
          </Text>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {value}
          </Text>
        </View>
      ))}
      {m.pricingHint ? <Text variant="callout">{m.pricingHint}</Text> : null}
    </Card>
  );
}
