import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DoorOpen, Trash2 } from '@sureground/icons/native';
import {
  Button,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import type { AddressValue } from '@sureground/shared';
import { Sheet } from '@/components/Sheet';
import { AddressInput } from '@/components/forms/AddressInput';
import { estateGateApi, gateKeys, type Gate } from '@/lib/api/estateGate';
import { haptics } from '@/lib/haptics';
import { errorMessage } from '@/lib/api/client';

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
  // Saved as text; a picked place keeps its id here only so the field shows it as checked.
  const [place, setPlace] = useState<AddressValue | null>(null);
  // The API keeps up to 120 characters, as the typed field allowed.
  const location = (place?.text ?? '').trim().slice(0, 120);

  const gates = useQuery({
    queryKey: gateKeys.gates(estateId),
    queryFn: () => estateGateApi.gates(estateId),
    enabled: !!estateId,
  });

  const add = useMutation({
    mutationFn: () =>
      estateGateApi.addGate(estateId, {
        name: name.trim(),
        ...(location ? { location } : {}),
      }),
    onSuccess: (g) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.gates(estateId) });
      toast.show(`${g.name} added.`, 'success');
      setName('');
      setPlace(null);
    },
  });

  const remove = useMutation({
    mutationFn: (g: Gate) => estateGateApi.removeGate(estateId, g.id),
    onSuccess: (_v, g) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.gates(estateId) });
      toast.show(`${g.name} removed.`, 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not remove this gate.'), 'error'),
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
                disabled={remove.isPending && remove.variables?.id === g.id}
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
        required
        value={name}
        onChangeText={setName}
        maxLength={80}
        placeholder="e.g. Main gate"
      />
      <AddressInput
        label="Where it is (optional)"
        kind="any"
        allowManual
        value={place}
        onChange={setPlace}
        placeholder="e.g. Admiralty Way entrance"
      />
      {add.error ? (
        <FormAlert message={errorMessage(add.error, 'Could not add the gate.')} />
      ) : null}
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
