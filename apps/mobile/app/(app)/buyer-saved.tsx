import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
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
import { buyerSavedApi } from '@/lib/api/buyerSaved';
import type { BuyerListing } from '@/lib/api/buyer';
import { useBuyerSaved } from '@/hooks/useBuyerSaved';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function BuyerSaved() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggle } = useBuyerSaved();

  const query = useQuery({
    queryKey: qk.buyer.saved(1, 100),
    queryFn: () => buyerSavedApi.list(1, 100),
  });
  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Buyer journey"
          title="Saved listings"
          subtitle={
            query.data
              ? `${items.length} saved home${items.length === 1 ? '' : 's'}`
              : 'Your property shortlist'
          }
          onBack={() => router.back()}
        />
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={100} radius={16} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart size={34} color={colors.mutedForeground} />}
          title="Nothing saved yet"
          description="Tap the heart on a listing to save it here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerListing }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/buyer-listing/${item.id}`)}>
                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
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
                    <Pressable
                      onPress={() => toggle(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.title} from saved listings`}
                      hitSlop={12}
                    >
                      <Heart size={20} color={colors.destructive} fill={colors.destructive} />
                    </Pressable>
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
