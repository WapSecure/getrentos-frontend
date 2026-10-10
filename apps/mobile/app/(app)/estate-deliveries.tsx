import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Package, Plus, Settings2 } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { GateChoice, PhotoField } from '@/components/estate/gate/GateUI';
import { GatesSheet } from '@/components/estate/gate/GatesSheet';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import type { PickedFile } from '@/lib/api/documents';
import {
  DELIVERY_STATUS,
  estateGateApi,
  gateKeys,
  type DeliveryCodeScreen,
  type DeliveryLog,
  type DeliveryLogStatus,
} from '@/lib/api/estateGate';
import type { Household } from '@/lib/api/estateManager';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';

type Filter = DeliveryLogStatus | 'all';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'received', label: 'Awaiting pickup' },
  { value: 'collected', label: 'Collected' },
  { value: 'all', label: 'All' },
];

const when = (iso: string) => `${formatDate(iso, 'short')}, ${formatTime(iso)}`;

/**
 * Parcels taken in at the gate for households, from the office's side: what is
 * still waiting to be picked up, and what was collected. (Residents see their
 * own parcels on a separate screen.)
 */
export default function EstateDeliveries() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [filter, setFilter] = useState<Filter>('received');
  const [logging, setLogging] = useState(false);
  const [managingGates, setManagingGates] = useState(false);

  const query = useInfiniteQuery({
    queryKey: gateKeys.deliveries(estateId, filter),
    queryFn: ({ pageParam }) =>
      estateGateApi.deliveries(estateId, {
        status: filter === 'all' ? undefined : filter,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<DeliveryLog[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const collect = useMutation({
    mutationFn: (log: DeliveryLog) => estateGateApi.markDeliveryCollected(estateId, log.id),
    onSuccess: (_l, log) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'deliveries'] });
      toast.show(`Parcel for ${log.unitLabel} marked as collected.`, 'success');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'deliveries'] });
      toast.show(errorText(e, 'Could not mark this parcel as collected.'), 'error');
    },
  });

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
        <DetailHeader
          eyebrow={estate?.name ?? 'Gate'}
          title="Deliveries"
          subtitle={
            query.data
              ? filter === 'received'
                ? `${total} waiting to be picked up`
                : `${total.toLocaleString('en-NG')} parcel${total === 1 ? '' : 's'}`
              : 'Parcels taken in at the gate'
          }
          onBack={() => router.back()}
          accessory={
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <IconButton
                accessibilityLabel="Manage gates"
                disabled={!estateId}
                icon={<Settings2 size={20} color={colors.primary} />}
                onPress={() => setManagingGates(true)}
              />
              <IconButton
                accessibilityLabel="Log a delivery"
                disabled={!estateId}
                icon={<Plus size={20} color={colors.primary} />}
                onPress={() => setLogging(true)}
              />
            </View>
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
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={104} radius={radius.lg} />
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
          renderItem={({ item }: { item: DeliveryLog }) => {
            const s = DELIVERY_STATUS[item.status] ?? {
              label: item.status,
              tone: 'neutral' as const,
            };
            const from = [item.courier, item.recipientName && `for ${item.recipientName}`]
              .filter(Boolean)
              .join(' · ');
            return (
              <Card elevated style={{ gap: spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`Parcel for ${item.unitLabel}, ${item.residentName}. ${s.label}. ${from ? `${from}. ` : ''}Received ${when(item.receivedAt)}${item.gateName ? ` at ${item.gateName}` : ''}.`}
                  style={{ flexDirection: 'row', gap: spacing.md }}
                >
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: item.photoUrl }}
                      contentFit="cover"
                      accessible={false}
                      style={{ width: 56, height: 56, borderRadius: radius.md }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Package size={22} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {item.unitLabel}
                      </Text>
                      <StatusPill label={s.label} tone={s.tone} />
                    </View>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {item.residentName}
                      {from ? ` · ${from}` : ''}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      In {when(item.receivedAt)}
                      {item.gateName ? ` · ${item.gateName}` : ''}
                      {item.collectedAt ? ` · collected ${when(item.collectedAt)}` : ''}
                    </Text>
                  </View>
                </View>
                {item.status === 'received' ? (
                  <Button
                    label="Mark collected"
                    size="sm"
                    variant="ghost"
                    loading={collect.isPending && collect.variables?.id === item.id}
                    accessibilityLabel={`Mark the parcel for ${item.unitLabel} as collected`}
                    onPress={() =>
                      Alert.alert(
                        `Collected by ${item.unitLabel}?`,
                        'Only once the household has the parcel. This can’t be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Mark collected', onPress: () => collect.mutate(item) },
                        ]
                      )
                    }
                  />
                ) : null}
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<Package size={34} color={colors.mutedForeground} />}
              title={
                filter === 'received'
                  ? 'Nothing waiting at the gate'
                  : filter === 'collected'
                    ? 'Nothing collected yet'
                    : 'No deliveries yet'
              }
              description="Parcels the gate takes in for a household appear here until they’re picked up."
              action={<Button label="Log a delivery" onPress={() => setLogging(true)} />}
            />
          }
        />
      )}

      <Sheet open={logging} onClose={() => setLogging(false)} title="Log a delivery">
        {logging ? <LogDeliveryForm estateId={estateId} onDone={() => setLogging(false)} /> : null}
      </Sheet>
      <GatesSheet
        open={managingGates}
        estateId={estateId}
        onClose={() => setManagingGates(false)}
      />
    </View>
  );
}

/**
 * Two ways to say whose parcel it is. The code the household sent its courier
 * comes first, because it names the household itself; picking from the list
 * relies on what was said at the barrier.
 */
function LogDeliveryForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [screen, setScreen] = useState<DeliveryCodeScreen | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [courier, setCourier] = useState('');
  const [recipient, setRecipient] = useState('');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);
  const matched = screen?.matched === true;

  const gates = useQuery({
    queryKey: gateKeys.gates(estateId),
    queryFn: () => estateGateApi.gates(estateId),
    enabled: !!estateId,
  });

  const check = useMutation({
    mutationFn: () => estateGateApi.verifyDeliveryCode(estateId, code.trim()),
    onSuccess: (result) => {
      setScreen(result);
      if (result.matched && result.courier) setCourier((c) => c || result.courier!);
    },
    onError: () => setScreen(null),
  });

  const save = useMutation({
    mutationFn: () =>
      estateGateApi.logDelivery(estateId, {
        // A verified code is sent instead of a household, never alongside one.
        ...(matched ? { code: code.trim() } : { householdId: household?.id }),
        courier: courier.trim() || undefined,
        recipientName: recipient.trim() || undefined,
        gateId: gateId || undefined,
        photo: photo ?? undefined,
      }),
    onSuccess: (log) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'deliveries'] });
      toast.show(`Parcel logged for ${log.unitLabel}.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
        <TextField
          label="Courier’s code (if they have one)"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            // Any edit voids the last answer: a stale match beside a new code is worse than none.
            if (screen) setScreen(null);
            if (check.error) check.reset();
          }}
          keyboardType="number-pad"
          maxLength={9}
          placeholder="e.g. 472913"
          containerStyle={{ flex: 1 }}
        />
        <Button
          label="Check"
          variant="secondary"
          disabled={code.replace(/\D/g, '').length < 6}
          loading={check.isPending}
          onPress={() => check.mutate()}
        />
      </View>
      {matched ? (
        <View
          accessible
          accessibilityLabel={`Code matches ${screen?.unitLabel}. ${screen?.message ?? ''}`}
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.successSubtle,
          }}
        >
          <CheckCircle2 size={18} color={colors.success} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{screen?.unitLabel}</Text>
            {screen?.residentName ? (
              <Text variant="caption" color="mutedForeground">
                {screen.residentName}
              </Text>
            ) : null}
            <Text variant="caption" color="mutedForeground">
              The parcel is recorded against this household, because the code is theirs.
            </Text>
          </View>
        </View>
      ) : screen ? (
        <FormAlert tone="warning" message={`${screen.message} ${screen.instruction}`} />
      ) : check.error ? (
        <FormAlert message={errorText(check.error, 'Could not check that code just now.')} />
      ) : (
        <Text variant="caption" color="mutedForeground">
          Checking a code doesn’t use it up. Only logging the parcel does.
        </Text>
      )}

      {matched ? null : (
        <HouseholdPicker
          estateId={estateId}
          value={household}
          onChange={setHousehold}
          label="Or choose the household"
        />
      )}
      <TextField
        label="Courier (optional)"
        value={courier}
        onChangeText={setCourier}
        maxLength={80}
        placeholder="e.g. DHL"
      />
      <TextField
        label="Addressed to (optional)"
        value={recipient}
        onChangeText={setRecipient}
        maxLength={120}
        placeholder="Name on the parcel"
      />
      <GateChoice gates={gates.data} value={gateId} onChange={setGateId} />
      <PhotoField value={photo} onChange={setPhoto} />
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not log this delivery.')} />
      ) : null}
      <Button
        label="Log delivery"
        disabled={!matched && !household}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
