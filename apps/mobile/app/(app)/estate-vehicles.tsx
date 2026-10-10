import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, Plus, Settings2 } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  SegmentedControl,
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
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import type { PickedFile } from '@/lib/api/documents';
import {
  VEHICLE_PURPOSES,
  estateGateApi,
  gateKeys,
  vehiclePurposeLabel,
  type VehicleLog,
  type VehiclePurpose,
} from '@/lib/api/estateGate';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';

type View_ = 'inside' | 'all';

const when = (iso: string) => `${formatDate(iso, 'short')}, ${formatTime(iso)}`;

/**
 * Vehicles through the estate's gates: who drove in, and whether they have
 * left. The office can log one itself and mark one as gone; the guard's
 * console writes to the same log.
 */
export default function EstateVehicles() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<View_>('inside');
  const [logging, setLogging] = useState(false);
  const [managingGates, setManagingGates] = useState(false);

  const query = useInfiniteQuery({
    queryKey: gateKeys.vehicles(estateId, view),
    queryFn: ({ pageParam }) =>
      estateGateApi.vehicleLogs(estateId, { open: view === 'inside', page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: !!estateId,
  });
  const items = useMemo<VehicleLog[]>(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  );
  const total = query.data?.pages[0]?.total ?? 0;

  const exit = useMutation({
    mutationFn: (log: VehicleLog) => estateGateApi.markVehicleExited(estateId, log.id),
    onSuccess: (_l, log) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'vehicles'] });
      toast.show(`${log.plateNumber} marked as left.`, 'success');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'vehicles'] });
      toast.show(errorText(e, 'Could not mark this vehicle as left.'), 'error');
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
          title="Vehicles"
          subtitle={
            query.data
              ? view === 'inside'
                ? `${total} inside right now`
                : `${total.toLocaleString('en-NG')} logged`
              : 'Cars in and out of the estate'
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
                accessibilityLabel="Log a vehicle"
                disabled={!estateId}
                icon={<Plus size={20} color={colors.primary} />}
                onPress={() => setLogging(true)}
              />
            </View>
          }
        />
        <SegmentedControl
          accessibilityLabel="Which vehicles"
          value={view}
          onChange={setView}
          options={[
            { value: 'inside', label: 'Inside now' },
            { value: 'all', label: 'All logs' },
          ]}
        />
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
          renderItem={({ item }: { item: VehicleLog }) => {
            const inside = !item.exitedAt;
            const who = [item.vehicleDescription, item.driverName].filter(Boolean).join(' · ');
            return (
              <Card elevated style={{ gap: spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`${item.plateNumber}${who ? `, ${who}` : ''}, ${vehiclePurposeLabel(item.purpose)}. ${inside ? 'Inside' : 'Left'}. Entered ${when(item.enteredAt)}${item.gateName ? ` at ${item.gateName}` : ''}.`}
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
                      <Car size={22} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                        {item.plateNumber}
                      </Text>
                      <StatusPill
                        label={inside ? 'Inside' : 'Left'}
                        tone={inside ? 'success' : 'neutral'}
                      />
                    </View>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {who ? `${who} · ` : ''}
                      {vehiclePurposeLabel(item.purpose)}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      In {when(item.enteredAt)}
                      {item.gateName ? ` · ${item.gateName}` : ''}
                      {item.exitedAt ? ` · out ${when(item.exitedAt)}` : ''}
                    </Text>
                  </View>
                </View>
                {inside ? (
                  <Button
                    label="Mark as left"
                    size="sm"
                    variant="ghost"
                    loading={exit.isPending && exit.variables?.id === item.id}
                    accessibilityLabel={`Mark ${item.plateNumber} as left the estate`}
                    onPress={() =>
                      Alert.alert(
                        `Has ${item.plateNumber} left?`,
                        'It comes off the list of vehicles inside. This can’t be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Mark as left', onPress: () => exit.mutate(item) },
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
              icon={<Car size={34} color={colors.mutedForeground} />}
              title={view === 'inside' ? 'No vehicles inside' : 'No vehicles logged yet'}
              description={
                view === 'inside'
                  ? 'Vehicles logged in at the gate and not yet marked as left appear here.'
                  : 'Every vehicle the gate or the office logs is kept here.'
              }
              action={<Button label="Log a vehicle" onPress={() => setLogging(true)} />}
            />
          }
        />
      )}

      <Sheet open={logging} onClose={() => setLogging(false)} title="Log a vehicle">
        {logging ? <LogVehicleForm estateId={estateId} onDone={() => setLogging(false)} /> : null}
      </Sheet>
      <GatesSheet
        open={managingGates}
        estateId={estateId}
        onClose={() => setManagingGates(false)}
      />
    </View>
  );
}

function LogVehicleForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [plate, setPlate] = useState('');
  const [description, setDescription] = useState('');
  const [driver, setDriver] = useState('');
  const [purpose, setPurpose] = useState<Uppercase<VehiclePurpose>>('VISITOR');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const gates = useQuery({
    queryKey: gateKeys.gates(estateId),
    queryFn: () => estateGateApi.gates(estateId),
    enabled: !!estateId,
  });

  const save = useMutation({
    mutationFn: () =>
      estateGateApi.logVehicle(estateId, {
        plateNumber: plate.trim().toUpperCase(),
        vehicleDescription: description.trim() || undefined,
        driverName: driver.trim() || undefined,
        purpose,
        gateId: gateId || undefined,
        photo: photo ?? undefined,
      }),
    onSuccess: (log) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: ['estate-manager', estateId, 'gate', 'vehicles'] });
      // A WATCH-level match admits the vehicle but the office should know.
      if (log.watchlistWarning) {
        Alert.alert('On the watch list', log.watchlistWarning);
      } else {
        toast.show(`${log.plateNumber} logged in.`, 'success');
      }
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Registration"
        value={plate}
        onChangeText={(v) => setPlate(v.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={20}
        placeholder="e.g. LND 123 XY"
        hint="Checked against the estate’s watch list"
      />
      <TextField
        label="Vehicle (optional)"
        value={description}
        onChangeText={setDescription}
        maxLength={120}
        placeholder="e.g. Black Camry"
      />
      <TextField
        label="Driver (optional)"
        value={driver}
        onChangeText={setDriver}
        maxLength={120}
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Purpose</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VEHICLE_PURPOSES.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              selected={purpose === p.value}
              onPress={() => setPurpose(p.value)}
            />
          ))}
        </View>
      </View>
      <GateChoice gates={gates.data} value={gateId} onChange={setGateId} />
      <PhotoField value={photo} onChange={setPhoto} />
      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not log this vehicle.')} />
      ) : null}
      <Button
        label="Log vehicle"
        disabled={plate.trim().length < 2}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
