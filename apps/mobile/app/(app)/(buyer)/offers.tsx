import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSignature } from 'lucide-react-native';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  buyerOffersApi,
  BUYER_OFFER_STATUS_LABEL,
  BUYER_OFFER_STATUS_TONE,
  type BuyerOffer,
  type BuyerOfferStatus,
} from '@/lib/api/buyerOffers';
import { formatDate } from '@/lib/format';

const STATUSES: BuyerOfferStatus[] = [
  'submitted',
  'countered',
  'accepted',
  'rejected',
  'withdrawn',
  'expired',
  'closed',
];

export default function BuyerOffers() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<BuyerOfferStatus | undefined>(undefined);

  const query = useQuery({
    queryKey: qk.buyer.offers(1, 50),
    queryFn: () => buyerOffersApi.list(1, 50),
  });
  const items = (query.data?.items ?? []).filter((o) => !status || o.status === status);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.md,
        }}
      >
        <Text variant="title">Offers</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <Chip label="All" selected={!status} onPress={() => setStatus(undefined)} size="sm" />
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={BUYER_OFFER_STATUS_LABEL[s]}
              selected={status === s}
              onPress={() => setStatus(s)}
              size="sm"
            />
          ))}
        </ScrollView>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FileSignature size={34} color={colors.mutedForeground} />}
          title="No offers"
          description={
            status
              ? 'No offers match this filter.'
              : 'Offers you make on a listing will show up here.'
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.md,
            gap: spacing.md,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        >
          {items.map((offer: BuyerOffer) => (
            <Pressable key={offer.id} onPress={() => router.push(`/(app)/buyer-offer/${offer.id}`)}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {offer.propertyTitle}
                    </Text>
                    <Price amount={offer.offerAmount} variant="callout" />
                    <Text variant="caption" color="mutedForeground">
                      Submitted {formatDate(offer.submittedAt, 'short')}
                    </Text>
                  </View>
                  <Badge
                    label={BUYER_OFFER_STATUS_LABEL[offer.status]}
                    tone={BUYER_OFFER_STATUS_TONE[offer.status]}
                  />
                </View>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
