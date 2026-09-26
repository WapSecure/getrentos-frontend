import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, MoreHorizontal, Settings2 } from 'lucide-react-native';
import {
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  PropertyCard,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { useSavedListings } from '@/hooks/useSavedListings';
import { qk } from '@/lib/query/keys';
import { savedListingsApi, type SavedProperty } from '@/lib/api/properties';
import { wishlistsApi } from '@/lib/api/wishlists';
import { WishlistManageSheet } from '@/components/property/WishlistManageSheet';
import { MoveToWishlistSheet } from '@/components/property/MoveToWishlistSheet';
import { RecentlyViewedStrip } from '@/components/property/RecentlyViewedStrip';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

export default function Saved() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggle } = useSavedListings();
  const qc = useQueryClient();

  const [activeWishlistId, setActiveWishlistId] = useState<string | undefined>(undefined);
  const [manageOpen, setManageOpen] = useState(false);
  const [movingItem, setMovingItem] = useState<SavedProperty | null>(null);

  const wishlistsQuery = useQuery({ queryKey: qk.renter.wishlists, queryFn: wishlistsApi.list });

  const listQuery = useQuery({
    queryKey: qk.listings.savedByWishlist(activeWishlistId),
    queryFn: () => savedListingsApi.list(1, 100, activeWishlistId),
  });
  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);
  const refetchList = listQuery.refetch;
  const refetchWishlists = wishlistsQuery.refetch;

  const refetchAll = useCallback(() => {
    refetchList();
    refetchWishlists();
    qc.invalidateQueries({ queryKey: qk.listings.saved });
  }, [refetchList, refetchWishlists, qc]);

  const renderItem = useCallback(
    ({ item }: { item: SavedProperty }) => (
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.xs }}>
        <PropertyCard
          property={item}
          layout="row"
          saved
          onToggleSave={toggle}
          onPress={(id) => router.push(`/(app)/property/${id}`)}
        />
        <Pressable
          onPress={() => setMovingItem(item)}
          accessibilityRole="button"
          accessibilityLabel={`Move ${item.title} to another wishlist`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            alignSelf: 'flex-end',
            minHeight: 44,
            paddingHorizontal: spacing.sm,
          }}
          hitSlop={8}
        >
          <MoreHorizontal size={14} color={colors.mutedForeground} />
          <Text variant="caption" color="mutedForeground">
            Move to wishlist
          </Text>
        </Pressable>
      </View>
    ),
    [colors.mutedForeground, spacing.md, spacing.sm, spacing.xl, spacing.xs, toggle]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Your shortlist"
        title="Saved homes"
        subtitle="Organize and compare favorite listings"
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setManageOpen(true)}
            accessibilityLabel="Manage wishlists"
            icon={<Settings2 size={19} color={colors.foreground} />}
          />
        }
      />

      {(wishlistsQuery.data?.length ?? 0) > 0 ? (
        <ScrollView
          accessibilityLabel="Filter saved homes by wishlist"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            gap: spacing.xs,
            paddingBottom: spacing.sm,
          }}
        >
          <Chip
            label="All"
            selected={!activeWishlistId}
            onPress={() => setActiveWishlistId(undefined)}
            size="sm"
          />
          {wishlistsQuery.data!.map((w) => (
            <Chip
              key={w.id}
              label={w.name}
              count={w.count}
              selected={activeWishlistId === w.id}
              onPress={() => setActiveWishlistId(w.id)}
              size="sm"
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <RecentlyViewedStrip />
      </View>

      {listQuery.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={116} radius={16} />
          ))}
        </View>
      ) : listQuery.isError ? (
        <ErrorState
          title="Couldn't load your saved homes"
          description="Check your connection and try again. Your shortlist is safe."
          onRetry={() => listQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title={activeWishlistId ? 'Nothing in this wishlist yet' : 'Nothing saved yet'}
          description={
            activeWishlistId
              ? 'Move a saved home here from its card menu.'
              : 'Tap the heart on any listing to keep it here for later.'
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching || wishlistsQuery.isRefetching}
              onRefresh={refetchAll}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}

      <WishlistManageSheet open={manageOpen} onClose={() => setManageOpen(false)} />
      <MoveToWishlistSheet
        open={!!movingItem}
        onClose={() => setMovingItem(null)}
        savedListingId={movingItem?.savedListingId ?? null}
        currentWishlistId={movingItem?.wishlistId ?? null}
      />
    </View>
  );
}
