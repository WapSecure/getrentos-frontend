import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, ImageOff } from 'lucide-react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { shortletsApi, type ShortletListing } from '@/lib/api/shortlets';

export default function ShortletWishlist() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.shortlets.wishlist,
    queryFn: () => shortletsApi.wishlist(1, 50),
  });
  const items = query.data?.items ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => shortletsApi.removeFromWishlist(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlist });
      qc.invalidateQueries({ queryKey: qk.shortlets.wishlistIds });
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Saved stays</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={200} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title="Nothing saved yet"
          description="Tap the heart on a stay to save it here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: ShortletListing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/shortlet/${item.id}`)}>
                <Card elevated padding="none" style={{ overflow: 'hidden' }}>
                  <View>
                    {item.coverImageUrl ? (
                      <Image
                        source={{ uri: item.coverImageUrl }}
                        contentFit="cover"
                        transition={200}
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
                      onPress={() => removeMutation.mutate(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove from wishlist"
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
                      <Heart size={17} color="#fff" fill="#fff" />
                    </Pressable>
                  </View>
                  <View style={{ padding: spacing.lg, gap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {item.address}, {item.city}
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
      )}
    </View>
  );
}
