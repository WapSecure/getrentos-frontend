import { formatLocation } from '@sureground/shared';
import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { MapPin } from '@sureground/icons/native';
import {
  DetailSkeleton,
  PropertyCard,
  QueryState,
  SegmentedControl,
  Text,
  useTheme,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  publicMarketApi,
  type EstateStorefront,
  type MarketCard,
  type StorefrontListingType,
} from '@/lib/api/publicMarket';
import { useAuth } from '@/lib/auth/AuthProvider';
import { openMarketListing } from '@/lib/pendingListing';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Tab = StorefrontListingType | 'ALL';

export default function EstatePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { usablePortal } = useAuth();
  const [tab, setTab] = useState<Tab>('ALL');
  const estate = useQuery({
    queryKey: qk.market.storefront(slug),
    queryFn: () => publicMarketApi.storefront(slug),
    enabled: !!slug,
    retry: false,
  });
  const listings = useInfiniteQuery({
    queryKey: qk.market.storefrontListings(slug, tab),
    queryFn: ({ pageParam }) =>
      publicMarketApi.storefrontListings(slug, tab === 'ALL' ? undefined : tab, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled: !!estate.data,
    placeholderData: keepPreviousData,
  });
  const items = listings.data?.pages.flatMap((p) => p.items) ?? [];
  const e = estate.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader eyebrow="Estate" title={e?.name ?? 'Estate'} onBack={() => goBack()} />
      <QueryState
        query={estate}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This estate isn’t available"
        errorDescription="The link may be wrong, or the estate’s page is switched off."
        style={{ paddingHorizontal: spacing.xl }}
      >
        {e ? (
          <FlashList
            data={items}
            keyExtractor={(l) => l.id}
            renderItem={({ item }: { item: MarketCard }) => (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <PropertyCard
                  property={{ ...item, tag: item.highlight }}
                  onPress={(id) => openMarketListing(item.kind, id, usablePortal)}
                />
              </View>
            )}
            ListHeaderComponent={<Header estate={e} tab={tab} onTab={setTab} />}
            ListEmptyComponent={
              listings.isLoading ? null : (
                <Text
                  variant="callout"
                  color="mutedForeground"
                  style={{ paddingHorizontal: spacing.xl }}
                >
                  {tab === 'ALL'
                    ? 'Nothing is available in this estate right now.'
                    : 'Nothing of this kind is available right now.'}
                </Text>
              )
            }
            onEndReached={() => {
              if (listings.hasNextPage && !listings.isFetchingNextPage) listings.fetchNextPage();
            }}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
          />
        ) : null}
      </QueryState>
    </View>
  );
}

function Header({
  estate: e,
  tab,
  onTab,
}: {
  estate: EstateStorefront;
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
      {e.bannerUrl ? (
        <Image
          source={{ uri: e.bannerUrl }}
          contentFit="cover"
          style={{ height: 150, borderRadius: radius.lg, backgroundColor: colors.secondary }}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <MapPin size={14} color={colors.mutedForeground} />
        <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
          {formatLocation(e.address, e.city, e.state)}
        </Text>
      </View>
      {e.bio ? (
        <Text variant="callout" color="mutedForeground">
          {e.bio}
        </Text>
      ) : null}
      <SegmentedControl
        options={[
          { value: 'ALL', label: 'All' },
          { value: 'RENT', label: `Rent ${e.rentCount}` },
          { value: 'SALE', label: `Sale ${e.saleCount}` },
          { value: 'SHORTLET', label: `Stays ${e.shortletCount}` },
        ]}
        value={tab}
        onChange={(v) => onTab(v as Tab)}
      />
    </View>
  );
}
