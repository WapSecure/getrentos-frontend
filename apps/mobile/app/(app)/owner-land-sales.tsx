import { useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReceiptText, Search } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ListSkeleton,
  PressableScale,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landSalesApi,
  plotName,
  PURCHASE_STATUS,
  PURCHASE_STATUSES,
  type EstateLayoutSummary,
  type PurchaseStatus,
  type PurchaseSummary,
} from '@/lib/api/landSales';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate, formatNaira } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const PAGE_SIZE = 20;
const ALL = 'all';

/** Plot purchases across the owner's estates: what is paid, owed and waiting on you. */
export default function OwnerLandSales() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ property?: string }>();
  const [layoutChoice, setLayoutChoice] = useState<string | null>(null);
  const [status, setStatus] = useState<PurchaseStatus | typeof ALL>(ALL);
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 300);

  const layouts = useQuery({ queryKey: qk.owner.landLayouts, queryFn: landSalesApi.layouts });
  // Opened from a parcel: start on that parcel's estate.
  const scoped = params.property
    ? layouts.data?.find((l) => l.propertyId === params.property)
    : undefined;
  const layoutId = layoutChoice ?? scoped?.id ?? ALL;
  const activeLayout = layouts.data?.find((l) => l.id === layoutId);
  const scope = layoutId === ALL ? '' : layoutId;
  const statusFilter = status === ALL ? '' : status;

  const collections = useQuery({
    queryKey: qk.owner.landCollections(scope),
    queryFn: () => landSalesApi.collections(scope || undefined),
  });
  const list = useInfiniteQuery({
    queryKey: qk.owner.landPurchases(statusFilter, scope, term),
    queryFn: ({ pageParam }) =>
      landSalesApi.purchases({
        page: pageParam,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        layoutId: scope || undefined,
        search: term || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const purchases = list.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = !!(statusFilter || scope || term);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Land"
        title="Plot sales"
        subtitle="What buyers have paid, what is owed, what waits on you"
        onBack={() => goBack()}
      />
      <QueryState
        query={list}
        skeleton={<ListSkeleton rows={3} variant="card" height={110} />}
        errorTitle="Purchases could not be loaded"
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={purchases}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              {(layouts.data ?? []).length > 1 ? (
                <ChipSelect
                  label="Estate"
                  options={[
                    { value: ALL, label: 'All estates' },
                    ...(layouts.data ?? []).map((l) => ({
                      value: l.id,
                      label: l.access === 'MANDATE' ? `${l.name} (mandate)` : l.name,
                    })),
                  ]}
                  value={layoutId}
                  onChange={setLayoutChoice}
                />
              ) : null}
              {activeLayout ? <EstateSummary layout={activeLayout} /> : null}
              {collections.data ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  <Tile
                    label="Collected"
                    amount={collections.data.collected}
                    hint={`${collections.data.purchaseCount} purchase${collections.data.purchaseCount === 1 ? '' : 's'}`}
                  />
                  <Tile
                    label="Held until confirmed"
                    amount={collections.data.heldInEscrow}
                    hint="Released as buyers confirm steps"
                  />
                  <Tile label="Released to you" amount={collections.data.releasedToSeller} />
                  <Tile
                    label="Outstanding"
                    amount={collections.data.outstanding}
                    hint={`${collections.data.activeCount} paying now`}
                  />
                </View>
              ) : null}
              <ChipSelect
                label="Status"
                options={[
                  { value: ALL, label: 'All' },
                  ...PURCHASE_STATUSES.map((s) => ({ value: s, label: PURCHASE_STATUS[s].label })),
                ]}
                value={status}
                onChange={setStatus}
              />
              <TextField
                placeholder="Reference, plot or buyer"
                value={search}
                onChangeText={setSearch}
                leftIcon={<Search size={16} color={colors.mutedForeground} />}
                accessibilityLabel="Search purchases"
                autoCorrect={false}
              />
            </View>
          }
          renderItem={({ item }: { item: PurchaseSummary }) => <PurchaseRow purchase={item} />}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => {
                list.refetch();
                collections.refetch();
              }}
              tintColor={colors.mutedForeground}
            />
          }
          // The filters live in the header, so an empty result stays inside the list.
          ListEmptyComponent={
            <EmptyState
              icon={<ReceiptText size={32} color={colors.mutedForeground} />}
              title={filtered ? 'No purchases match' : 'No plot purchases yet'}
              description={
                filtered
                  ? 'Try another status, estate or search.'
                  : 'When a buyer reserves a plot on one of your estates, it shows here.'
              }
            />
          }
        />
      </QueryState>
    </View>
  );
}

function Tile({ label, amount, hint }: { label: string; amount: number; hint?: string }) {
  const { spacing } = useTheme();
  return (
    <Card padding={spacing.md} style={{ flexBasis: '47%', flexGrow: 1, gap: 2 }}>
      <Text variant="caption" color="mutedForeground">
        {label}
      </Text>
      <Price amount={amount} variant="bodyStrong" />
      {hint ? (
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

function EstateSummary({ layout: l }: { layout: EstateLayoutSummary }) {
  const { spacing } = useTheme();
  const figures = [
    ['Available', l.plots.available],
    ['Reserved', l.plots.reserved],
    ['Paying', l.plots.underInstallment],
    ['Sold', l.plots.sold + l.plots.allocated],
    ['Withheld', l.plots.withheld],
  ] as const;
  return (
    <Card padding={spacing.md} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {l.name}
        </Text>
        {l.access === 'MANDATE' ? <Badge label="Selling under mandate" tone="info" /> : null}
      </View>
      <Text variant="caption" color="mutedForeground">
        {l.propertyTitle} · {l.city}, {l.state} · {l.plots.total} plots
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {figures.map(([label, value]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <Text variant="bodyStrong">{value}</Text>
            <Text variant="caption" color="mutedForeground">
              {label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function PurchaseRow({ purchase: p }: { purchase: PurchaseSummary }) {
  const { colors, spacing, radius } = useTheme();
  const status = PURCHASE_STATUS[p.status] ?? { label: p.status, tone: 'neutral' as const };
  const share = p.totalPrice > 0 ? Math.min(100, (p.amountPaid / p.totalPrice) * 100) : 0;
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/owner-land-purchase/${p.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${p.reference}, ${plotName(p)}, ${status.label}`}
      style={{ marginBottom: spacing.sm }}
    >
      <Card padding={spacing.lg} style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {p.reference}
          </Text>
          <Badge label={status.label} tone={status.tone} />
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {plotName(p)} · {p.layoutName} · {p.buyerName ?? 'Buyer'}
        </Text>
        <Text variant="callout">
          {formatNaira(p.amountPaid)}
          <Text variant="callout" color="mutedForeground">
            {' '}
            of {formatNaira(p.totalPrice)} · {p.planName}
          </Text>
        </Text>
        <View
          style={{
            height: 5,
            borderRadius: radius.full,
            backgroundColor: colors.secondary,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: `${share}%`, height: '100%', backgroundColor: colors.success }} />
        </View>
        {p.nextDue ? (
          <Text
            variant="caption"
            style={{ color: p.nextDue.overdue ? colors.destructive : colors.mutedForeground }}
          >
            {formatNaira(p.nextDue.amount)} {p.nextDue.overdue ? 'overdue since' : 'due'}{' '}
            {formatDate(p.nextDue.dueDate, 'short')}
          </Text>
        ) : null}
      </Card>
    </PressableScale>
  );
}
