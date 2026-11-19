import { useMemo, useState } from 'react';
import { RefreshControl, View } from 'react-native';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, UserCheck } from '@sureground/icons/native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { EnterpriseUpsell } from '@/components/estate/gate/GateUI';
import { ReasonSheet } from '@/components/homecare/ReasonSheet';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { AuthoriseRegularVisitorForm } from '@/components/estate/gate/AuthoriseRegularVisitorForm';
import { useEstate } from '@/hooks/useEstate';
import {
  CONTRACTOR_STATUS_TONE,
  WITHDRAW_REASON_MIN,
  estateGateApi,
  gateKeys,
  lacksTier,
  type ContractorPass,
  type ContractorPassStatus,
} from '@/lib/api/estateGate';
import { haptics } from '@/lib/haptics';
import { goBack } from '@/lib/goBack';
import { errorMessage } from '@/lib/api/client';

type Filter = ContractorPassStatus | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ACTIVE', label: 'In force' },
  { value: 'REVOKED', label: 'Withdrawn' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'all', label: 'All' },
];

const UPSELL_POINTS = [
  'Let a cleaner, driver or contractor keep coming back on one code',
  'Limit them to the days and hours you agree',
  'Every arrival still recorded as its own visit',
];

export default function EstateContractors() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [filter, setFilter] = useState<Filter>('ACTIVE');
  const [adding, setAdding] = useState(false);
  const [withdrawing, setWithdrawing] = useState<ContractorPass | null>(null);
  const locked = lacksTier(estate?.planTier);

  const query = useInfiniteQuery({
    queryKey: gateKeys.contractors(estateId, filter),
    queryFn: ({ pageParam }) =>
      estateGateApi.contractorPasses(estateId, {
        status: filter === 'all' ? undefined : filter,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
    placeholderData: keepPreviousData,
  });
  const items = useMemo<ContractorPass[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const withdraw = useMutation({
    mutationFn: (v: { pass: ContractorPass; reason: string }) =>
      estateGateApi.revokeContractorPass(estateId, v.pass.id, v.reason),
    onSuccess: (_p, v) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'contractors'] });
      toast.show(`${v.pass.name} will be refused at the gate from now on.`, 'success');
      setWithdrawing(null);
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw this authorisation.'), 'error'),
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => void query.refetch()}
      tintColor={colors.mutedForeground}
    />
  );

  const intro = locked ? (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
      <EnterpriseUpsell
        feature="Regular visitors"
        points={UPSELL_POINTS}
        current={estate?.planTier}
        estateName={estate?.name}
      />
      {items.length ? (
        <Text variant="caption" color="mutedForeground">
          Authorisations already granted run to their end date. You can still withdraw them.
        </Text>
      ) : null}
    </View>
  ) : (
    <Text variant="caption" color="mutedForeground" style={{ paddingBottom: spacing.md }}>
      Permission for somebody to keep arriving, like a cleaner on Tuesdays. They use their code at
      the gate like any visitor, and each arrival is still recorded as its own visit.
    </Text>
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
          eyebrow={estate?.name ?? 'Gate'}
          title="Regular visitors"
          subtitle={
            query.data
              ? `${total} ${total === 1 ? 'authorisation' : 'authorisations'}`
              : 'People allowed to keep coming back'
          }
          onBack={() => goBack()}
          accessory={
            locked ? undefined : (
              <IconButton
                accessibilityLabel="Authorise a regular visitor"
                disabled={!estateId}
                icon={<Plus size={20} color={colors.primary} />}
                onPress={() => setAdding(true)}
              />
            )
          }
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {FILTERS.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </View>
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height={132} radius={radius.lg} />
            ))}
          </View>
        }
      >
        <FlashList
          maintainVisibleContentPosition={{ disabled: true }}
          data={items}
          keyExtractor={(p) => p.id}
          refreshControl={refresh}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ListHeaderComponent={intro}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }: { item: ContractorPass }) => {
            const firm =
              [item.company, item.trade].filter(Boolean).join(' · ') || 'No firm recorded';
            return (
              <Card elevated style={{ gap: spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`${item.name}, ${item.statusLabel}. ${firm}${item.householdLabel ? `, for ${item.householdLabel}` : ''}. ${item.scheduleLabel}. ${item.visitCount} ${item.visitCount === 1 ? 'arrival' : 'arrivals'}.`}
                  style={{ gap: spacing.xs }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                      {item.name}
                    </Text>
                    <StatusPill
                      label={item.statusLabel}
                      tone={CONTRACTOR_STATUS_TONE[item.status] ?? 'neutral'}
                    />
                  </View>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {firm}
                    {item.householdLabel ? ` · ${item.householdLabel}` : ''}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {item.scheduleLabel}
                  </Text>
                  <Text variant="callout">
                    {item.visitCount} {item.visitCount === 1 ? 'arrival' : 'arrivals'} so far
                  </Text>
                  {item.revokeReason ? (
                    <Text variant="caption" color="mutedForeground">
                      Withdrawn because: {item.revokeReason}
                    </Text>
                  ) : null}
                </View>
                {item.status === 'ACTIVE' ? (
                  <Button
                    label="Withdraw"
                    size="sm"
                    variant="ghost"
                    accessibilityLabel={`Withdraw ${item.name}’s authorisation`}
                    onPress={() => setWithdrawing(item)}
                  />
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            locked ? null : (
              <EmptyState
                icon={<UserCheck size={34} color={colors.mutedForeground} />}
                title={filter === 'ACTIVE' ? 'Nobody is authorised to return' : 'Nothing here'}
                description="Authorise a cleaner, a driver or a contractor and they can be let in by code on the days you agree, without the household raising a pass each time."
                action={
                  filter === 'ACTIVE' ? (
                    <Button label="Authorise somebody" onPress={() => setAdding(true)} />
                  ) : undefined
                }
              />
            )
          }
        />
      </QueryState>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Authorise a regular visitor">
        {adding ? (
          <AuthoriseRegularVisitorForm
            estateId={estateId}
            estateName={estate?.name}
            createPass={(body) => estateGateApi.createContractorPass(estateId, body)}
            onCreated={() =>
              qc.invalidateQueries({
                queryKey: ['estate-manager', estateId, 'gate', 'contractors'],
              })
            }
            onDone={() => setAdding(false)}
          />
        ) : null}
      </Sheet>
      <ReasonSheet
        open={!!withdrawing}
        title={withdrawing ? `Withdraw ${withdrawing.name}’s authorisation` : ''}
        hint={`They’ll be refused at the gate from now on. The record and every arrival stay. Say why in at least ${WITHDRAW_REASON_MIN} characters, so it can be reviewed later.`}
        action="Withdraw"
        min={WITHDRAW_REASON_MIN}
        busy={withdraw.isPending}
        onClose={() => setWithdrawing(null)}
        onConfirm={(reason) => withdrawing && withdraw.mutate({ pass: withdrawing, reason })}
      />
    </View>
  );
}
