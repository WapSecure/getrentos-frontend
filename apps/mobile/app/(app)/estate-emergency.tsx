import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronRight, Search, Siren, UserPlus } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  ErrorState,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  EMERGENCY_KINDS,
  ROLL_STATE,
  closingNoteRequired,
  estateManagerApi,
  rollOrder,
  type EmergencyKind,
  type EmergencyMuster,
  type MusterRollEntry,
  type MusterRollState,
  type MusterSummary,
} from '@/lib/api/estateManager';
import { formatDate, formatTime, relativeTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

const POLL_MS = 8000;

/**
 * Emergencies: declare one, work the roll call until everyone has an answer,
 * and stand down. Opened with `id`, it shows a past roll, read-only.
 */
export default function EstateEmergency() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();

  // Residents answer for themselves, so the live roll moves without us.
  const active = useQuery({
    queryKey: qk.estateManager.activeMuster(estateId),
    queryFn: () => estateManagerApi.activeMuster(estateId),
    enabled: !!estateId && !id,
    refetchInterval: (q) => (q.state.data ? POLL_MS : false),
  });
  const past = useQuery({
    queryKey: qk.estateManager.muster(estateId, id ?? ''),
    queryFn: () => estateManagerApi.muster(estateId, id!),
    enabled: !!estateId && !!id,
  });
  const history = useQuery({
    queryKey: qk.estateManager.musters(estateId),
    queryFn: () => estateManagerApi.musters(estateId),
    enabled: !!estateId && !id,
  });

  const query = id ? past : active;
  const muster = query.data ?? null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !muster?.rollOpen}
          onRefresh={() => {
            void query.refetch();
            void history.refetch();
          }}
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
        eyebrow={estate?.name ?? 'Safety'}
        title={muster ? muster.kindLabel : 'Emergency'}
        subtitle={
          muster
            ? `${muster.statusLabel} · declared ${formatDate(muster.declaredAt, 'medium')} at ${formatTime(muster.declaredAt)}`
            : 'Alert every resident and take a roll call'
        }
        onBack={() => router.back()}
      />

      {query.isError && !muster ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <Skeleton height={260} radius={radius.lg} />
      ) : muster ? (
        <Roll estateId={estateId} muster={muster} />
      ) : (
        <>
          <DeclareForm estateId={estateId} households={estate?.householdCount ?? 0} />
          <History items={history.data?.items ?? []} loading={history.isPending} />
        </>
      )}
    </ScrollView>
  );
}

/* -------------------------------- declare --------------------------------- */

function DeclareForm({ estateId, households }: { estateId: string; households: number }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<EmergencyKind>('FIRE');
  const [description, setDescription] = useState('');
  const [assemblyPoint, setAssemblyPoint] = useState('');
  const declare = useMutation({
    mutationFn: () =>
      estateManagerApi.declareMuster(estateId, {
        kind,
        description: description.trim(),
        ...(assemblyPoint.trim() ? { assemblyPoint: assemblyPoint.trim() } : {}),
      }),
    onSuccess: (muster) => {
      void haptics.success();
      qc.setQueryData(qk.estateManager.activeMuster(estateId), muster);
      qc.invalidateQueries({ queryKey: qk.estateManager.musters(estateId) });
      toast.show('Residents have been alerted. Start the roll call.', 'success');
    },
    onError: () => void haptics.error(),
  });
  const kindLabel = EMERGENCY_KINDS.find((k) => k.value === kind)!.label.toLowerCase();
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <Text variant="bodyStrong" accessibilityRole="header">
        Declare an emergency
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {EMERGENCY_KINDS.map((k) => (
          <Chip
            key={k.value}
            label={k.label}
            selected={kind === k.value}
            onPress={() => setKind(k.value)}
          />
        ))}
      </View>
      <TextField
        label="What’s happening"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={1000}
        hint="What you can see, and where. This goes on the record."
      />
      <TextField
        label="Assembly point (optional)"
        value={assemblyPoint}
        onChangeText={setAssemblyPoint}
        placeholder="e.g. Main gate car park"
        hint="Where residents should go"
      />
      {declare.error ? (
        <FormAlert message={errorText(declare.error, 'Could not declare the emergency.')} />
      ) : null}
      <Button
        label="Alert every resident"
        variant="destructive"
        icon={<Siren size={16} color={colors.destructiveForeground} />}
        disabled={description.trim().length < 3}
        loading={declare.isPending}
        onPress={() =>
          Alert.alert(
            `Declare a ${kindLabel} emergency?`,
            `Every resident${households ? ` (${households.toLocaleString('en-NG')} households)` : ''} is alerted at once and a roll call opens. Only do this for a real emergency.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Declare', style: 'destructive', onPress: () => declare.mutate() },
            ]
          )
        }
      />
    </Card>
  );
}

function History({ items, loading }: { items: MusterSummary[]; loading: boolean }) {
  const { colors, spacing, radius } = useTheme();
  if (loading) return <Skeleton height={80} radius={radius.lg} />;
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" accessibilityRole="header">
        Past emergencies
      </Text>
      {items.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => router.push({ pathname: '/(app)/estate-emergency', params: { id: m.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${m.kindLabel}, ${formatDate(m.declaredAt, 'medium')}, ${m.statusLabel}. ${m.tallyLabel}`}
        >
          <Card elevated style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyStrong">
                {m.kindLabel} · {formatDate(m.declaredAt, 'medium')}
              </Text>
              <Text variant="caption" color="mutedForeground" numberOfLines={2}>
                {m.statusLabel} · {m.tallyLabel}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

/* ---------------------------------- roll ---------------------------------- */

function Roll({ estateId, muster }: { estateId: string; muster: EmergencyMuster }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [noting, setNoting] = useState<{ entry: MusterRollEntry; state: MusterRollState } | null>(
    null
  );
  const [closing, setClosing] = useState(false);
  const live = muster.rollOpen;
  const t = muster.tally;

  const apply = (next: EmergencyMuster) => {
    qc.setQueryData(qk.estateManager.activeMuster(estateId), next.rollOpen ? next : null);
    qc.setQueryData(qk.estateManager.muster(estateId, next.id), next);
  };
  const fail = (fallback: string) => (e: unknown) => {
    void haptics.error();
    qc.invalidateQueries({ queryKey: qk.estateManager.activeMuster(estateId) });
    toast.show(errorText(e, fallback), 'error');
  };

  const mark = useMutation({
    mutationFn: (v: { entry: MusterRollEntry; state: MusterRollState; note?: string }) =>
      estateManagerApi.setRollState(estateId, muster.id, v.entry.id, v.state, v.note),
    onSuccess: (next) => {
      void haptics.tap();
      apply(next);
      setNoting(null);
    },
    onError: fail('Could not update the roll.'),
  });
  const arrivals = useMutation({
    mutationFn: () => estateManagerApi.addMusterArrivals(estateId, muster.id),
    onSuccess: (next) => {
      const added = next.tally.total - t.total;
      apply(next);
      toast.show(
        added > 0
          ? `${added} ${added === 1 ? 'person' : 'people'} added to the roll.`
          : 'Nobody new has come in since.',
        'success'
      );
    },
    onError: fail('Could not add arrivals.'),
  });
  const close = useMutation({
    mutationFn: (note?: string) => estateManagerApi.closeMuster(estateId, muster.id, note),
    onSuccess: (next) => {
      void haptics.success();
      apply(next);
      qc.invalidateQueries({ queryKey: qk.estateManager.musters(estateId) });
      setClosing(false);
      toast.show('Stood down. Residents have been told.', 'success');
    },
    onError: fail('Could not stand down.'),
  });

  const roll = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ordered = rollOrder(muster.roll);
    return q
      ? ordered.filter(
          (e) => e.unitLabel.toLowerCase().includes(q) || e.personName.toLowerCase().includes(q)
        )
      : ordered;
  }, [muster.roll, search]);

  const others = (entry: MusterRollEntry) => {
    const options: MusterRollState[] = ['NEEDS_HELP', 'NOT_ON_SITE', 'UNACCOUNTED'];
    Alert.alert(entry.personName, entry.unitLabel, [
      ...options
        .filter((s) => s !== entry.state)
        .map((state) => ({
          text: ROLL_STATE[state].label,
          style: state === 'NEEDS_HELP' ? ('destructive' as const) : ('default' as const),
          onPress: () =>
            state === 'UNACCOUNTED' ? mark.mutate({ entry, state }) : setNoting({ entry, state }),
        })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const requestClose = () => {
    if (closingNoteRequired(t)) return setClosing(true);
    Alert.alert('Stand down?', 'Everyone has an answer. Residents are told it’s over.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Stand down', onPress: () => close.mutate(undefined) },
    ]);
  };

  return (
    <>
      <View
        accessible
        accessibilityLabel={`${muster.description}. ${muster.assemblyInstruction}. ${muster.tallyLabel}`}
        style={{
          borderRadius: radius.xl,
          padding: spacing.lg,
          gap: spacing.sm,
          backgroundColor: live ? colors.destructive : colors.secondary,
        }}
      >
        <Text
          variant="bodyStrong"
          style={{ color: live ? colors.destructiveForeground : colors.foreground }}
        >
          {muster.description}
        </Text>
        <Text
          variant="callout"
          style={{ color: live ? colors.destructiveForeground : colors.mutedForeground }}
        >
          {muster.assemblyInstruction}
        </Text>
        {muster.closingNote ? (
          <Text
            variant="caption"
            style={{ color: live ? colors.destructiveForeground : colors.mutedForeground }}
          >
            Closed with: {muster.closingNote}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(
          [
            ['Missing', t.unaccounted, t.unaccounted ? colors.warning : colors.mutedForeground],
            ['Need help', t.needsHelp, t.needsHelp ? colors.destructive : colors.mutedForeground],
            ['Safe', t.accountedFor, colors.success],
            ['Away', t.notOnSite, colors.mutedForeground],
          ] as const
        ).map(([label, n, color]) => (
          <Card
            key={label}
            elevated
            accessible
            accessibilityLabel={`${n} ${label.toLowerCase()}`}
            style={{ flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: spacing.xs }}
          >
            <Text variant="title" style={{ color }}>
              {n}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {label}
            </Text>
          </Card>
        ))}
      </View>

      {live ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Add new arrivals"
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            icon={<UserPlus size={15} color={colors.foreground} />}
            loading={arrivals.isPending}
            onPress={() => arrivals.mutate()}
          />
          <Button
            label="Stand down"
            variant="outline"
            size="sm"
            style={{ flex: 1 }}
            loading={close.isPending && !closing}
            onPress={requestClose}
          />
        </View>
      ) : null}

      <TextField
        placeholder="Find a unit or name"
        accessibilityLabel="Search the roll"
        leftIcon={<Search size={16} color={colors.mutedForeground} />}
        autoCapitalize="none"
        value={search}
        onChangeText={setSearch}
      />

      <View style={{ gap: spacing.sm }}>
        {!roll.length ? (
          <Text variant="callout" color="mutedForeground">
            {search ? 'Nobody on the roll matches.' : 'Nobody is on the roll.'}
          </Text>
        ) : (
          roll.map((e) => {
            const s = ROLL_STATE[e.state];
            const busy = mark.isPending && mark.variables?.entry.id === e.id;
            return (
              <Card
                key={e.id}
                elevated
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <Pressable
                  style={{ flex: 1, gap: 2 }}
                  disabled={!live || busy}
                  onPress={() => others(e)}
                  accessibilityRole={live ? 'button' : undefined}
                  accessibilityLabel={`${e.personName}, ${e.unitLabel}, ${e.basisLabel}. ${s.label}${e.stateNote ? `. ${e.stateNote}` : ''}${live ? '. Change' : ''}`}
                >
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {e.personName}
                  </Text>
                  <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                    {e.unitLabel} · {e.basisLabel}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <StatusPill label={s.label} tone={s.tone} />
                    {e.stateAt ? (
                      <Text variant="caption" color="mutedForeground">
                        {relativeTime(e.stateAt)}
                      </Text>
                    ) : null}
                  </View>
                  {e.stateNote ? (
                    <Text variant="caption" color="mutedForeground">
                      {e.stateNote}
                    </Text>
                  ) : null}
                </Pressable>
                {live && e.state !== 'ACCOUNTED' ? (
                  <Button
                    label="Safe"
                    size="sm"
                    fullWidth={false}
                    icon={<Check size={14} color={colors.primaryForeground} />}
                    accessibilityLabel={`Mark ${e.personName} accounted for`}
                    disabled={busy}
                    onPress={() => mark.mutate({ entry: e, state: 'ACCOUNTED' })}
                  />
                ) : null}
              </Card>
            );
          })
        )}
      </View>

      <Sheet
        open={!!noting}
        onClose={() => setNoting(null)}
        title={noting ? ROLL_STATE[noting.state].label : ''}
      >
        {noting ? (
          <NoteForm
            label={
              noting.state === 'NEEDS_HELP'
                ? `What does ${noting.entry.personName} need, and where are they?`
                : `Where is ${noting.entry.personName}?`
            }
            action={`Mark ${ROLL_STATE[noting.state].label.toLowerCase()}`}
            busy={mark.isPending}
            onConfirm={(note) => mark.mutate({ ...noting, note: note || undefined })}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={closing}
        onClose={() => setClosing(false)}
        title="Stand down with people missing"
      >
        {closing ? (
          <NoteForm
            label={`${t.unaccounted} ${t.unaccounted === 1 ? 'person is' : 'people are'} still not accounted for. What was done to find them?`}
            action="Stand down"
            required
            busy={close.isPending}
            onConfirm={(note) => close.mutate(note)}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function NoteForm({
  label,
  action,
  required,
  busy,
  onConfirm,
}: {
  label: string;
  action: string;
  required?: boolean;
  busy?: boolean;
  onConfirm: (note: string) => void;
}) {
  const { spacing } = useTheme();
  const [note, setNote] = useState('');
  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label={label}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={required ? 1000 : 300}
        autoFocus
        hint={
          required
            ? 'Required. It stays on the emergency record.'
            : 'Optional, but it’s the only place this is written down.'
        }
      />
      <Button
        label={action}
        disabled={required && note.trim().length < 3}
        loading={busy}
        onPress={() => onConfirm(note.trim())}
      />
    </View>
  );
}
