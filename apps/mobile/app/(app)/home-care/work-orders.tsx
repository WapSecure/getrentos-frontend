import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Wrench } from 'lucide-react-native';
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  SegmentedControl,
  Skeleton,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi, type WorkOrder, type WorkOrderView } from '@/lib/api/homeCare';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { WorkOrderCard } from '@/components/homecare/WorkOrderCard';

const RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function WorkOrders() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<WorkOrderView>('open');

  // Open work spans three statuses; fetch them together and order by urgency.
  const open = useQuery({
    queryKey: qk.homeCare.workOrders('open'),
    queryFn: async () => {
      const [a, b, c] = await Promise.all([
        homeCareApi.workOrders('SUBMITTED'),
        homeCareApi.workOrders('ASSIGNED'),
        homeCareApi.workOrders('IN_PROGRESS'),
      ]);
      return [...a.items, ...b.items, ...c.items];
    },
    enabled: view === 'open',
  });
  const closed = useInfiniteQuery({
    queryKey: qk.homeCare.workOrders(view),
    queryFn: ({ pageParam }) =>
      homeCareApi.workOrders(view === 'resolved' ? 'RESOLVED' : 'CANCELLED', pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: view !== 'open',
  });

  const items = useMemo<WorkOrder[]>(() => {
    if (view !== 'open') return closed.data?.pages.flatMap((p) => p.items) ?? [];
    return [...(open.data ?? [])].sort(
      (a, b) =>
        Number(!!b.isEmergency) - Number(!!a.isEmergency) ||
        (RANK[a.priority] ?? 9) - (RANK[b.priority] ?? 9) ||
        (a.resolutionDueAt ?? '9').localeCompare(b.resolutionDueAt ?? '9')
    );
  }, [view, open.data, closed.data]);

  const active = view === 'open' ? open : closed;
  const refresh = (
    <RefreshControl
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          gap: spacing.md,
        }}
      >
        <DetailHeader
          eyebrow="Home care"
          title="Work orders"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="New work order"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/home-care/new-work-order')}
            />
          }
        />
        <SegmentedControl
          accessibilityLabel="Which work orders"
          value={view}
          onChange={setView}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </View>
      {active.isError && !active.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => active.refetch()} />
        </ScrollView>
      ) : active.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(w) => w.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (view !== 'open' && closed.hasNextPage && !closed.isFetchingNextPage)
              void closed.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: WorkOrder }) => <WorkOrderCard w={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Wrench size={34} color={colors.mutedForeground} />}
              title={view === 'open' ? 'No open work orders' : `Nothing ${view}`}
              description={
                view === 'open'
                  ? 'Log a repair when something breaks. Tenants’ maintenance requests land here too.'
                  : 'Finished and cancelled jobs are kept here.'
              }
              action={
                view === 'open' ? (
                  <Button
                    label="New work order"
                    onPress={() => router.push('/(app)/home-care/new-work-order')}
                  />
                ) : undefined
              }
            />
          }
        />
      )}
    </View>
  );
}
