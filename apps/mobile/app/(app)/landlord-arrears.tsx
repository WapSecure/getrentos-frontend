import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, BellRing } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  Price,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi } from '@/lib/api/landlord';
import {
  arrearsStage,
  daysOverdue,
  noticesApi,
  type ArrearsPayment,
} from '@/lib/api/tenancyNotices';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { CollectionPlanCard } from '@/components/collections/CollectionPlanCard';

const PAGE_SIZE = 20;

/** Rent flagged overdue by the automatic arrears check, oldest first. */
export default function LandlordArrears() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const summary = useQuery({
    queryKey: qk.landlord.arrearsSummary,
    queryFn: landlordApi.arrearsSummary,
  });
  const list = useInfiniteQuery({
    queryKey: qk.notices.overdue,
    queryFn: ({ pageParam }) => noticesApi.overduePayments(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Rent"
        title="Arrears"
        subtitle="Overdue rent, oldest first"
        onBack={() => goBack()}
      />
      {list.isError && !list.data ? (
        <ErrorState
          title="Arrears are unavailable"
          description="We could not load overdue balances. No tenant status has been changed."
          onRetry={() => {
            list.refetch();
            summary.refetch();
          }}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              {summary.isLoading ? (
                <Skeleton height={86} radius={radius.md} />
              ) : summary.data ? (
                <Card padding={spacing.lg} style={{ gap: 4 }}>
                  <Text variant="caption" color="mutedForeground">
                    Total in arrears
                  </Text>
                  <Price amount={summary.data.totalOverdue} variant="title" />
                  <Text variant="caption" color="mutedForeground">
                    {summary.data.overdueCount} payment
                    {summary.data.overdueCount === 1 ? '' : 's'} overdue
                  </Text>
                </Card>
              ) : null}
              {items.length > 0 ? (
                <Button
                  label="Notices"
                  variant="outline"
                  icon={<BellRing size={16} color={colors.foreground} />}
                  onPress={() => router.push('/(app)/landlord-notices')}
                />
              ) : null}
              <CollectionPlanCard source={{ kind: 'rent' }} />
            </View>
          }
          renderItem={({ item }: { item: ArrearsPayment }) => <ArrearsRow payment={item} />}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => {
                list.refetch();
                summary.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            list.isLoading ? (
              <ListSkeleton rows={4} />
            ) : (
              <EmptyState
                icon={<AlertTriangle size={32} color={colors.mutedForeground} />}
                title="Nothing in arrears"
                description="Overdue rent appears here automatically once it passes its due date."
              />
            )
          }
        />
      )}
    </View>
  );
}

function ArrearsRow({ payment: p }: { payment: ArrearsPayment }) {
  const { spacing } = useTheme();
  const days = daysOverdue(p.dueDate);
  const stage = arrearsStage(days);
  const lateFee = p.category === 'late_fee';
  const paid = p.amountPaid ?? 0;
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {p.tenantName || 'Tenant'}
          </Text>
          <Text variant="caption" color="mutedForeground" numberOfLines={1}>
            {p.propertyName}
            {p.unitName ? ` (${p.unitName})` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Price amount={p.amount - paid} variant="bodyStrong" />
          {paid > 0 ? (
            <Text variant="caption" color="mutedForeground">
              of <Price amount={p.amount} variant="caption" />
            </Text>
          ) : null}
        </View>
      </View>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}
      >
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          {lateFee ? 'Late fee · ' : ''}Due {formatDate(p.dueDate, 'short')} · {days} day
          {days === 1 ? '' : 's'} overdue
        </Text>
        {p.lateFeeApplied ? <Badge label="Late fee added" tone="neutral" /> : null}
        {lateFee ? (
          <Badge label="Late fee" tone="danger" />
        ) : (
          <Badge label={stage.label} tone={stage.tone} />
        )}
      </View>
    </Card>
  );
}
