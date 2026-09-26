import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { Card, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { ownerApi } from '@/lib/api/owner';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

export default function OwnerReviews() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const summary = useQuery({ queryKey: qk.owner.ratingSummary, queryFn: ownerApi.ratingSummary });
  const reviews = useQuery({ queryKey: qk.owner.reviews, queryFn: () => ownerApi.reviews() });
  const s = summary.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={reviews.isRefetching}
          onRefresh={() => {
            summary.refetch();
            reviews.refetch();
          }}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      <DetailHeader
        eyebrow="Reputation"
        title="Reviews"
        subtitle="What buyers say about selling with you"
        onBack={() => router.back()}
      />

      {s ? (
        <Card
          elevated
          accessible
          accessibilityLabel={`Rated ${s.averageRating.toFixed(1)} out of 5 from ${s.reviewCount} reviews`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}
        >
          <Text variant="display" style={{ fontSize: 40, lineHeight: 46 }}>
            {s.averageRating.toFixed(1)}
          </Text>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={16}
                  color={colors.warning}
                  fill={n <= Math.round(s.averageRating) ? colors.warning : 'transparent'}
                />
              ))}
            </View>
            <Text variant="caption" color="mutedForeground">
              {s.reviewCount} {s.reviewCount === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
        </Card>
      ) : summary.isPending ? (
        <Skeleton height={90} radius={radius.lg} />
      ) : null}

      {reviews.isError && !reviews.data ? (
        <ErrorState onRetry={() => reviews.refetch()} />
      ) : reviews.isPending ? (
        <Skeleton height={120} radius={radius.lg} />
      ) : !reviews.data?.items.length ? (
        <EmptyState
          icon={<Star size={34} color={colors.mutedForeground} />}
          title="No reviews yet"
          description="Buyers can review you after a completed sale."
        />
      ) : (
        reviews.data.items.map((r) => (
          <Card
            key={r.id}
            elevated
            accessible
            accessibilityLabel={`${r.author}, ${r.rating} out of 5, ${r.comment ?? ''}`}
            style={{ gap: spacing.xs }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{r.author}</Text>
              <Text variant="caption" color="mutedForeground">
                {formatDate(r.date, 'short')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={13}
                  color={colors.warning}
                  fill={n <= r.rating ? colors.warning : 'transparent'}
                />
              ))}
            </View>
            {r.comment ? <Text variant="callout">{r.comment}</Text> : null}
          </Card>
        ))
      )}
    </ScrollView>
  );
}
