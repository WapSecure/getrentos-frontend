import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { buyerReviewsApi, type BuyerReview } from '@/lib/api/buyerReviews';
import { formatDate } from '@/lib/format';

export default function BuyerReviews() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const listQuery = useQuery({
    queryKey: qk.buyer.reviews(1, 50),
    queryFn: () => buyerReviewsApi.list(1, 50),
  });
  const items = listQuery.data?.items ?? [];

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
        <Text variant="title">Reviews</Text>
      </View>

      {listQuery.isError ? (
        <ErrorState onRetry={() => listQuery.refetch()} />
      ) : listQuery.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={80} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Star size={34} color={colors.mutedForeground} />}
          title="No reviews yet"
          description="Reviews you leave will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: BuyerReview }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Card elevated>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text variant="bodyStrong">{item.author}</Text>
                  <View style={{ flexDirection: 'row', gap: 1 }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        color={colors.warning}
                        fill={n <= item.rating ? colors.warning : 'transparent'}
                      />
                    ))}
                  </View>
                </View>
                <Text variant="caption" color="mutedForeground" style={{ marginTop: 2 }}>
                  {formatDate(item.date, 'short')}
                  {item.category ? ` · ${item.category}` : ''}
                </Text>
                {item.comment ? (
                  <>
                    <Divider style={{ marginVertical: spacing.sm }} />
                    <Text variant="callout" color="mutedForeground">
                      {item.comment}
                    </Text>
                  </>
                ) : null}
              </Card>
            </View>
          )}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching}
              onRefresh={() => listQuery.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
