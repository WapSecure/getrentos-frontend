import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { OneTimeCode } from '@/components/estate/gate/GateUI';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import {
  estateGateApi,
  gateKeys,
  retryUnlessPlanGate,
  type IssuedPatrolCheckpoint,
  type PatrolCheckpoint,
} from '@/lib/api/estateGate';
import { haptics } from '@/lib/haptics';

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/**
 * The places a patrol has to reach, each with a code printed and put up there.
 * The code is shown once, when minted, and never again; a lost or seen code is
 * answered by giving the checkpoint a new one.
 */
export function PatrolCheckpoints({ estateId }: { estateId: string }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [issued, setIssued] = useState<IssuedPatrolCheckpoint | null>(null);

  const query = useQuery({
    queryKey: gateKeys.checkpoints(estateId),
    queryFn: () => estateGateApi.patrolCheckpoints(estateId),
    enabled: !!estateId,
    retry: retryUnlessPlanGate,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: gateKeys.checkpoints(estateId) });
    // Routes list their checkpoints, active or retired.
    qc.invalidateQueries({ queryKey: gateKeys.routes(estateId) });
  };

  const reissue = useMutation({
    mutationFn: (c: PatrolCheckpoint) => estateGateApi.reissuePatrolCheckpointCode(estateId, c.id),
    onSuccess: (c) => {
      void haptics.success();
      invalidate();
      setIssued(c);
    },
    onError: (e) => toast.show(errorText(e, 'Could not give this checkpoint a new code.'), 'error'),
  });

  const toggle = useMutation({
    mutationFn: (c: PatrolCheckpoint) =>
      estateGateApi.updatePatrolCheckpoint(estateId, c.id, { active: !c.active }),
    onSuccess: (c) => {
      void haptics.success();
      invalidate();
      toast.show(c.active ? `${c.name} is back in use.` : `${c.name} is retired.`, 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not update this checkpoint.'), 'error'),
  });

  const confirmReissue = (c: PatrolCheckpoint) =>
    Alert.alert(
      `Give ${c.name} a new code?`,
      'The code on the wall stops working straight away. Do this if the label is missing, or someone who shouldn’t have it has seen it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'New code', onPress: () => reissue.mutate(c) },
      ]
    );

  const confirmToggle = (c: PatrolCheckpoint) =>
    Alert.alert(
      c.active ? `Retire ${c.name}?` : `Put ${c.name} back in use?`,
      c.active
        ? 'It stops counting towards rounds and its code stops working. Every scan it has recorded is kept.'
        : 'It counts towards rounds again. Its old code works again too, so give it a new one if that code may have been seen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: c.active ? 'Retire' : 'Put back in use',
          style: c.active ? 'destructive' : 'default',
          onPress: () => toggle.mutate(c),
        },
      ]
    );

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="caption" color="mutedForeground">
        Somewhere a guard has to reach. Print the code and put it up there.
      </Text>
      <Button
        label="Add checkpoint"
        variant="secondary"
        icon={<Plus size={16} color={colors.foreground} />}
        disabled={!estateId}
        onPress={() => setAdding(true)}
      />
      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : !query.data.length ? (
        <EmptyState
          icon={<MapPin size={34} color={colors.mutedForeground} />}
          title="No checkpoints yet"
          description="Add the places a patrol must reach: the gate, the generator house, the back fence. Each one gets a code to print and put up."
        />
      ) : (
        query.data.map((c) => (
          <Card key={c.id} elevated style={{ gap: spacing.sm }}>
            <View
              accessible
              accessibilityLabel={`${c.name}${c.location ? `, ${c.location}` : ''}. ${c.active ? 'In use' : 'Retired'}. On ${plural(c.routeCount, 'round')}, scanned ${plural(c.scanCount, 'time')}.`}
              style={{ gap: 2 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {c.name}
                </Text>
                <StatusPill
                  label={c.active ? 'In use' : 'Retired'}
                  tone={c.active ? 'success' : 'neutral'}
                />
              </View>
              {c.location ? (
                <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                  {c.location}
                </Text>
              ) : null}
              <Text variant="caption" color="mutedForeground">
                {c.routeCount ? `On ${plural(c.routeCount, 'round')}` : 'On no round yet'} ·{' '}
                {c.scanCount ? `scanned ${plural(c.scanCount, 'time')}` : 'never scanned'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="New code"
                size="sm"
                variant="outline"
                disabled={!c.active}
                loading={reissue.isPending && reissue.variables?.id === c.id}
                accessibilityLabel={`Give ${c.name} a new code`}
                onPress={() => confirmReissue(c)}
              />
              <Button
                label={c.active ? 'Retire' : 'Put back in use'}
                size="sm"
                variant="ghost"
                loading={toggle.isPending && toggle.variables?.id === c.id}
                accessibilityLabel={c.active ? `Retire ${c.name}` : `Put ${c.name} back in use`}
                onPress={() => confirmToggle(c)}
              />
            </View>
          </Card>
        ))
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a checkpoint">
        {adding ? (
          <AddCheckpointForm
            estateId={estateId}
            onAdded={invalidate}
            onDone={() => setAdding(false)}
          />
        ) : null}
      </Sheet>
      <Sheet open={!!issued} onClose={() => setIssued(null)} title="Checkpoint code">
        {issued ? <CheckpointCode checkpoint={issued} onDone={() => setIssued(null)} /> : null}
      </Sheet>
    </View>
  );
}

/** The one moment a checkpoint's code is readable, with where it belongs. */
function CheckpointCode({
  checkpoint: c,
  onDone,
}: {
  checkpoint: IssuedPatrolCheckpoint;
  onDone: () => void;
}) {
  return (
    <OneTimeCode
      title={`Code for ${c.name}`}
      code={c.code}
      notes={[c.guidance, 'Shown only now. If it goes missing, give the checkpoint a new code.']}
      shareLabel="Share to print"
      shareMessage={`Patrol checkpoint: ${c.name}${c.location ? ` (${c.location})` : ''}\nCode: ${c.code}\n${c.guidance}`}
      onDone={onDone}
    />
  );
}

/** Shows the new code in place, rather than handing off to a second sheet mid-dismiss. */
function AddCheckpointForm({
  estateId,
  onAdded,
  onDone,
}: {
  estateId: string;
  onAdded: () => void;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [issued, setIssued] = useState<IssuedPatrolCheckpoint | null>(null);
  const add = useMutation({
    mutationFn: () =>
      estateGateApi.addPatrolCheckpoint(estateId, {
        name: name.trim(),
        ...(location.trim() ? { location: location.trim() } : {}),
      }),
    onSuccess: (c) => {
      void haptics.success();
      onAdded();
      setIssued(c);
    },
  });
  if (issued) return <CheckpointCode checkpoint={issued} onDone={onDone} />;
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        A place a patrol has to reach. You’ll see its code once, to print and put up there.
      </Text>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={80}
        placeholder="e.g. Generator house"
      />
      <TextField
        label="Where it is (optional)"
        value={location}
        onChangeText={setLocation}
        maxLength={160}
        placeholder="e.g. Beside the boom, facing the road"
        hint="In your own words, so a guard knows they’re in the right place"
      />
      {add.error ? (
        <FormAlert message={errorText(add.error, 'Could not add the checkpoint.')} />
      ) : null}
      <Button
        label="Add checkpoint"
        disabled={!name.trim()}
        loading={add.isPending}
        onPress={() => add.mutate()}
      />
    </View>
  );
}
