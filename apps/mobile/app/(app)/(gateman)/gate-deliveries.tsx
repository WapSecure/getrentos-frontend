import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ImagePlus, Package, Plus, X } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi, type DeliveryCodeScreen, type Household } from '@/lib/api/gateman';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

const HOUSEHOLD_PAGE_SIZE = 100;

export default function GatemanDeliveries() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [logOpen, setLogOpen] = useState(false);

  const { estate, isLoading: isPostLoading } = useGatemanPost();

  const gatesQuery = useQuery({
    queryKey: qk.gateman.gates(estate?.id ?? ''),
    queryFn: () => gatemanApi.listGates(estate!.id),
    enabled: !!estate,
  });
  const gates = gatesQuery.data ?? [];

  const awaitingQuery = useQuery({
    queryKey: qk.gateman.deliveries(estate?.id ?? ''),
    queryFn: () => gatemanApi.listDeliveries(estate!.id, 'received', 1, 100),
    enabled: !!estate,
  });
  const awaiting = awaitingQuery.data?.items ?? [];

  const householdsQuery = useQuery({
    queryKey: qk.gateman.households(estate?.id ?? ''),
    queryFn: () => gatemanApi.listHouseholds(estate!.id, 1, HOUSEHOLD_PAGE_SIZE),
    enabled: !!estate && logOpen,
  });
  const households = householdsQuery.data?.items ?? [];

  const invalidateDeliveries = () => {
    if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.deliveries(estate.id) });
  };

  const logDelivery = useMutation({
    mutationFn: (data: {
      householdId?: string;
      /**
       * The code the household sent its courier. When present the server derives
       * the household from it, and the parcel is recorded against that household
       * rather than one the guard picked.
       */
      code?: string;
      courier?: string;
      recipientName?: string;
      gateId?: string;
      photo?: PickedFile;
    }) => gatemanApi.logDelivery(estate!.id, data),
    onSuccess: () => {
      void haptics.success();
      invalidateDeliveries();
      setLogOpen(false);
    },
    onError: (error) =>
      toast.show(error instanceof Error ? error.message : 'Could not log that delivery.', 'error'),
  });

  const markCollected = useMutation({
    mutationFn: (logId: string) => gatemanApi.markDeliveryCollected(estate!.id, logId),
    onSuccess: () => invalidateDeliveries(),
    onError: () => toast.show("Couldn't mark that as collected. Try again.", 'error'),
  });

  if (isPostLoading) {
    return (
      <Screen>
        <Skeleton height={140} radius={16} />
      </Screen>
    );
  }

  if (!estate) {
    return (
      <Screen>
        <EmptyState
          icon={<Package size={34} color={colors.mutedForeground} />}
          title="No gate assigned yet"
          description="Your estate manager hasn't posted you to a gate yet."
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={awaitingQuery.isRefetching} onRefresh={awaitingQuery.refetch}>
      <DashboardHeader
        eyebrow="Gate operations"
        title="Deliveries"
        subtitle={`${estate.name} · Receive and release household parcels`}
      />

      <Button
        label="Log Delivery"
        fullWidth
        icon={<Plus size={16} color={colors.primaryForeground} />}
        onPress={() => setLogOpen(true)}
      />

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title={`Awaiting pickup (${awaiting.length})`}
          description="Parcels still held at the gate"
        />
        {awaitingQuery.isLoading ? (
          <Skeleton height={64} radius={16} />
        ) : awaiting.length === 0 ? (
          <Card>
            <Text variant="caption" color="mutedForeground">
              No deliveries awaiting pickup.
            </Text>
          </Card>
        ) : (
          awaiting.map((log) => (
            <Card key={log.id} elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing.md,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{log.unitLabel}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {log.residentName}
                    {log.courier ? ` · ${log.courier}` : ''}
                    {log.recipientName ? ` · for ${log.recipientName}` : ''}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    Received {formatTime(log.receivedAt)}
                  </Text>
                </View>
                <Button
                  label="Collected"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={markCollected.isPending}
                  onPress={() => markCollected.mutate(log.id)}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      <LogDeliverySheet
        open={logOpen}
        estateId={estate.id}
        onClose={() => setLogOpen(false)}
        households={households}
        householdsLoading={householdsQuery.isLoading}
        gates={gates}
        submitting={logDelivery.isPending}
        onSubmit={(d) => logDelivery.mutate(d)}
      />
    </Screen>
  );
}

/**
 * Logging a parcel, by one of two routes.
 *
 * The guard either picks the household from a list: because the courier said a
 * name and the guard recognised it: or the courier reads out the code the
 * household sent them, in which case the household names itself.
 *
 * The shell is thin on purpose: the form is only mounted while the sheet is
 * open, so the next opening cannot inherit the last one's household, photo or an
 * already-spent code. The screen's mutation closes the sheet itself on success
 * and never calls `onClose`, so clearing the fields there was never going to
 * cover that case.
 */
function LogDeliverySheet({
  open,
  estateId,
  onClose,
  households,
  householdsLoading,
  gates,
  submitting,
  onSubmit,
}: {
  open: boolean;
  estateId: string;
  onClose: () => void;
  households: Household[];
  householdsLoading: boolean;
  gates: { id: string; name: string }[];
  submitting: boolean;
  onSubmit: (data: {
    householdId?: string;
    code?: string;
    courier?: string;
    recipientName?: string;
    gateId?: string;
    photo?: PickedFile;
  }) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Log a delivery">
      {open ? (
        <LogDeliveryForm
          estateId={estateId}
          households={households}
          householdsLoading={householdsLoading}
          gates={gates}
          submitting={submitting}
          onSubmit={onSubmit}
        />
      ) : null}
    </Sheet>
  );
}

function LogDeliveryForm({
  estateId,
  households,
  householdsLoading,
  gates,
  submitting,
  onSubmit,
}: {
  estateId: string;
  households: Household[];
  householdsLoading: boolean;
  gates: { id: string; name: string }[];
  submitting: boolean;
  onSubmit: (data: {
    householdId?: string;
    code?: string;
    courier?: string;
    recipientName?: string;
    gateId?: string;
    photo?: PickedFile;
  }) => void;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [code, setCode] = useState('');
  const [screen, setScreen] = useState<DeliveryCodeScreen | null>(null);
  const [courier, setCourier] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const matched = screen?.matched === true;

  const checkCode = useMutation({
    mutationFn: () => gatemanApi.verifyDeliveryCode(estateId, code.trim()),
    onSuccess: (result) => {
      setScreen(result);
      if (result.matched) {
        void haptics.success();
        // Pre-filled from what the household already told the estate, so the
        // guard is not retyping it at a barrier.
        if (result.courier) setCourier((current) => current || result.courier!);
      }
    },
    onError: (error) =>
      toast.show(
        error instanceof Error ? error.message : 'Could not check that code just now.',
        'error'
      ),
  });

  // Estates can hold hundreds of households; the picker fetches one page and
  // narrows locally rather than round-tripping on every keystroke.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter(
      (h) => h.unitLabel.toLowerCase().includes(q) || h.residentName.toLowerCase().includes(q)
    );
  }, [households, search]);

  const attachPhoto = async (from: 'camera' | 'library') => {
    const picked = from === 'camera' ? await capturePhoto() : await pickPhoto();
    if (picked) setPhoto(picked);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <TextField
          label="Courier's code"
          value={code}
          onChangeText={(next) => {
            setCode(next);
            // Any edit clears the last answer: a stale "this is for Block C"
            // beside a code the guard has since changed is worse than nothing.
            if (screen) setScreen(null);
          }}
          placeholder="The six digits the household sent"
          keyboardType="number-pad"
          hint="Optional: use it instead of picking a household"
        />
        <Button
          label={checkCode.isPending ? 'Checking…' : 'Check code'}
          variant="outline"
          size="sm"
          fullWidth={false}
          loading={checkCode.isPending}
          disabled={code.trim().length < 6}
          onPress={() => checkCode.mutate()}
        />

        {matched ? (
          <Card>
            <View style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Check size={16} color={colors.primary} />
                <Text variant="bodyStrong">{screen?.unitLabel}</Text>
              </View>
              <Text variant="caption" color="mutedForeground">
                {screen?.message}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {screen?.instruction}
              </Text>
            </View>
          </Card>
        ) : screen ? (
          // Rendered as the server wrote it, never interpreted: one wording
          // covers every way a code can fail, so this screen cannot be used to
          // work out whether a household exists here.
          <Card>
            <Text variant="caption" color="mutedForeground">
              {screen.message} {screen.instruction}
            </Text>
          </Card>
        ) : null}

        <Text variant="caption" color="mutedForeground">
          Checking a code does not use it up. Only taking the parcel in does.
        </Text>
      </View>

      {matched ? (
        <Text variant="caption" color="mutedForeground">
          This parcel will be recorded against {screen?.unitLabel}.
        </Text>
      ) : (
        <>
          <TextField
            label="Find household"
            value={search}
            onChangeText={setSearch}
            placeholder="Unit or resident name"
            leftIcon={<Package size={16} color={colors.mutedForeground} />}
          />

          <View style={{ gap: spacing.sm }}>
            {householdsLoading ? (
              <Skeleton height={56} radius={12} />
            ) : filtered.length === 0 ? (
              <Text variant="caption" color="mutedForeground">
                {households.length === 0
                  ? 'No active households on this estate yet.'
                  : 'No household matches that search.'}
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 220 }} contentContainerStyle={{ gap: spacing.sm }}>
                {filtered.map((h) => {
                  const selected = householdId === h.id;
                  return (
                    <Pressable
                      key={h.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setHouseholdId(h.id)}
                    >
                      <Card elevated={selected}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing.md,
                          }}
                        >
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text variant="bodyStrong">{h.unitLabel}</Text>
                            <Text variant="caption" color="mutedForeground">
                              {h.residentName}
                              {h.residentLinked ? '' : ' · not on the app'}
                            </Text>
                          </View>
                          {selected ? <Check size={18} color={colors.primary} /> : null}
                        </View>
                      </Card>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </>
      )}

      <TextField
        label="Courier"
        value={courier}
        onChangeText={setCourier}
        placeholder="e.g. GIG, DHL"
        hint="Optional"
      />

      <TextField
        label="Recipient"
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder="Who is it for?"
        hint="Optional"
      />

      {gates.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
            Gate
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Chip label="Not specified" selected={gateId === ''} onPress={() => setGateId('')} />
            {gates.map((gate) => (
              <Chip
                key={gate.id}
                label={gate.name}
                selected={gateId === gate.id}
                onPress={() => setGateId(gate.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
          Photo{' '}
          <Text variant="caption" color="mutedForeground">
            (optional)
          </Text>
        </Text>
        {photo ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}
          >
            <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
              {photo.name}
            </Text>
            <Button
              label="Remove"
              variant="ghost"
              size="sm"
              fullWidth={false}
              icon={<X size={14} color={colors.foreground} />}
              onPress={() => setPhoto(null)}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Camera"
              variant="outline"
              size="sm"
              fullWidth={false}
              icon={<ImagePlus size={14} color={colors.foreground} />}
              onPress={() => void attachPhoto('camera')}
            />
            <Button
              label="Library"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => void attachPhoto('library')}
            />
          </View>
        )}
      </View>

      <Button
        label={submitting ? 'Logging…' : 'Log Delivery'}
        loading={submitting}
        fullWidth
        disabled={!matched && householdId.length === 0}
        onPress={() =>
          onSubmit({
            // A verified code is sent INSTEAD of a household, never alongside
            // one: a guard holding a code does not get to overrule it.
            ...(matched ? { code: code.trim() } : { householdId }),
            courier: courier.trim() || undefined,
            recipientName: recipientName.trim() || undefined,
            gateId: gateId || undefined,
            photo: photo ?? undefined,
          })
        }
      />
    </View>
  );
}
