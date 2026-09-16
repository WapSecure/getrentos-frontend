import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BedDouble,
  CalendarCheck,
  ChevronLeft,
  Heart,
  ImageOff,
  Search,
  Star,
  Zap,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletFilters, type ShortletListing } from '@/lib/api/shortlets';

const PAGE_SIZE = 20;

export default function Shortlets() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ShortletFilters>({});

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
    queryKey: qk.shortlets.list({ ...filters }),
    queryFn: ({ pageParam }) => shortletsApi.list(filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

  const wishlistQuery = useQuery({
    queryKey: qk.shortlets.wishlistIds,
    queryFn: shortletsApi.wishlistIds,
  });
  const wishlisted = new Set(wishlistQuery.data ?? []);

  const wishlistMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      next ? shortletsApi.addToWishlist(id) : shortletsApi.removeFromWishlist(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlistIds });
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlist });
    },
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
          <Text variant="title" style={{ flex: 1 }}>
            Shortlets
          </Text>
          <Pressable
            onPress={() => router.push('/(app)/shortlet-bookings')}
            accessibilityRole="button"
            accessibilityLabel="My bookings"
            hitSlop={10}
          >
            <CalendarCheck size={21} color={colors.foreground} />
          </Pressable>
        </View>

        <TextField
          placeholder="Search city or stay"
          leftIcon={<Search size={18} color={colors.mutedForeground} />}
          autoCapitalize="none"
          autoCorrect={false}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {query.isError && items.length === 0 ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={230} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BedDouble size={34} color={colors.mutedForeground} />}
          title="No stays found"
          description="Try a different search."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ShortletListing }) => {
            const saved = wishlisted.has(item.id);
            return (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <Pressable onPress={() => router.push(`/(app)/shortlet/${item.id}`)}>
                  <Card elevated padding="none" style={{ overflow: 'hidden' }}>
                    <View>
                      {item.coverImageUrl ? (
                        <Image
                          source={{ uri: item.coverImageUrl }}
                          contentFit="cover"
                          transition={200}
                          style={{ width: '100%', height: 170 }}
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: 170,
                            backgroundColor: colors.secondary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageOff size={22} color={colors.mutedForeground} />
                        </View>
                      )}
                      <Pressable
                        onPress={() => wishlistMutation.mutate({ id: item.id, next: !saved })}
                        accessibilityRole="button"
                        accessibilityLabel={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                        hitSlop={8}
                        style={{
                          position: 'absolute',
                          top: spacing.md,
                          right: spacing.md,
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0,0,0,0.35)',
                        }}
                      >
                        <Heart size={17} color="#fff" fill={saved ? '#fff' : 'transparent'} />
                      </Pressable>
                    </View>

                    <View style={{ padding: spacing.lg, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                          {item.title}
                        </Text>
                        {item.reviewCount > 0 && item.ratingAverage ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Star size={12} color={colors.warning} fill={colors.warning} />
                            <Text variant="caption">{item.ratingAverage.toFixed(1)}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                        {item.address}, {item.city}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          gap: 4,
                          marginTop: 2,
                        }}
                      >
                        <Price amount={item.nightlyRate} variant="bodyStrong" />
                        <Text variant="caption" color="mutedForeground">
                          / night
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          marginTop: 2,
                        }}
                      >
                        <Text variant="caption" color="mutedForeground">
                          Up to {item.maxGuests} {item.maxGuests === 1 ? 'guest' : 'guests'}
                        </Text>
                        {item.instantBooking ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Zap size={12} color={colors.primary} />
                            <Text variant="caption" color="primary">
                              Instant book
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              </View>
            );
          }}
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
              {total} {total === 1 ? 'stay' : 'stays'}
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
