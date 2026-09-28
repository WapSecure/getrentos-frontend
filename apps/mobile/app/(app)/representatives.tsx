import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  DateField,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  AGENT_TASK_TYPES,
  representativesApi,
  type AgentTaskPriority,
  type AgentTaskType,
  type RepKind,
  type Representative,
} from '@/lib/api/representatives';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const STATUS = {
  PENDING: { label: 'Wants access', tone: 'warning' },
  ACTIVE: { label: 'Approved', tone: 'success' },
  REVOKED: { label: 'Revoked', tone: 'neutral' },
} as const;

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

/**
 * Realtors and field agents who want to work on your properties. Nothing
 * happens until you approve them, and even then they only reach the
 * properties you pick. Shared by owners and landlords.
 */
export default function Representatives() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<RepKind>('realtor');
  const [propertiesFor, setPropertiesFor] = useState<Representative | null>(null);
  const [taskFor, setTaskFor] = useState<Representative | null>(null);
  const query = useQuery({
    queryKey: qk.representatives.list(kind),
    queryFn: () => representativesApi.list(kind),
  });
  const noun = kind === 'realtor' ? 'realtor' : 'agent';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Your team"
          title="Realtors & agents"
          subtitle="Approve who represents you and what they can touch"
          onBack={() => router.back()}
        />
        <SegmentedControl
          accessibilityLabel="Kind of representative"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'realtor', label: 'Realtors' },
            { value: 'agent', label: 'Field agents' },
          ]}
        />

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={120} radius={radius.lg} />
        ) : !query.data.items.length ? (
          <EmptyState
            icon={<UserCheck size={34} color={colors.mutedForeground} />}
            title={`No ${noun}s yet`}
            description={`When a ${noun} asks to represent you, you’ll approve them here.`}
          />
        ) : (
          query.data.items.map((rep) => (
            <RepCard
              key={rep.id}
              kind={kind}
              rep={rep}
              onChooseProperties={() => setPropertiesFor(rep)}
              onAssignTask={() => setTaskFor(rep)}
            />
          ))
        )}
      </ScrollView>

      <Sheet
        open={!!propertiesFor}
        onClose={() => setPropertiesFor(null)}
        title={propertiesFor ? `Properties for ${propertiesFor.person.name}` : 'Properties'}
      >
        {propertiesFor ? <AssignProperties kind={kind} rep={propertiesFor} /> : null}
      </Sheet>
      <Sheet
        open={!!taskFor}
        onClose={() => setTaskFor(null)}
        title={taskFor ? `Task for ${taskFor.person.name}` : 'New task'}
      >
        {taskFor ? <AgentTaskForm rep={taskFor} onDone={() => setTaskFor(null)} /> : null}
      </Sheet>
    </View>
  );
}

function RepCard({
  kind,
  rep,
  onChooseProperties,
  onAssignTask,
}: {
  kind: RepKind;
  rep: Representative;
  onChooseProperties: () => void;
  onAssignTask: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const status = STATUS[rep.status] ?? STATUS.REVOKED;
  const refresh = () => qc.invalidateQueries({ queryKey: qk.representatives.list(kind) });

  const approve = useMutation({
    mutationFn: () => representativesApi.approve(kind, rep.id),
    onSuccess: () => {
      refresh();
      toast.show(`${rep.person.name} is approved. Now choose their properties.`, 'success');
    },
    onError: (err) => toast.show(errorText(err, 'Could not approve them.'), 'error'),
  });
  const revoke = useMutation({
    mutationFn: () => representativesApi.revoke(kind, rep.id),
    onSuccess: () => {
      refresh();
      toast.show(`${rep.person.name} no longer has access.`, 'success');
    },
    onError: (err) => toast.show(errorText(err, 'Could not revoke access.'), 'error'),
  });

  const confirmRevoke = () =>
    Alert.alert(`Revoke ${rep.person.name}?`, 'They lose access to every property you gave them.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate() },
    ]);

  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{rep.person.name}</Text>
          {rep.person.company || rep.person.email ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {rep.person.company || rep.person.email}
            </Text>
          ) : null}
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      {rep.status === 'PENDING' ? (
        <Button
          label="Approve access"
          loading={approve.isPending}
          onPress={() => approve.mutate()}
        />
      ) : rep.status === 'ACTIVE' ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Choose properties"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={onChooseProperties}
            />
            {kind === 'agent' ? (
              <Button
                label="Assign a task"
                variant="secondary"
                style={{ flex: 1 }}
                onPress={onAssignTask}
              />
            ) : null}
          </View>
          <Button
            label="Revoke access"
            variant="ghost"
            loading={revoke.isPending}
            onPress={confirmRevoke}
          />
        </View>
      ) : null}
    </Card>
  );
}

function AssignProperties({ kind, rep }: { kind: RepKind; rep: Representative }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const key = qk.representatives.assignable(kind, rep.id, search.trim());
  const query = useQuery({
    queryKey: key,
    queryFn: () => representativesApi.assignable(kind, rep.id, search.trim() || undefined),
  });
  const assign = useMutation({
    mutationFn: (propertyId: string) => representativesApi.assign(kind, rep.id, propertyId),
    onSuccess: (_r, propertyId) => {
      qc.invalidateQueries({ queryKey: ['representatives', kind, rep.id] });
      const title = query.data?.items.find((p) => p.id === propertyId)?.title;
      toast.show(title ? `${rep.person.name} can now work on ${title}.` : 'Assigned.', 'success');
    },
    onError: (err) => toast.show(errorText(err, 'Could not assign that property.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Search your properties"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {query.isPending ? (
        <Skeleton height={60} />
      ) : !query.data?.items.length ? (
        <Text variant="callout" color="mutedForeground">
          {search.trim()
            ? 'No properties match your search.'
            : 'You don’t have any properties yet.'}
        </Text>
      ) : (
        query.data.items.map((p) => (
          <View
            key={p.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 44 }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="callout" numberOfLines={1}>
                {p.title}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {p.city}, {p.state}
              </Text>
            </View>
            <Button
              label="Assign"
              size="sm"
              variant="secondary"
              accessibilityLabel={`Assign ${p.title} to ${rep.person.name}`}
              loading={assign.isPending && assign.variables === p.id}
              disabled={assign.isPending}
              onPress={() => assign.mutate(p.id)}
            />
          </View>
        ))
      )}
    </View>
  );
}

const PRIORITIES: { value: AgentTaskPriority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

function AgentTaskForm({ rep, onDone }: { rep: Representative; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [propertyId, setPropertyId] = useState<string>();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<AgentTaskType>('INSPECTION');
  const [priority, setPriority] = useState<AgentTaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('10:00');
  // The API lists every property you own; it refuses a task on one you haven't
  // given this agent, so the hint says so up front.
  const properties = useQuery({
    queryKey: qk.representatives.assignable('agent', rep.id, ''),
    queryFn: () => representativesApi.assignable('agent', rep.id),
  });

  const create = useMutation({
    mutationFn: () =>
      representativesApi.createAgentTask({
        agentId: rep.person.id,
        propertyId: propertyId!,
        title: title.trim(),
        type,
        priority,
        dueAt: new Date(`${dueDate}T${dueTime}:00`).toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      toast.show(`Task sent to ${rep.person.name}.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">Property</Text>
        <Text variant="caption" color="mutedForeground">
          Pick one you’ve already given them under Choose properties.
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {properties.data?.items.length ? (
          properties.data.items.map((p) => (
            <Chip
              key={p.id}
              label={p.title}
              size="sm"
              selected={propertyId === p.id}
              onPress={() => setPropertyId(p.id)}
            />
          ))
        ) : (
          <Text variant="caption" color="mutedForeground">
            {properties.isPending ? 'Loading…' : 'No properties to choose from.'}
          </Text>
        )}
      </View>
      <Text variant="bodyStrong">Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {AGENT_TASK_TYPES.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            size="sm"
            selected={type === t.value}
            onPress={() => setType(t.value)}
          />
        ))}
      </View>
      <TextField label="What should they do?" value={title} onChangeText={setTitle} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Text variant="bodyStrong">Priority</Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {PRIORITIES.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            size="sm"
            selected={priority === p.value}
            onPress={() => setPriority(p.value)}
          />
        ))}
      </View>
      <DateField
        label="Due date"
        value={dueDate}
        onChange={setDueDate}
        min={toISODate(new Date())}
      />
      <TimeField label="Due time" value={dueTime} onChange={setDueTime} />
      {create.error ? (
        <Text variant="caption" color="destructive">
          {errorText(create.error, 'Could not create the task.')}
        </Text>
      ) : null}
      <Button
        label="Send task"
        disabled={!propertyId || !title.trim() || !dueDate}
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
