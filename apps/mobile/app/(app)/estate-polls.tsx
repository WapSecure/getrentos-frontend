import { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Vote, X } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Progress,
  SegmentedControl,
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
  cleanPollOptions,
  estateManagerApi,
  leadingOptions,
  pollShare,
  turnout,
  type Poll,
} from '@/lib/api/estateManager';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

const MAX_OPTIONS = 10;

/** Ask the estate a question: one vote per household, results as they come in. */
export default function EstatePolls() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<'open' | 'closed'>('open');
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: qk.estateManager.polls(estateId),
    queryFn: () => estateManagerApi.polls(estateId),
    enabled: !!estateId,
  });
  const items = useMemo(
    () => (query.data ?? []).filter((p) => p.status === view),
    [query.data, view]
  );
  const openCount = query.data?.filter((p) => p.status === 'open').length ?? 0;

  const close = useMutation({
    mutationFn: (p: Poll) => estateManagerApi.closePoll(estateId, p.id),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.polls(estateId) });
      toast.show('Poll closed. The result is final.', 'success');
    },
    onError: (e) => {
      qc.invalidateQueries({ queryKey: qk.estateManager.polls(estateId) });
      toast.show(errorText(e, 'Could not close the poll.'), 'error');
    },
  });

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
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Community'}
          title="Polls"
          subtitle="One vote per household"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="New poll"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setCreating(true)}
            />
          }
        />
        <SegmentedControl
          accessibilityLabel="Which polls"
          value={view}
          onChange={setView}
          options={[
            { value: 'open', label: openCount ? `Open ${openCount}` : 'Open' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          [0, 1].map((i) => <Skeleton key={i} height={190} radius={radius.lg} />)
        ) : !items.length ? (
          <EmptyState
            icon={<Vote size={34} color={colors.mutedForeground} />}
            title={view === 'open' ? 'No open polls' : 'No closed polls yet'}
            description={
              view === 'open'
                ? 'Put a decision to the estate: a levy, a rule, a contractor.'
                : 'Polls you close are kept here with their final result.'
            }
            action={
              view === 'open' ? (
                <Button label="Start a poll" onPress={() => setCreating(true)} />
              ) : undefined
            }
          />
        ) : (
          items.map((p) => (
            <PollCard
              key={p.id}
              p={p}
              households={estate?.householdCount ?? 0}
              closing={close.isPending && close.variables?.id === p.id}
              onClose={() =>
                Alert.alert(
                  'Close this poll?',
                  'No more votes are taken and the result is final. It can’t be reopened.',
                  [
                    { text: 'Keep open', style: 'cancel' },
                    { text: 'Close poll', style: 'destructive', onPress: () => close.mutate(p) },
                  ]
                )
              }
            />
          ))
        )}
      </ScrollView>
      <Sheet open={creating} onClose={() => setCreating(false)} title="New poll">
        {creating ? (
          <CreateForm
            estateId={estateId}
            households={estate?.householdCount ?? 0}
            onDone={() => setCreating(false)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function PollCard({
  p,
  households,
  closing,
  onClose,
}: {
  p: Poll;
  households: number;
  closing: boolean;
  onClose: () => void;
}) {
  const { spacing } = useTheme();
  const leaders = leadingOptions(p);
  const open = p.status === 'open';
  return (
    <Card elevated style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }} accessibilityRole="header">
          {p.question}
        </Text>
        <StatusPill label={open ? 'Open' : 'Closed'} tone={open ? 'success' : 'neutral'} />
      </View>
      <View style={{ gap: spacing.md }}>
        {p.options.map((o) => {
          const share = pollShare(o.voteCount, p.totalVotes);
          const leading = leaders.includes(o.id);
          return (
            <View
              key={o.id}
              accessible
              accessibilityLabel={`${o.label}, ${o.voteCount} ${o.voteCount === 1 ? 'vote' : 'votes'}, ${share} percent${leading ? (leaders.length > 1 ? ', tied for the lead' : ', leading') : ''}`}
              style={{ gap: 6 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                <Text variant="callout" style={{ flex: 1, fontWeight: leading ? '700' : '400' }}>
                  {o.label}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {o.voteCount} · {share}%
                </Text>
              </View>
              <Progress value={share / 100} height={6} />
            </View>
          );
        })}
      </View>
      <Text variant="caption" color="mutedForeground">
        {turnout(p.totalVotes, households)} · started {formatDate(p.createdAt, 'medium')}
        {leaders.length > 1 && p.totalVotes ? ' · tied' : ''}
      </Text>
      {open ? (
        <Button
          label="Close poll"
          size="sm"
          variant="secondary"
          loading={closing}
          accessibilityLabel={`Close the poll: ${p.question}`}
          onPress={onClose}
        />
      ) : null}
    </Card>
  );
}

function CreateForm({
  estateId,
  households,
  onDone,
}: {
  estateId: string;
  households: number;
  onDone: () => void;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const clean = cleanPollOptions(options);
  const typed = options.filter((o) => o.trim()).length;

  const create = useMutation({
    mutationFn: () =>
      estateManagerApi.createPoll(estateId, { question: question.trim(), options: clean }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.polls(estateId) });
      toast.show('Poll opened. Residents have been told.', 'success');
      onDone();
    },
  });

  const set = (i: number, v: string) => setOptions((list) => list.map((o, j) => (j === i ? v : o)));

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label="Question"
        value={question}
        onChangeText={setQuestion}
        multiline
        maxLength={500}
        autoFocus
        placeholder="e.g. Should we raise the security levy to ₦15,000?"
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Choices</Text>
        {options.map((o, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder={`Choice ${i + 1}`}
                accessibilityLabel={`Choice ${i + 1}`}
                value={o}
                onChangeText={(v) => set(i, v)}
                maxLength={200}
              />
            </View>
            {options.length > 2 ? (
              <IconButton
                accessibilityLabel={`Remove choice ${i + 1}`}
                icon={<X size={16} color={colors.mutedForeground} />}
                onPress={() => setOptions((list) => list.filter((_, j) => j !== i))}
              />
            ) : null}
          </View>
        ))}
        {options.length < MAX_OPTIONS ? (
          <Button
            label="Add a choice"
            size="sm"
            variant="ghost"
            onPress={() => setOptions((list) => [...list, ''])}
          />
        ) : null}
      </View>
      {typed > clean.length ? (
        <FormAlert
          tone="warning"
          message="Two choices are the same. Each one needs to be different."
        />
      ) : null}
      <Text variant="caption" color="mutedForeground">
        Every household{households ? ` (${households.toLocaleString('en-NG')})` : ''} gets one vote,
        and residents with the app are notified. Choices can’t be changed once it’s open.
      </Text>
      {create.error ? (
        <FormAlert message={errorText(create.error, 'Could not open the poll.')} />
      ) : null}
      <Button
        label="Open poll"
        disabled={question.trim().length < 3 || clean.length < 2 || typed > clean.length}
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
