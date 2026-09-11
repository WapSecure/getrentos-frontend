import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Heart, Search, SlidersHorizontal, X } from 'lucide-react-native';
import {
  Chip,
  EmptyState,
  ErrorState,
  PropertyCard,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { PropertyFilterSheet } from '@/components/property/PropertyFilterSheet';
import { useSavedListings } from '@/hooks/useSavedListings';
import { qk } from '@/lib/query/keys';
import {
  propertiesApi,
  LISTING_SORTS,
  LISTING_SORT_LABEL,
  PROPERTY_TYPE_LABEL,
  type ListingFilters,
  type ListingSort,
  type RenterProperty,
} from '@/lib/api/properties';
import { track } from '@/lib/analytics';

const PAGE_SIZE = 20;

export default function Discover() {
  const { colors, spacing } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ListingFilters>({});
  const [sortBy, setSortBy] = useState<ListingSort>('recent');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { savedIds, toggle } = useSavedListings();

  // Debounce the free-text search into the filter set.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = searchText.trim();
      setFilters((f) =>
        f.search === (next || undefined) ? f : { ...f, search: next || undefined }
      );
      if (next) track('search_performed', { q: next });
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const query = useInfiniteQuery({
    queryKey: qk.listings.search({ ...filters, sortBy } as Record<string, unknown>),
    queryFn: ({ pageParam }) => propertiesApi.list({ ...filters, sortBy }, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.items) ?? [], [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  const chips = useActiveFilterChips(filters, setFilters);

  const onEndReached = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: RenterProperty }) => (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <PropertyCard
          property={item}
          saved={savedIds.has(item.id)}
          onToggleSave={toggle}
          onPress={(id) => router.push(`/(app)/property/${id}`)}
        />
      </View>
    ),
    [savedIds, toggle, spacing.xl, spacing.md]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* sticky search + filter bar */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="title">Discover</Text>
          <Pressable
            onPress={() => router.push('/(app)/saved')}
            accessibilityRole="button"
            accessibilityLabel="Saved homes"
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: savedIds.size ? colors.accent : 'transparent',
            }}
          >
            <Heart
              size={19}
              color={savedIds.size ? colors.primary : colors.foreground}
              fill={savedIds.size ? colors.primary : 'transparent'}
            />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Search city, area or title"
              leftIcon={<Search size={18} color={colors.mutedForeground} />}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <FilterButton count={chips.length} onPress={() => setSheetOpen(true)} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -spacing.xl }}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}
        >
          {LISTING_SORTS.map((s) => (
            <Chip
              key={s}
              label={LISTING_SORT_LABEL[s]}
              selected={sortBy === s}
              onPress={() => {
                setSortBy(s);
                track('sort_changed', { sortBy: s });
              }}
            />
          ))}
        </ScrollView>

        {chips.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}
          >
            {chips.map((c) => (
              <Pressable
                key={c.key}
                onPress={c.clear}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingVertical: 6,
                  paddingHorizontal: 11,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                }}
              >
                <Text
                  variant="caption"
                  style={{ color: colors.accentForeground, fontWeight: '600' }}
                >
                  {c.label}
                </Text>
                <X size={12} color={colors.accentForeground} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {query.isError && items.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <LoadingList />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search size={34} color={colors.mutedForeground} />}
          title="No listings match"
          description="Try widening your price range or clearing a filter."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={onEndReached}
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
              {total} {total === 1 ? 'home' : 'homes'}
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

      <PropertyFilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          track('filters_applied');
        }}
      />
    </View>
  );
}

function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Filters"
      style={{
        width: 46,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: count ? colors.primary : colors.border,
        backgroundColor: count ? colors.accent : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SlidersHorizontal size={18} color={count ? colors.primary : colors.foreground} />
      {count ? (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            minWidth: 17,
            height: 17,
            borderRadius: 9,
            paddingHorizontal: 4,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            variant="caption"
            style={{ fontSize: 10, fontWeight: '800', color: colors.primaryForeground }}
          >
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function LoadingList() {
  const { spacing, radius } = useTheme();
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ gap: spacing.sm }}>
          <Skeleton height={176} radius={radius.lg} />
          <Skeleton height={16} width="45%" />
          <Skeleton height={13} width="70%" />
        </View>
      ))}
    </View>
  );
}

type FilterChip = { key: string; label: string; clear: () => void };

function useActiveFilterChips(
  filters: ListingFilters,
  setFilters: React.Dispatch<React.SetStateAction<ListingFilters>>
): FilterChip[] {
  return useMemo(() => {
    const out: FilterChip[] = [];
    const drop = (keys: (keyof ListingFilters)[]) =>
      setFilters((f) => {
        const next = { ...f };
        keys.forEach((k) => delete next[k]);
        return next;
      });

    if (filters.minPrice || filters.maxPrice) {
      const lo = filters.minPrice ? `₦${(filters.minPrice / 1000).toFixed(0)}k` : '₦0';
      const hi = filters.maxPrice ? `₦${(filters.maxPrice / 1000).toFixed(0)}k` : 'Any';
      out.push({ key: 'price', label: `${lo}–${hi}`, clear: () => drop(['minPrice', 'maxPrice']) });
    }
    if (filters.bedrooms)
      out.push({
        key: 'beds',
        label: `${filters.bedrooms}${filters.bedrooms >= 4 ? '+' : ''} bed`,
        clear: () => drop(['bedrooms']),
      });
    if (filters.bathrooms)
      out.push({
        key: 'baths',
        label: `${filters.bathrooms}${filters.bathrooms >= 3 ? '+' : ''} bath`,
        clear: () => drop(['bathrooms']),
      });
    if (filters.propertyType)
      out.push({
        key: 'type',
        label: PROPERTY_TYPE_LABEL[filters.propertyType],
        clear: () => drop(['propertyType']),
      });
    if (filters.verifiedOnly)
      out.push({ key: 'verified', label: 'Verified only', clear: () => drop(['verifiedOnly']) });
    return out;
  }, [filters, setFilters]);
}
