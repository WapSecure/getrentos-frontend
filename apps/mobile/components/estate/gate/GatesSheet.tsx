import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DoorOpen, Trash2 } from 'lucide-react-native';
import {
  Button,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { Sheet } from '@/components/Sheet';
import { estateGateApi, gateKeys, type Gate } from '@/lib/api/estateGate';
import { haptics } from '@/lib/haptics';

/**
 * The estate's gates: add one, or remove one it no longer uses. Small enough to
 * live in a sheet, reached from both the vehicle and the delivery logs.
 */
export function GatesSheet({
  open,
  estateId,
  onClose,
}: {
  open: boolean;
  estateId: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Gates">
      {open ? <GatesBody estateId={estateId} /> : null}
    </Sheet>
  );
}

function GatesBody({ estateId }: { estateId: string }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const gates = useQuery({
    queryKey: gateKeys.gates(estateId),
    queryFn: () => estateGateApi.gates(estateId),
    enabled: !!estateId,
  });

  const add = useMutation({
    mutationFn: () =>
      estateGateApi.addGate(estateId, {
        name: name.trim(),
        ...(location.trim() ? { location: location.trim() } : {}),
      }),
    onSuccess: (g) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.gates(estateId) });
      toast.show(`${g.name} added.`, 'success');
      setName('');
      setLocation('');
    },
  });

  const remove = useMutation({
    mutationFn: (g: Gate) => estateGateApi.removeGate(estateId, g.id),
    onSuccess: (_v, g) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.gates(estateId) });
      toast.show(`${g.name} removed.`, 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not remove this gate.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      {gates.isPending ? (
        <Skeleton height={96} radius={radius.md} />
      ) : !gates.data?.length ? (
        <Text variant="callout" color="mutedForeground">
          No gates named yet. Add them if the estate has more than one entrance, so every log says
          which one.
        </Text>
      ) : (
        <View style={{ gap: spacing.xs }}>
          {gates.data.map((g) => (
            <View
              key={g.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 }}
            >
              <DoorOpen size={18} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text variant="callout" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {g.name}
                </Text>
                {g.location ? (
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {g.location}
                  </Text>
                ) : null}
              </View>
              <IconButton
                accessibilityLabel={`Remove ${g.name}`}
                disabled={remove.isPending}
                icon={<Trash2 size={18} color={colors.destructive} />}
                onPress={() =>
                  Alert.alert(
                    `Remove ${g.name}?`,
                    'Logs already recorded at this gate will no longer say which gate it was.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(g) },
                    ]
                  )
                }
              />
            </View>
          ))}
        </View>
      )}
      <TextField
        label="New gate"
        value={name}
        onChangeText={setName}
        maxLength={80}
        placeholder="e.g. Main gate"
      />
      <TextField
        label="Where it is (optional)"
        value={location}
        onChangeText={setLocation}
        maxLength={120}
        placeholder="e.g. Admiralty Way entrance"
      />
      {add.error ? <FormAlert message={errorText(add.error, 'Could not add the gate.')} /> : null}
      <Button
        label="Add gate"
        variant="secondary"
        disabled={!name.trim()}
        loading={add.isPending}
        onPress={() => add.mutate()}
      />
    </View>
  );
}
