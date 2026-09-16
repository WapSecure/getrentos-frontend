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
import { agentReviewsApi, type AgentReview } from '@/lib/api/agentReviews';
import { formatDate } from '@/lib/format';

export default function AgentReviews() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const summaryQuery = useQuery({
    queryKey: qk.agent.reviewsSummary,
    queryFn: agentReviewsApi.summary,
  });
  const listQuery = useQuery({
    queryKey: qk.agent.reviews(1, 50),
    queryFn: () => agentReviewsApi.list(1, 50),
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

      {summaryQuery.data ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
          <Card elevated>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ alignItems: 'center' }}>
                <Text variant="title" style={{ fontSize: 32 }}>
                  {summaryQuery.data.averageRating.toFixed(1)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      color={colors.warning}
                      fill={
                        n <= Math.round(summaryQuery.data!.averageRating)
                          ? colors.warning
                          : 'transparent'
                      }
                    />
                  ))}
                </View>
                <Text variant="caption" color="mutedForeground">
                  {summaryQuery.data.reviewCount} reviews
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                {summaryQuery.data.ratingDistribution.map((d) => (
                  <View
                    key={d.rating}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    <Text variant="caption" color="mutedForeground" style={{ width: 10 }}>
                      {d.rating}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.secondary,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          width: `${summaryQuery.data!.reviewCount ? (d.count / summaryQuery.data!.reviewCount) * 100 : 0}%`,
                          backgroundColor: colors.warning,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </View>
      ) : null}

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
          description="Reviews from your clients will appear here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentReview }) => (
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
              onRefresh={() => {
                listQuery.refetch();
                summaryQuery.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
