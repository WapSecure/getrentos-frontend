import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, ImagePlus, LogOut, X } from 'lucide-react-native';
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
import { gatemanApi, type VehiclePurpose } from '@/lib/api/gateman';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { formatTime } from '@/lib/format';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import { haptics } from '@/lib/haptics';

const PURPOSE_OPTIONS: { value: VehiclePurpose; label: string }[] = [
  { value: 'visitor', label: 'Visitor' },
  { value: 'resident', label: 'Resident' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'staff', label: 'Staff' },
  { value: 'other', label: 'Other' },
];

export default function GatemanVehicles() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleDescription, setVehicleDescription] = useState('');
  const [driverName, setDriverName] = useState('');
  const [purpose, setPurpose] = useState<VehiclePurpose>('visitor');
  const [gateId, setGateId] = useState('');
  const [photo, setPhoto] = useState<PickedFile | null>(null);

  const estateQuery = useQuery({
    queryKey: qk.gateman.myEstate,
    queryFn: () => gatemanApi.getMyEstate(),
  });
  const estate = estateQuery.data ?? null;

  const gatesQuery = useQuery({
    queryKey: qk.gateman.gates(estate?.id ?? ''),
    queryFn: () => gatemanApi.listGates(estate!.id),
    enabled: !!estate,
  });
  const gates = gatesQuery.data ?? [];

  const insideQuery = useQuery({
    queryKey: qk.gateman.vehicleLogs(estate?.id ?? ''),
    queryFn: () => gatemanApi.listVehicleLogs(estate!.id, true, 1, 100),
    enabled: !!estate,
  });
  const inside = insideQuery.data?.items ?? [];

  const logEntry = useMutation({
    mutationFn: () =>
      gatemanApi.logVehicleEntry(estate!.id, {
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleDescription: vehicleDescription.trim() || undefined,
        driverName: driverName.trim() || undefined,
        purpose: purpose.toUpperCase() as Uppercase<VehiclePurpose>,
        gateId: gateId || undefined,
        photo: photo ?? undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      setPlateNumber('');
      setVehicleDescription('');
      setDriverName('');
      setPurpose('visitor');
      setGateId('');
      setPhoto(null);
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.vehicleLogs(estate.id) });
    },
    onError: (error) =>
      toast.show(error instanceof Error ? error.message : 'Could not log that vehicle.', 'error'),
  });

  const markExited = useMutation({
    mutationFn: (logId: string) => gatemanApi.markVehicleExited(estate!.id, logId),
    onSuccess: () => {
      if (estate) void qc.invalidateQueries({ queryKey: qk.gateman.vehicleLogs(estate.id) });
    },
    onError: () => toast.show("Couldn't log that exit. Try again.", 'error'),
  });

  const attachPhoto = async (from: 'camera' | 'library') => {
    const picked = from === 'camera' ? await capturePhoto() : await pickPhoto();
    if (picked) setPhoto(picked);
  };

  if (estateQuery.isLoading) {
    return (
      <Screen>
        <Skeleton height={280} radius={16} />
      </Screen>
    );
  }

  if (!estate) {
    return (
      <Screen>
        <EmptyState
          icon={<Car size={34} color={colors.mutedForeground} />}
          title="No gate assigned yet"
          description="Your estate manager hasn't posted you to a gate yet."
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={insideQuery.isRefetching} onRefresh={insideQuery.refetch}>
      <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.md }}>
        <Text variant="title" center>
          {estate.name}
        </Text>
        <Text variant="callout" color="mutedForeground" center>
          Log a vehicle entering the estate.
        </Text>
      </View>

      <Card elevated>
        <TextField
          label="Plate number"
          value={plateNumber}
          onChangeText={(t) => setPlateNumber(t.toUpperCase())}
          placeholder="ABC123XY"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
        />

        <TextField
          label="Description"
          value={vehicleDescription}
          onChangeText={setVehicleDescription}
          placeholder="e.g. Black Camry"
          hint="Optional"
        />

        <TextField
          label="Driver"
          value={driverName}
          onChangeText={setDriverName}
          placeholder="e.g. Tunde"
          hint="Optional"
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ marginLeft: 4 }}>
            Purpose
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {PURPOSE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={purpose === opt.value}
                onPress={() => setPurpose(opt.value)}
              />
            ))}
          </View>
        </View>

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
          label={logEntry.isPending ? 'Logging…' : 'Log Vehicle'}
          loading={logEntry.isPending}
          fullWidth
          disabled={!plateNumber.trim()}
          onPress={() => logEntry.mutate()}
          style={{ marginTop: spacing.xs }}
        />
      </Card>

      <View style={{ gap: spacing.md }}>
        <Text variant="bodyStrong">Currently inside ({inside.length})</Text>
        {insideQuery.isLoading ? (
          <Skeleton height={64} radius={16} />
        ) : inside.length === 0 ? (
          <Card>
            <Text variant="caption" color="mutedForeground">
              No vehicles currently logged inside.
            </Text>
          </Card>
        ) : (
          inside.map((log) => (
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
                  <Text variant="bodyStrong">{log.plateNumber}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {log.vehicleDescription || log.purpose} · entered {formatTime(log.enteredAt)}
                    {log.gateName ? ` · ${log.gateName}` : ''}
                  </Text>
                </View>
                <Button
                  label="Exit"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={markExited.isPending}
                  icon={<LogOut size={14} color={colors.foreground} />}
                  onPress={() => markExited.mutate(log.id)}
                />
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}
