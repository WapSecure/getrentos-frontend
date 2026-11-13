import { formatLocation } from '@sureground/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { HardHat, Search } from '@sureground/icons/native';
import {
  Button,
  Chip,
  IconTile,
  ListSkeleton,
  PropertyCard,
  QueryState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  type PropertyCardData,
} from '@sureground/ui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { qk } from '@/lib/query/keys';
import { buyerApi, type BuyerListing, type ListingFilters } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { useCardAnalytics } from '@/hooks/useCardAnalytics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const PAGE_SIZE = 20;
const SORTS: { value: ListingFilters['sort']; label: string }[] = [
  { value: undefined, label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

// Enum values the API accepts; keep in step with the web's `PROPERTY_TYPE_OPTIONS`.
const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
  { value: 'SHARED_APARTMENT', label: 'Shared apartment' },
] as const;

// The shared listing card, as on the renter's Discover. The badge speaks to the owner, the only
// verification a sale listing carries here.
function toCard(item: BuyerListing): PropertyCardData {
  return {
    id: item.id,
    title: item.title,
    location: formatLocation(item.address, item.city),
    price: item.askingPrice,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    size: item.propertySize,
    image: item.image ?? item.images?.[0] ?? null,
    trustLabel: item.ownerVerified ? { label: 'Owner verified', tone: 'verified' } : undefined,
  };
}

export default function BuyerDiscover() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useBuyerSaved();
  // The signed-in browse, as the renter's: `discover`, told apart by market.
  const cards = useCardAnalytics('sale', 'discover');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ListingFilters>({});

  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchText.trim();
      setFilters((f) =>
        f.search === (next || undefined) ? f : { ...f, search: next || undefined }
      );
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const query = useInfiniteQuery({
    queryKey: qk.buyer.listings({ ...filters }),
    queryFn: ({ pageParam }) => buyerApi.listings(filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const hasNextPage = query.hasNextPage;
  const isFetchingNextPage = query.isFetchingNextPage;
  const fetchNextPage = query.fetchNextPage;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: BuyerListing; index: number }) => (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <PropertyCard
          property={toCard(item)}
          saved={savedIds.has(item.id)}
          onToggleSave={toggle}
          onPress={(id) => {
            cards.click(id, index);
            router.push(`/(app)/buyer-listing/${id}`);
          }}
        />
      </View>
    ),
    [cards, savedIds, spacing, toggle]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.sm,
        }}
      >
        <DashboardHeader
          eyebrow="Property marketplace"
          title="Discover"
          subtitle="Explore verified opportunities matched to you"
        />
        <TextField
          placeholder="Search city, area or title"
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          autoCapitalize="none"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
        />
        <Button
          label="Off-plan developments"
          variant="secondary"
          size="sm"
          icon={<HardHat size={16} color={colors.foreground} />}
          style={{ alignSelf: 'flex-start' }}
          onPress={() => router.push('/(app)/developments')}
        />
        <ScrollView
          horizontal
          accessibilityLabel="Filter properties by type"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <Chip
            label="All types"
            selected={!filters.propertyType}
            onPress={() => setFilters((f) => ({ ...f, propertyType: undefined }))}
            size="sm"
          />
          {PROPERTY_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={filters.propertyType === t.value}
              onPress={() =>
                setFilters((f) => ({
                  ...f,
                  propertyType: f.propertyType === t.value ? undefined : t.value,
                }))
              }
              size="sm"
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          accessibilityLabel="Sort properties"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          {SORTS.map((s) => (
            <Chip
              key={s.label}
              label={s.label}
              selected={filters.sort === s.value}
              onPress={() => setFilters((f) => ({ ...f, sort: s.value }))}
              size="sm"
            />
          ))}
        </ScrollView>
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={220} radius={4} />
            ))}
          </View>
        }
        isEmpty={items.length === 0}
        empty={{
          icon: <IconTile Icon={Search} size="xl" />,
          title: 'No listings match',
          description: 'Try a different search.',
        }}
      >
        <FlashList
          maintainVisibleContentPosition={{ disabled: true }}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          {...cards.listProps}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <Text
              variant="callout"
              color="mutedForeground"
              accessibilityLiveRegion="polite"
              style={{
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.md,
                paddingBottom: spacing.md,
              }}
            >
              <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
                {total.toLocaleString('en-NG')}
              </Text>{' '}
              {total === 1 ? 'listing' : 'listings'}
            </Text>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ListSkeleton
                variant="card"
                rows={1}
                height={220}
                style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}
              />
            ) : (
              <View style={{ height: spacing['3xl'] }} />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>
    </View>
  );
}
