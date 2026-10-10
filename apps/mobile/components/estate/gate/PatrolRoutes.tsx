import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Plus, Route as RouteIcon, X } from 'lucide-react-native';
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
  TimeField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import {
  PATROL_WINDOW_OPTIONS,
  WEEK_DAYS,
  estateGateApi,
  gateKeys,
  moveItem,
  retryUnlessPlanGate,
  routeDraftError,
  toggleDay,
  windowLabel,
  type PatrolCheckpoint,
  type PatrolRoute,
  type PatrolRouteInput,
} from '@/lib/api/estateGate';
import { haptics } from '@/lib/haptics';

/**
 * The rounds an estate walks: when they start, how long they may take, and
 * which checkpoints in which order. The order is recorded, not enforced: a
 * round walked out of sequence is reported as such, never refused.
 */
export function PatrolRoutes({ estateId }: { estateId: string }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  // null: closed. 'new': adding. A route: editing it.
  const [editing, setEditing] = useState<PatrolRoute | 'new' | null>(null);

  const routes = useQuery({
    queryKey: gateKeys.routes(estateId),
    queryFn: () => estateGateApi.patrolRoutes(estateId),
    enabled: !!estateId,
    retry: retryUnlessPlanGate,
  });
  const checkpoints = useQuery({
    queryKey: gateKeys.checkpoints(estateId),
    queryFn: () => estateGateApi.patrolCheckpoints(estateId),
    enabled: !!estateId,
    retry: retryUnlessPlanGate,
  });
  const active = (checkpoints.data ?? []).filter((c) => c.active);

  const toggle = useMutation({
    mutationFn: (r: PatrolRoute) =>
      estateGateApi.updatePatrolRoute(estateId, r.id, { active: !r.active }),
    onSuccess: (r) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.routes(estateId) });
      toast.show(r.active ? `${r.name} resumed.` : `${r.name} paused.`, 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not update this round.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="caption" color="mutedForeground">
        When a patrol starts, how long it may take, and which checkpoints it must reach.
      </Text>
      <Button
        label="Add a round"
        variant="secondary"
        icon={<Plus size={16} color={colors.foreground} />}
        disabled={!active.length}
        onPress={() => setEditing('new')}
      />
      {checkpoints.data && !active.length ? (
        <Text variant="callout" color="mutedForeground">
          Add a checkpoint first: a round is a list of places to reach.
        </Text>
      ) : null}
      {routes.isError && !routes.data ? (
        <ErrorState onRetry={() => routes.refetch()} />
      ) : !routes.data ? (
        <Skeleton height={160} radius={radius.lg} />
      ) : !routes.data.length ? (
        active.length ? (
          <EmptyState
            icon={<RouteIcon size={34} color={colors.mutedForeground} />}
            title="No rounds yet"
            description="A round is when the patrol goes out and how long it should take. Without one there’s nothing to be late for."
          />
        ) : null
      ) : (
        routes.data.map((r) => (
          <Card key={r.id} elevated style={{ gap: spacing.sm }}>
            <View
              accessible
              accessibilityLabel={`${r.name}${r.active ? '' : ', paused'}. ${r.scheduleLabel}. ${r.checkpoints.length} checkpoints.`}
              style={{ gap: 2 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                  {r.name}
                </Text>
                {r.active ? null : <StatusPill label="Paused" tone="neutral" />}
              </View>
              <Text variant="caption" color="mutedForeground">
                {r.scheduleLabel}
              </Text>
            </View>
            {r.checkpoints.length ? (
              <View style={{ gap: 2 }}>
                {r.checkpoints.map((c) => (
                  <View key={c.id} style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Text variant="caption" color="mutedForeground" style={{ width: 18 }}>
                      {c.position}
                    </Text>
                    <Text
                      variant="caption"
                      color={c.active ? 'foreground' : 'mutedForeground'}
                      style={{
                        flex: 1,
                        textDecorationLine: c.active ? 'none' : 'line-through',
                      }}
                    >
                      {c.name}
                      {c.active ? '' : ' (retired)'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="caption" color="mutedForeground">
                No checkpoints, so this round isn’t being opened.
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Edit"
                size="sm"
                variant="outline"
                accessibilityLabel={`Edit ${r.name}`}
                onPress={() => setEditing(r)}
              />
              <Button
                label={r.active ? 'Pause' : 'Resume'}
                size="sm"
                variant="ghost"
                loading={toggle.isPending && toggle.variables?.id === r.id}
                accessibilityLabel={r.active ? `Pause ${r.name}` : `Resume ${r.name}`}
                onPress={() => toggle.mutate(r)}
              />
            </View>
          </Card>
        ))
      )}

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a round' : 'Edit round'}
      >
        {editing ? (
          <RouteForm
            estateId={estateId}
            route={editing === 'new' ? null : editing}
            checkpoints={checkpoints.data ?? []}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function RouteForm({
  estateId,
  route,
  checkpoints,
  onDone,
}: {
  estateId: string;
  route: PatrolRoute | null;
  checkpoints: PatrolCheckpoint[];
  onDone: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<PatrolRouteInput>(() =>
    route
      ? {
          name: route.name,
          startTime: route.startTime,
          windowMinutes: route.windowMinutes,
          daysOfWeek: route.daysOfWeek,
          checkpointIds: route.checkpoints.map((c) => c.id),
        }
      : { name: '', startTime: '22:00', windowMinutes: 90, daysOfWeek: [], checkpointIds: [] }
  );
  const set = (patch: Partial<PatrolRouteInput>) => setDraft((d) => ({ ...d, ...patch }));
  const problem = routeDraftError(draft);

  // Names for every chosen checkpoint, including a retired one an existing round still lists.
  const nameOf = (id: string) =>
    checkpoints.find((c) => c.id === id)?.name ??
    route?.checkpoints.find((c) => c.id === id)?.name ??
    'Checkpoint';
  const chosen = new Set(draft.checkpointIds);
  const addable = checkpoints.filter((c) => c.active && !chosen.has(c.id));
  const windows = PATROL_WINDOW_OPTIONS.includes(draft.windowMinutes)
    ? PATROL_WINDOW_OPTIONS
    : [...PATROL_WINDOW_OPTIONS, draft.windowMinutes].sort((a, b) => a - b);

  const save = useMutation({
    mutationFn: () => {
      const body = { ...draft, name: draft.name.trim() };
      return route
        ? estateGateApi.updatePatrolRoute(estateId, route.id, body)
        : estateGateApi.addPatrolRoute(estateId, body);
    },
    onSuccess: (r) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: gateKeys.routes(estateId) });
      qc.invalidateQueries({ queryKey: gateKeys.checkpoints(estateId) });
      toast.show(route ? `${r.name} saved.` : `${r.name} added.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Name"
        value={draft.name}
        onChangeText={(name) => set({ name })}
        maxLength={80}
        placeholder="e.g. Night perimeter round"
      />
      <TimeField
        label="Starts at"
        value={draft.startTime}
        onChange={(startTime) => set({ startTime })}
        startHour={0}
        endHour={24}
        stepMinutes={15}
        hint="On the estate’s clock"
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Must finish within</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {windows.map((m) => (
            <Chip
              key={m}
              label={windowLabel(m)}
              selected={draft.windowMinutes === m}
              onPress={() => set({ windowMinutes: m })}
            />
          ))}
        </View>
      </View>
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Which days</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {WEEK_DAYS.map((d) => (
            <Chip
              key={d.value}
              label={d.short}
              selected={draft.daysOfWeek.includes(d.value)}
              onPress={() => set({ daysOfWeek: toggleDay(draft.daysOfWeek, d.value) })}
            />
          ))}
        </View>
        <Text variant="caption" color="mutedForeground">
          {draft.daysOfWeek.length
            ? 'Only on the days chosen.'
            : 'Every day. Choose days to limit it.'}
        </Text>
      </View>

      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Checkpoints, in walking order</Text>
        <Text variant="caption" color="mutedForeground">
          The order is recorded, not enforced. A round walked out of order is shown as such.
        </Text>
        {draft.checkpointIds.length ? (
          draft.checkpointIds.map((id, i) => (
            <View
              key={id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingLeft: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.secondary,
              }}
            >
              <Text variant="caption" color="mutedForeground" style={{ width: 18 }}>
                {i + 1}
              </Text>
              <Text variant="callout" numberOfLines={1} style={{ flex: 1 }}>
                {nameOf(id)}
              </Text>
              <IconButton
                accessibilityLabel={`Move ${nameOf(id)} earlier`}
                disabled={i === 0}
                icon={<ArrowUp size={16} color={colors.mutedForeground} />}
                onPress={() => set({ checkpointIds: moveItem(draft.checkpointIds, i, -1) })}
              />
              <IconButton
                accessibilityLabel={`Move ${nameOf(id)} later`}
                disabled={i === draft.checkpointIds.length - 1}
                icon={<ArrowDown size={16} color={colors.mutedForeground} />}
                onPress={() => set({ checkpointIds: moveItem(draft.checkpointIds, i, 1) })}
              />
              <IconButton
                accessibilityLabel={`Remove ${nameOf(id)}`}
                icon={<X size={16} color={colors.mutedForeground} />}
                onPress={() => set({ checkpointIds: draft.checkpointIds.filter((x) => x !== id) })}
              />
            </View>
          ))
        ) : (
          <Text variant="callout" color="mutedForeground">
            Nothing chosen yet. Tap a checkpoint below to add it.
          </Text>
        )}
        {addable.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {addable.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                leadingIcon={<Plus size={14} color={colors.mutedForeground} />}
                onPress={() => set({ checkpointIds: [...draft.checkpointIds, c.id] })}
              />
            ))}
          </View>
        ) : null}
      </View>

      {save.error ? (
        <FormAlert message={errorText(save.error, 'Could not save this round.')} />
      ) : null}
      <Button
        label={route ? 'Save round' : 'Add round'}
        disabled={!!problem}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
