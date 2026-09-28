import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays } from 'lucide-react-native';
import { EmptyState, ErrorState, SegmentedControl, Skeleton, useTheme } from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { hostShortletsApi, type BookingView, type HostBooking } from '@/lib/api/hostShortlets';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { StayCard } from '@/components/host/HostUI';

const VIEWS: { value: BookingView; label: string; empty: string }[] = [
  { value: 'requests', label: 'Requests', empty: 'No requests waiting. Nice.' },
  { value: 'upcoming', label: 'Upcoming', empty: 'No confirmed stays coming up.' },
  { value: 'past', label: 'Past', empty: 'Finished stays show up here.' },
  { value: 'cancelled', label: 'Cancelled', empty: 'Nothing cancelled or declined.' },
];

const isView = (v?: string): v is BookingView => VIEWS.some((x) => x.value === v);

export default function HostBookings() {
  const params = useLocalSearchParams<{ view?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<BookingView>(isView(params.view) ? params.view : 'requests');

  const query = useInfiniteQuery({
    queryKey: qk.host.bookings(view),
    queryFn: ({ pageParam }) => hostShortletsApi.bookings(view, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const meta = VIEWS.find((v) => v.value === view)!;

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
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
        <DetailHeader eyebrow="Hosting" title="Bookings" onBack={() => router.back()} />
        <SegmentedControl
          accessibilityLabel="Which bookings"
          value={view}
          onChange={setView}
          options={VIEWS.map(({ value, label }) => ({ value, label }))}
        />
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={132} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(b) => b.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: HostBooking }) => (
            <StayCard b={item} compact={view !== 'requests'} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<CalendarDays size={34} color={colors.mutedForeground} />}
              title={meta.label}
              description={meta.empty}
            />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={{ paddingTop: spacing.md }}>
                <Skeleton height={112} radius={radius.lg} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
