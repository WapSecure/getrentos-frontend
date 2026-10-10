import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, UserCheck } from 'lucide-react-native';
import {
  Button,
  Card,
  Checkbox,
  Chip,
  DateField,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { EnterpriseUpsell, OneTimeCode } from '@/components/estate/gate/GateUI';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import { ReasonSheet } from '@/components/homecare/ReasonSheet';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  CONTRACTOR_STATUS_TONE,
  WEEK_DAYS,
  WITHDRAW_REASON_MIN,
  contractorDraftError,
  contractorPassBody,
  estateGateApi,
  gateKeys,
  lacksTier,
  planRefusal,
  toggleDay,
  type ContractorPass,
  type ContractorPassStatus,
  type IssuedContractorPass,
} from '@/lib/api/estateGate';
import type { Household } from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';

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

/**
 * Regular visitors: standing permission for somebody to keep arriving, not a
 * visit. Each arrival is still its own visitor pass, so "who is inside?" works
 * the same. Issuing one is Enterprise; authorisations already granted run to
 * their end on any plan, and can always be withdrawn.
 */
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
    onError: (e) => toast.show(errorText(e, 'Could not withdraw this authorisation.'), 'error'),
  });

  const refresh = (
    <RefreshControl
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={() => query.refetch()}
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
          onBack={() => router.back()}
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

      {query.isError && !query.data ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={refresh}>
          <ErrorState onRetry={() => query.refetch()} />
        </ScrollView>
      ) : query.isPending ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={132} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
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
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Authorise a regular visitor">
        {adding ? (
          <AuthoriseForm
            estateId={estateId}
            estateName={estate?.name}
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

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

function AuthoriseForm({
  estateId,
  estateName,
  onDone,
}: {
  estateId: string;
  estateName?: string;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState('');
  const [validFrom, setValidFrom] = useState(() => addDays(0));
  const [validUntil, setValidUntil] = useState(() => addDays(182));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [restrictHours, setRestrictHours] = useState(false);
  const [dailyFrom, setDailyFrom] = useState('08:00');
  const [dailyTo, setDailyTo] = useState('17:00');
  const [issued, setIssued] = useState<IssuedContractorPass | null>(null);

  const draft = {
    householdId: household?.id,
    name,
    phone,
    company,
    trade,
    validFrom,
    validUntil,
    daysOfWeek,
    restrictHours,
    dailyFrom,
    dailyTo,
  };
  const problem = contractorDraftError(draft);

  const create = useMutation({
    mutationFn: () => estateGateApi.createContractorPass(estateId, contractorPassBody(draft)),
    onSuccess: (pass) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'contractors'] });
      setIssued(pass);
    },
  });
  const refusal = planRefusal(create.error);

  if (issued) {
    return (
      <OneTimeCode
        title={`Code for ${issued.name}`}
        code={issued.pin}
        qrDataUrl={issued.qrDataUrl}
        notes={[
          issued.scheduleLabel,
          'Shown only now. Send it to them before you close this; it can’t be read back.',
        ]}
        shareMessage={`Your gate code${estateName ? ` for ${estateName}` : ''} is ${issued.pin}. ${issued.scheduleLabel}. Show it at the gate each time you arrive.`}
        onDone={onDone}
      />
    );
  }

  if (refusal) {
    return (
      <EnterpriseUpsell
        feature="Regular visitors"
        points={UPSELL_POINTS}
        current={refusal.current}
        estateName={estateName}
      />
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <HouseholdPicker
        estateId={estateId}
        value={household}
        onChange={setHousehold}
        label="Who are they working for"
      />
      <TextField
        label="Full name"
        value={name}
        onChangeText={setName}
        maxLength={120}
        placeholder="e.g. Chinedu Okafor"
      />
      <TextField
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={30}
        hint="With only a first name, a phone is needed to check them against the watch list"
      />
      <TextField
        label="Firm (optional)"
        value={company}
        onChangeText={setCompany}
        maxLength={120}
      />
      <TextField
        label="Trade (optional)"
        value={trade}
        onChangeText={setTrade}
        maxLength={80}
        placeholder="e.g. Electrician"
      />
      <DateField label="From" value={validFrom} onChange={setValidFrom} min={addDays(0)} />
      <DateField
        label="Until"
        value={validUntil}
        onChange={setValidUntil}
        min={validFrom}
        hint="At most a year, so it gets looked at again"
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Which days</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {WEEK_DAYS.map((d) => (
            <Chip
              key={d.value}
              label={d.short}
              selected={daysOfWeek.includes(d.value)}
              onPress={() => setDaysOfWeek((cur) => toggleDay(cur, d.value))}
            />
          ))}
        </View>
        <Text variant="caption" color="mutedForeground">
          {daysOfWeek.length
            ? 'They can only be let in on the days chosen.'
            : 'Any day. Choose days to limit them, e.g. Tuesdays only.'}
        </Text>
      </View>
      <Checkbox
        checked={restrictHours}
        onChange={setRestrictHours}
        label="Only during certain hours"
      />
      {restrictHours ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TimeField
              label="From"
              value={dailyFrom}
              onChange={setDailyFrom}
              startHour={0}
              endHour={24}
              containerStyle={{ flex: 1 }}
            />
            <TimeField
              label="To"
              value={dailyTo}
              onChange={setDailyTo}
              startHour={0}
              endHour={24}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <Text variant="caption" color="mutedForeground">
            On the estate’s clock. An end earlier than the start runs past midnight, for a night
            shift.
          </Text>
        </View>
      ) : null}
      {create.error ? (
        <FormAlert message={errorText(create.error, 'Could not create the authorisation.')} />
      ) : problem && name.trim() && household ? (
        <FormAlert tone="warning" message={problem} />
      ) : null}
      <Button
        label="Authorise"
        disabled={!!problem}
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
      <Text variant="caption" color="mutedForeground" center>
        Their gate code is shown once, after you authorise.
      </Text>
    </View>
  );
}
