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
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { gatemanApi, type Household } from '@/lib/api/gateman';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';

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
      householdId: string;
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
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        <Text variant="title" center>
          {estate.name}
        </Text>
        <Text variant="callout" color="mutedForeground" center>
          Log a delivery for a household.
        </Text>
      </View>

      <Button
        label="Log Delivery"
        fullWidth
        icon={<Plus size={16} color={colors.primaryForeground} />}
        onPress={() => setLogOpen(true)}
      />

      <View style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">Awaiting pickup ({awaiting.length})</Text>
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

function LogDeliverySheet({
  open,
  onClose,
  households,
  householdsLoading,
  gates,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  households: Household[];
  householdsLoading: boolean;
  gates: { id: string; name: string }[];
  submitting: boolean;
  onSubmit: (data: {
    householdId: string;
    courier?: string;
    recipientName?: string;
    gateId?: string;
    photo?: PickedFile;
  }) => void;
}) {
  const { colors, spacing } = useTheme();
  const [search, setSearch] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [courier, setCourier] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  // Estates can hold hundreds of households; the picker fetches one page and
  // narrows locally rather than round-tripping on every keystroke.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter(
      (h) => h.unitLabel.toLowerCase().includes(q) || h.residentName.toLowerCase().includes(q)
    );
  }, [households, search]);

  const reset = () => {
    setSearch('');
    setHouseholdId('');
    setCourier('');
    setRecipientName('');
    setGateId('');
    setPhoto(null);
  };

  const attachPhoto = async (from: 'camera' | 'library') => {
    const picked = from === 'camera' ? await capturePhoto() : await pickPhoto();
    if (picked) setPhoto(picked);
  };

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Log a delivery"
    >
      <View style={{ gap: spacing.lg }}>
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
          disabled={!householdId}
          onPress={() => {
            onSubmit({
              householdId,
              courier: courier.trim() || undefined,
              recipientName: recipientName.trim() || undefined,
              gateId: gateId || undefined,
              photo: photo ?? undefined,
            });
            reset();
          }}
        />
      </View>
    </Sheet>
  );
}
