import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ImageOff } from 'lucide-react-native';
import { Card, ListSkeleton, Price, QueryState, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { useOptimisticMutation } from '@/lib/query/optimistic';
import { shortletsApi, type ShortletListing } from '@/lib/api/shortlets';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function ShortletWishlist() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({
    queryKey: qk.shortlets.wishlist,
    queryFn: () => shortletsApi.wishlist(1, 50),
  });
  const items = query.data?.items ?? [];

  // The stay leaves the list at once and comes back if the server refuses.
  const removeMutation = useOptimisticMutation({
    mutationFn: (id: string) => shortletsApi.removeFromWishlist(id),
    patches: (id) => [
      {
        queryKey: qk.shortlets.wishlist,
        update: (old) => {
          const page = old as { items: ShortletListing[] };
          return { ...page, items: page.items.filter((x) => x.id !== id) };
        },
      },
      {
        queryKey: qk.shortlets.wishlistIds,
        update: (old) => (old as string[]).filter((x) => x !== id),
      },
    ],
    errorMessage: 'Could not remove that stay. Please try again.',
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Shortlet shortlist"
        title="Saved stays"
        subtitle="Favorite stays ready for comparison"
        onBack={() => goBack()}
      />

      <QueryState
        query={query}
        style={{ paddingHorizontal: spacing.xl }}
        skeleton={<ListSkeleton variant="card" rows={2} height={200} />}
        isEmpty={items.length === 0}
        empty={{
          icon: <Heart size={34} color={colors.mutedForeground} />,
          title: 'Nothing saved yet',
          description: 'Tap the heart on a stay to save it here.',
        }}
      >
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ShortletListing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable
                onPress={() => router.push(`/(app)/shortlet/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`View ${item.title}`}
              >
                <Card elevated padding="none" style={{ overflow: 'hidden' }}>
                  <View>
                    {item.coverImageUrl ? (
                      <Image
                        source={{ uri: item.coverImageUrl }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={item.id}
                        transition={200}
                        accessible={false}
                        style={{ width: '100%', height: 150 }}
                      />
                    ) : (
                      <View
                        style={{
                          width: '100%',
                          height: 150,
                          backgroundColor: colors.secondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ImageOff size={22} color={colors.mutedForeground} />
                      </View>
                    )}
                    <Pressable
                      onPress={(event) => {
                        event.stopPropagation();
                        removeMutation.mutate(item.id);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Remove from wishlist"
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: spacing.md,
                        right: spacing.md,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                      }}
                    >
                      <Heart
                        size={19}
                        color={colors.primaryForeground}
                        fill={colors.primaryForeground}
                      />
                    </Pressable>
                  </View>
                  <View style={{ padding: spacing.lg, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {[item.address, item.city].filter(Boolean).join(', ')}
                    </Text>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}
                    >
                      <Price amount={item.nightlyRate} variant="bodyStrong" />
                      <Text variant="caption" color="mutedForeground">
                        / night
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      </QueryState>
    </View>
  );
}
