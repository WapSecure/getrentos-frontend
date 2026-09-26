import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Heart, ImageOff, Search } from 'lucide-react-native';
import {
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { qk } from '@/lib/query/keys';
import { buyerApi, type BuyerListing, type ListingFilters } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const PAGE_SIZE = 20;
const SORTS: { value: ListingFilters['sort']; label: string }[] = [
  { value: undefined, label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

/** Enum values the API accepts, with the labels the product shows. Mirrors the web's `PROPERTY_TYPE_OPTIONS`. */
const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'CONDO', label: 'Condo' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LAND', label: 'Land' },
  { value: 'SHARED_APARTMENT', label: 'Shared apartment' },
] as const;

export default function BuyerDiscover() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { savedIds, toggle } = useBuyerSaved();
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
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

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

      {query.isError && items.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={140} radius={16} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search size={34} color={colors.mutedForeground} />}
          title="No listings match"
          description="Try a different search."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerListing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/buyer-listing/${item.id}`)}>
                <Card elevated padding="none" style={{ overflow: 'hidden' }}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      contentFit="cover"
                      transition={200}
                      style={{ width: '100%', height: 160 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: 160,
                        backgroundColor: colors.secondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImageOff size={22} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                      padding: spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {item.address}, {item.city}
                      </Text>
                      <Price
                        amount={item.askingPrice}
                        variant="bodyStrong"
                        style={{ marginTop: 4 }}
                      />
                    </View>
                    <Pressable onPress={() => toggle(item.id)} hitSlop={8}>
                      <Heart
                        size={20}
                        color={savedIds.has(item.id) ? colors.destructive : colors.mutedForeground}
                        fill={savedIds.has(item.id) ? colors.destructive : 'transparent'}
                      />
                    </Pressable>
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          ListHeaderComponent={
            <Text
              variant="caption"
              color="mutedForeground"
              style={{
                paddingHorizontal: spacing.xl,
                paddingTop: spacing.sm,
                paddingBottom: spacing.md,
              }}
            >
              {total} {total === 1 ? 'listing' : 'listings'}
            </Text>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.xl }}>
                <ActivityIndicator color={colors.mutedForeground} />
              </View>
            ) : (
              <View style={{ height: spacing['3xl'] }} />
            )
          }
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
