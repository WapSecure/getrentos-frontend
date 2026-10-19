import type { ReactElement } from 'react';
import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BedDouble } from 'lucide-react-native';
import { EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { shortletsApi, type ShortletFilters, type ShortletListing } from '@/lib/api/shortlets';
import { haptics } from '@/lib/haptics';
import { StayCard } from './StayCard';

const PAGE_SIZE = 20;

/** Where a result opens: the stay, carrying the dates and party already chosen. */
export function openStay(
  id: string,
  filters: Pick<ShortletFilters, 'checkIn' | 'checkOut' | 'guests'>
) {
  router.push({
    pathname: '/(app)/shortlet/[id]',
    params: {
      id,
      ...(filters.checkIn && filters.checkOut
        ? { checkIn: filters.checkIn, checkOut: filters.checkOut }
        : {}),
      ...(filters.guests ? { guests: String(filters.guests) } : {}),
    },
  });
}

/**
 * Paged stay results for a set of filters, with the wishlist heart wired up.
 * The header scrolls with the list so the page reads as one surface.
 */
export function StayResults({
  filters,
  header,
  emptyTitle = 'No stays match',
  emptyDescription = 'Try other dates, or loosen a filter.',
}: {
  filters: ShortletFilters;
  header?: ReactElement;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useInfiniteQuery({
    queryKey: qk.shortlets.list({ ...filters }),
    queryFn: ({ pageParam }) => shortletsApi.list(filters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    // Changing a filter keeps the current results up until the new ones land.
    placeholderData: keepPreviousData,
  });
  const wishlistQuery = useQuery({
    queryKey: qk.shortlets.wishlistIds,
    queryFn: shortletsApi.wishlistIds,
  });
  const wishlisted = new Set(wishlistQuery.data ?? []);

  const wishlist = useOptimisticMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      next ? shortletsApi.addToWishlist(id) : shortletsApi.removeFromWishlist(id),
    patches: ({ id, next }) => [
      {
        queryKey: qk.shortlets.wishlistIds,
        update: (old) =>
          next ? [...(old as string[]), id] : (old as string[]).filter((x) => x !== id),
      },
    ],
    invalidate: [qk.shortlets.wishlist],
    errorMessage: 'Your wishlist didn’t update. Please try again.',
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const dated = !!filters.checkIn && !!filters.checkOut;

  const listHeader = (
    <View>
      {header}
      {!query.isPending && items.length ? (
        <Text
          variant="callout"
          color="mutedForeground"
          style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}
        >
          {total} {total === 1 ? 'stay' : 'stays'}
          {dated ? ' · prices are the total for your dates' : ''}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }: { item: ShortletListing }) => (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}>
          <StayCard
            item={item}
            saved={wishlisted.has(item.id)}
            onPress={() => openStay(item.id, filters)}
            onToggleSave={() => {
              void haptics.tap();
              wishlist.mutate({ id: item.id, next: !wishlisted.has(item.id) });
            }}
          />
        </View>
      )}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={
        query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={290} radius={radius.lg} />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={<BedDouble size={34} color={colors.mutedForeground} />}
            title={emptyTitle}
            description={emptyDescription}
          />
        )
      }
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View
            style={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
            }}
          >
            <Skeleton height={290} radius={radius.lg} />
          </View>
        ) : (
          <View style={{ height: insets.bottom + spacing['3xl'] }} />
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage && !query.isPlaceholderData}
          onRefresh={() => query.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
    />
  );
}
