import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { ChevronLeft, LandPlot, Search, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
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
import { qk } from '@/lib/query/keys';
import {
  formatLandArea,
  landApi,
  LAND_DILIGENCE_LABEL,
  LAND_DILIGENCE_TONE,
  LAND_TITLE_TYPE_LABEL,
  type LandFilters,
  type LandListing,
} from '@/lib/api/land';

const PAGE_SIZE = 20;
const SORTS: { value: LandFilters['sort']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

export default function LandMarketplace() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<LandFilters>({ sort: 'newest' });

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
    queryKey: qk.land.list({ ...filters }),
    queryFn: ({ pageParam }) => landApi.list(filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: insets.top + 8, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={10}
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </Pressable>
          <Text variant="title">Land</Text>
        </View>

        <TextField
          placeholder="Search city, estate or title"
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          autoCapitalize="none"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
        />

        <ScrollView
          horizontal
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
            <Skeleton key={i} height={150} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LandPlot size={34} color={colors.mutedForeground} />}
          title="No land listings"
          description="Only parcels with verified title diligence appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: LandListing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/land-listing/${item.id}`)}>
                <Card elevated>
                  <View style={{ gap: 4 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {item.address}, {item.city}
                    </Text>
                    <Price amount={item.price} variant="bodyStrong" style={{ marginTop: 2 }} />
                    <Text variant="caption" color="mutedForeground">
                      {formatLandArea(item.parcel.areaValue, item.parcel.areaUnit)}
                      {item.parcel.titleType
                        ? ` · ${LAND_TITLE_TYPE_LABEL[item.parcel.titleType]}`
                        : ''}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                        marginTop: 6,
                      }}
                    >
                      <Badge
                        label={LAND_DILIGENCE_LABEL[item.diligence.status]}
                        tone={LAND_DILIGENCE_TONE[item.diligence.status]}
                      />
                      {item.isVerified ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <ShieldCheck size={13} color={colors.success} />
                          <Text variant="caption" style={{ color: colors.success }}>
                            Verified
                          </Text>
                        </View>
                      ) : null}
                    </View>
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
              {total} {total === 1 ? 'parcel' : 'parcels'}
            </Text>
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.xl }}>
                <ActivityIndicator color={colors.mutedForeground} />
              </View>
            ) : (
              <View style={{ height: insets.bottom + spacing['3xl'] }} />
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
