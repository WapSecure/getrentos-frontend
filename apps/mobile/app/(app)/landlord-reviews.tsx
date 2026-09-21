import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import { Card, EmptyState, ErrorState, Skeleton, Text, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, type LandlordReview } from '@/lib/api/landlord';
import { formatDate } from '@/lib/format';
import { StarRating } from '@/components/reviews/StarRating';

export default function LandlordReviews() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const summary = useQuery({
    queryKey: qk.landlord.reviewsSummary,
    queryFn: landlordApi.reviewsSummary,
  });
  const query = useQuery({
    queryKey: qk.landlord.reviews(),
    queryFn: () => landlordApi.reviews(),
  });

  const s = summary.data;
  const items = query.data?.items ?? [];

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
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <Text variant="title" style={{ flex: 1 }}>
          Reviews
        </Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(r) => r.id}
          renderItem={({ item }: { item: LandlordReview }) => <ReviewCard review={item} />}
          ListHeaderComponent={
            <View style={{ paddingBottom: spacing.md }}>
              <Card elevated>
                {summary.isLoading ? (
                  <Skeleton height={70} />
                ) : (
                  <View style={{ gap: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      <Text variant="display">{(s?.averageRating ?? 0).toFixed(1)}</Text>
                      <View style={{ gap: 3 }}>
                        <StarRating value={Math.round(s?.averageRating ?? 0)} size={15} />
                        <Text variant="caption" color="mutedForeground">
                          {s?.reviewCount ?? 0} review{s?.reviewCount === 1 ? '' : 's'}
                        </Text>
                      </View>
                    </View>

                    {(s?.reviewCount ?? 0) > 0 ? (
                      <View style={{ gap: 6 }}>
                        <Facet label="Communication" value={s?.averageCommunication ?? 0} />
                        <Facet
                          label="Property condition"
                          value={s?.averagePropertyCondition ?? 0}
                        />
                        <Facet label="Responsiveness" value={s?.averageResponsiveness ?? 0} />
                      </View>
                    ) : null}
                  </View>
                )}
              </Card>
            </View>
          }
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => {
                query.refetch();
                summary.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={{ gap: spacing.sm }}>
                {[0, 1].map((i) => (
                  <Skeleton key={i} height={110} radius={radius.lg} />
                ))}
              </View>
            ) : (
              <EmptyState
                icon={<Star size={32} color={colors.mutedForeground} />}
                title="No reviews yet"
                description="Tenants can review you after a tenancy ends. Reviews feed your trust score."
              />
            )
          }
        />
      )}
    </View>
  );
}

/** A single facet score as a thin bar — magnitude out of five. */
function Facet({ label, value }: { label: string; value: number }) {
  const { colors, spacing, radius } = useTheme();
  const pct = Math.max(0, Math.min(1, value / 5));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Text variant="caption" color="mutedForeground" style={{ width: 128 }}>
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: 5,
          borderRadius: radius.sm / 2,
          backgroundColor: colors.secondary,
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
      <Text variant="caption" color="mutedForeground" style={{ width: 26, textAlign: 'right' }}>
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

function ReviewCard({ review: r }: { review: LandlordReview }) {
  const { spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <StarRating value={r.rating} size={14} />
          <View style={{ flex: 1 }} />
          <Text variant="caption" color="mutedForeground">
            {formatDate(r.createdAt, 'short')}
          </Text>
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {r.tenantName} · {r.propertyName}
        </Text>

        {r.comment ? (
          <Text variant="callout" color="mutedForeground">
            {r.comment}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
