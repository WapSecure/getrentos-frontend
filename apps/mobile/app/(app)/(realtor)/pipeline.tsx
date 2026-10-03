import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Plus, Search, Users } from 'lucide-react-native';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  LEAD_STAGES,
  realtorApi,
  viewingBuckets,
  type LeadStatus,
  type RealtorLead,
  type RealtorViewing,
  type ViewingStatus,
} from '@/lib/api/realtor';
import { ApiError } from '@/lib/api/client';
import { haptics } from '@/lib/haptics';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  AddLeadSheet,
  LeadCard,
  ScheduleViewingSheet,
  ViewingRow,
} from '@/components/realtor/RealtorUI';

type Tab = 'leads' | 'viewings';

/** Leads by stage and the viewing diary, the two halves of a realtor's pipeline. */
export default function RealtorPipeline() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(params.tab === 'viewings' ? 'viewings' : 'leads');
  const [sheet, setSheet] = useState<'lead' | 'viewing' | null>(null);

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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>
            Pipeline
          </Text>
          <IconButton
            accessibilityLabel={tab === 'leads' ? 'Add a lead' : 'Book a viewing'}
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setSheet(tab === 'leads' ? 'lead' : 'viewing')}
          />
        </View>
        <SegmentedControl
          accessibilityLabel="Leads or viewings"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'leads', label: 'Leads' },
            { value: 'viewings', label: 'Viewings' },
          ]}
        />
      </View>
      {tab === 'leads' ? (
        <Leads onAdd={() => setSheet('lead')} />
      ) : (
        <Viewings onAdd={() => setSheet('viewing')} />
      )}
      <AddLeadSheet open={sheet === 'lead'} onClose={() => setSheet(null)} />
      <ScheduleViewingSheet open={sheet === 'viewing'} onClose={() => setSheet(null)} />
    </View>
  );
}

/* ---------------------------------- leads --------------------------------- */

type Filter = 'OPEN' | LeadStatus;

function Leads({ onAdd }: { onAdd: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 300);
  const status = filter === 'OPEN' ? undefined : filter;

  const query = useInfiniteQuery({
    queryKey: [...qk.realtor.leads(filter, term), 'infinite'],
    queryFn: ({ pageParam }) => realtorApi.leads({ status, search: term, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
  const items = useMemo<RealtorLead[]>(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    // "Open" hides won and lost so the list is what still needs work.
    return filter === 'OPEN'
      ? all.filter((l) => l.status !== 'CLOSED' && l.status !== 'LOST')
      : all;
  }, [query.data, filter]);

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching}
      onRefresh={() => query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  return (
    <>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingBottom: spacing.md }}>
        <TextField
          placeholder="Search name, phone or listing"
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={16} color={colors.mutedForeground} />}
          accessibilityLabel="Search leads"
          autoCapitalize="none"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip label="Open" selected={filter === 'OPEN'} onPress={() => setFilter('OPEN')} />
          {LEAD_STAGES.map((s) => (
            <Chip
              key={s.value}
              label={s.label}
              selected={filter === s.value}
              onPress={() => setFilter(s.value)}
            />
          ))}
        </ScrollView>
      </View>
      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={88} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: RealtorLead }) => <LeadCard lead={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<Users size={34} color={colors.mutedForeground} />}
              title={term ? 'No leads match' : filter === 'OPEN' ? 'No open leads' : 'Nobody here'}
              description={
                term
                  ? 'Try another name, number or listing.'
                  : 'Add people who ask about your listings, then move them along as you talk.'
              }
              action={term ? undefined : <Button label="Add a lead" onPress={onAdd} />}
            />
          }
        />
      )}
    </>
  );
}

/* -------------------------------- viewings -------------------------------- */

function Viewings({ onAdd }: { onAdd: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: qk.realtor.viewings, queryFn: () => realtorApi.viewings() });
  const [openedAt] = useState(() => Date.now());
  const buckets = useMemo(
    () => (query.data ? viewingBuckets(query.data.items) : null),
    [query.data]
  );

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ViewingStatus }) =>
      realtorApi.updateViewing(id, status),
    onSuccess: (_v, { status }) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['realtor'] });
      toast.show(
        status === 'CONFIRMED'
          ? 'Viewing confirmed.'
          : status === 'COMPLETED'
            ? 'Marked as done.'
            : 'Viewing cancelled.',
        'success'
      );
    },
    onError: (e) => toast.show(e instanceof ApiError ? e.message : 'Could not update it.', 'error'),
  });

  const act = (v: RealtorViewing) => {
    const live = v.status === 'REQUESTED' || v.status === 'CONFIRMED';
    if (!live) return;
    const past = new Date(v.scheduledAt).getTime() < openedAt;
    Alert.alert(v.listing.listingTitle || v.listing.property.title, v.lead?.fullName, [
      ...(v.status === 'REQUESTED' && !past
        ? [{ text: 'Confirm', onPress: () => update.mutate({ id: v.id, status: 'CONFIRMED' }) }]
        : []),
      { text: 'Mark as done', onPress: () => update.mutate({ id: v.id, status: 'COMPLETED' }) },
      {
        text: 'Cancel viewing',
        style: 'destructive' as const,
        onPress: () => update.mutate({ id: v.id, status: 'CANCELLED' }),
      },
      { text: 'Close', style: 'cancel' as const },
    ]);
  };

  const sections: { title: string; items: RealtorViewing[] }[] = buckets
    ? [
        { title: 'Today', items: buckets.today },
        { title: 'Coming up', items: buckets.upcoming },
        { title: 'Earlier', items: buckets.past.slice(0, 20) },
      ].filter((s) => s.items.length)
    : [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => query.refetch()}
          tintColor={colors.mutedForeground}
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing['3xl'],
        gap: spacing.lg,
      }}
    >
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        [0, 1, 2].map((i) => <Skeleton key={i} height={84} radius={radius.lg} />)
      ) : sections.length ? (
        sections.map((s) => (
          <View key={s.title} style={{ gap: spacing.sm }}>
            <Text variant="heading" accessibilityRole="header">
              {s.title}
            </Text>
            {s.items.map((v) => (
              <ViewingRow
                key={v.id}
                v={v}
                showDate={s.title !== 'Today'}
                onPress={
                  v.status === 'REQUESTED' || v.status === 'CONFIRMED' ? () => act(v) : undefined
                }
              />
            ))}
          </View>
        ))
      ) : (
        <EmptyState
          icon={<CalendarClock size={34} color={colors.mutedForeground} />}
          title="No viewings booked"
          description="Book a viewing for a lead and it shows up here on the day."
          action={<Button label="Book a viewing" onPress={onAdd} />}
        />
      )}
    </ScrollView>
  );
}
