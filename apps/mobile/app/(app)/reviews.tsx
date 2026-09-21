import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Star } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { reviewsApi, type PendingReview, type Review } from '@/lib/api/reviews';
import { formatDate } from '@/lib/format';
import { StarRating } from '@/components/reviews/StarRating';
import { SubmitReviewSheet } from '@/components/reviews/SubmitReviewSheet';

type Tab = 'pending' | 'written' | 'about-you';

const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'To review' },
  { value: 'written', label: 'Written' },
  { value: 'about-you', label: 'About you' },
];

export default function Reviews() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('pending');
  const [reviewing, setReviewing] = useState<PendingReview | null>(null);

  const pending = useQuery({
    queryKey: qk.renter.reviewsPending,
    queryFn: reviewsApi.pending,
  });

  const written = useQuery({
    queryKey: qk.renter.reviewsSubmitted(),
    queryFn: () => reviewsApi.submitted(),
    enabled: tab === 'written',
  });

  const received = useQuery({
    queryKey: qk.renter.reviewsReceived(),
    queryFn: () => reviewsApi.received(),
    enabled: tab === 'about-you',
  });

  const active = tab === 'pending' ? pending : tab === 'written' ? written : received;

  const renderReview = (r: Review) => (
    <Card key={r.id} padding={spacing.lg}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <StarRating value={r.rating} size={15} />
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {formatDate(r.createdAt)}
          </Text>
          <Badge label={r.category} tone="neutral" />
        </View>

        {r.propertyTitle ? <Text variant="bodyStrong">{r.propertyTitle}</Text> : null}
        {r.comment ? (
          <Text variant="callout" color="mutedForeground">
            {r.comment}
          </Text>
        ) : null}
        {tab === 'about-you' && r.reviewerName ? (
          <Text variant="caption" color="mutedForeground">
            — {r.reviewerName}
          </Text>
        ) : null}
      </View>
    </Card>
  );

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

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <SegmentedControl options={TABS} value={tab} onChange={setTab} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.sm,
        }}
        refreshControl={
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={() => active.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        {active.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={96} radius={radius.lg} />)
        ) : active.isError ? (
          <ErrorState onRetry={() => active.refetch()} />
        ) : tab === 'pending' ? (
          (pending.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Star size={30} color={colors.mutedForeground} />}
              title="Nothing to review"
              description="When a tenancy ends you can rate the landlord and the property here."
            />
          ) : (
            (pending.data ?? []).map((p) => (
              <Card key={p.id} padding={spacing.lg}>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {p.type === 'landlord'
                        ? (p.landlord ?? 'Your landlord')
                        : (p.property ?? 'Your home')}
                    </Text>
                    <Badge label={p.type === 'landlord' ? 'Landlord' : 'Property'} tone="info" />
                  </View>
                  <Text variant="caption" color="mutedForeground">
                    Tenancy ended {formatDate(p.moveOutDate)}
                  </Text>
                  <Button
                    label="Write a review"
                    size="sm"
                    onPress={() => setReviewing(p)}
                    style={{ marginTop: spacing.xs }}
                  />
                </View>
              </Card>
            ))
          )
        ) : tab === 'written' ? (
          (written.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={<Star size={30} color={colors.mutedForeground} />}
              title="No reviews yet"
              description="Reviews you write about landlords and properties appear here."
            />
          ) : (
            (written.data?.items ?? []).map(renderReview)
          )
        ) : (received.data?.items ?? []).length === 0 ? (
          <EmptyState
            icon={<Star size={30} color={colors.mutedForeground} />}
            title="No reviews about you"
            description="Landlords and agents can review you after a tenancy — these feed your trust score."
          />
        ) : (
          (received.data?.items ?? []).map(renderReview)
        )}
      </ScrollView>

      <SubmitReviewSheet
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        pending={reviewing}
      />
    </View>
  );
}
