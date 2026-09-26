import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import {
  BookmarkPlus,
  Heart,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  PropertyCard,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { PropertyFilterSheet } from '@/components/property/PropertyFilterSheet';
import { SaveSearchSheet } from '@/components/property/SaveSearchSheet';
import { PropertyMapView, type PropertyMapMarker } from '@/components/property/PropertyMapView';
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
import { formatNaira } from '@/lib/format';
import { track } from '@/lib/analytics';

const MAP_PAGE_SIZE = 100;

const PAGE_SIZE = 20;

export default function Discover() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filters?: string }>();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ListingFilters>(() => {
    if (!params.filters) return {};
    try {
      return JSON.parse(params.filters) as ListingFilters;
    } catch {
      return {};
    }
  });
  const [sortBy, setSortBy] = useState<ListingSort>('recent');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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

  const mapQuery = useQuery({
    queryKey: qk.listings.search({ ...filters, sortBy, mode: 'map' } as Record<string, unknown>),
    queryFn: () => propertiesApi.list({ ...filters, sortBy }, 1, MAP_PAGE_SIZE),
    enabled: viewMode === 'map',
  });

  const mapMarkers: PropertyMapMarker[] = useMemo(
    () =>
      (mapQuery.data?.items ?? [])
        .filter((p) => typeof p.latitude === 'number' && typeof p.longitude === 'number')
        .map((p) => ({
          id: p.id,
          latitude: p.latitude as number,
          longitude: p.longitude as number,
          priceLabel: formatNaira(p.price, { compact: true }),
        })),
    [mapQuery.data]
  );

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
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
            Discover
          </Text>
          <IconButton
            onPress={() => {
              const next = viewMode === 'list' ? 'map' : 'list';
              setViewMode(next);
              track('discover_view_mode_changed', { mode: next });
            }}
            accessibilityLabel={viewMode === 'list' ? 'Show map' : 'Show list'}
            icon={
              viewMode === 'list' ? (
                <MapIcon size={19} color={colors.foreground} />
              ) : (
                <List size={19} color={colors.foreground} />
              )
            }
          />
          <IconButton
            onPress={() => router.push('/(app)/saved-searches')}
            accessibilityLabel="Saved searches"
            icon={<BookmarkPlus size={19} color={colors.foreground} />}
          />
          <IconButton
            onPress={() => router.push('/(app)/saved')}
            accessibilityLabel={`Saved homes${savedIds.size ? `, ${savedIds.size} saved` : ''}`}
            selected={savedIds.size > 0}
            icon={
              <Heart
                size={19}
                color={savedIds.size ? colors.primary : colors.foreground}
                fill={savedIds.size ? colors.primary : 'transparent'}
              />
            }
          />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextField
              placeholder="Search city, area or title"
              accessibilityLabel="Search homes"
              leftIcon={<Search size={18} color={colors.mutedForeground} />}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              value={searchText}
              onChangeText={setSearchText}
              rightAccessory={
                searchText ? (
                  <Pressable
                    onPress={() => setSearchText('')}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={12}
                  >
                    <X size={18} color={colors.mutedForeground} />
                  </Pressable>
                ) : null
              }
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
                accessibilityRole="button"
                accessibilityLabel={`Remove filter: ${c.label}`}
                hitSlop={6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  minHeight: 32,
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
            <Pressable
              onPress={() => setSaveSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Save this search"
              hitSlop={6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 6,
                paddingHorizontal: 11,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <BookmarkPlus size={12} color={colors.foreground} />
              <Text variant="caption" style={{ fontWeight: '600' }}>
                Save search
              </Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>

      {viewMode === 'map' ? (
        mapQuery.isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.mutedForeground} />
          </View>
        ) : mapQuery.isError ? (
          <ErrorState onRetry={() => mapQuery.refetch()} />
        ) : mapMarkers.length === 0 ? (
          <EmptyState
            icon={<MapIcon size={34} color={colors.mutedForeground} />}
            title="Nothing to show on the map"
            description="These listings don't have map coordinates yet, or none match your filters."
          />
        ) : (
          <View style={{ flex: 1, padding: spacing.xl, paddingTop: spacing.md }}>
            <Text variant="caption" color="mutedForeground" style={{ marginBottom: spacing.sm }}>
              {mapMarkers.length} {mapMarkers.length === 1 ? 'home' : 'homes'} on the map
            </Text>
            <PropertyMapView
              markers={mapMarkers}
              zoom={12}
              style={{ flex: 1 }}
              onMarkerPress={(id) => router.push(`/(app)/property/${id}`)}
            />
          </View>
        )
      ) : query.isError && items.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <LoadingList />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Search size={34} color={colors.mutedForeground} />}
          title="No listings match"
          description="Try widening your price range or clearing a filter."
          action={
            chips.length > 0 || searchText ? (
              <Button
                label="Clear search and filters"
                variant="outline"
                onPress={() => {
                  setSearchText('');
                  setFilters({});
                }}
              />
            ) : undefined
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
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
                <ActivityIndicator
                  color={colors.mutedForeground}
                  accessibilityLabel="Loading more homes"
                />
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
      <SaveSearchSheet
        open={saveSearchOpen}
        onClose={() => setSaveSearchOpen(false)}
        filters={filters}
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
      accessibilityLabel={count ? `Filters, ${count} active` : 'Filters'}
      style={{
        width: 48,
        height: 48,
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
          importantForAccessibility="no-hide-descendants"
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
            maxFontSizeMultiplier={1.4}
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
      const lo = filters.minPrice ? formatNaira(filters.minPrice, { compact: true }) : '₦0';
      const hi = filters.maxPrice ? formatNaira(filters.maxPrice, { compact: true }) : 'Any';
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
