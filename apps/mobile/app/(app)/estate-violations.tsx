import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Gavel, Plus } from 'lucide-react-native';
import {
  Button,
  Chip,
  FormAlert,
  IconButton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { errorText } from '@/components/estate/EstateUI';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import { CloseSheet, QueueCard, QueueScreen, type QueueView } from '@/components/estate/Triage';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import {
  VIOLATION_CATEGORIES,
  VIOLATION_STATUS,
  categoryLabel,
  estateManagerApi,
  isOpenItem,
  type Household,
  type Violation,
} from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { qk } from '@/lib/query/keys';

/** Rule breaches by household: record one, warn the resident, then close it. */
export default function EstateViolations() {
  const { colors } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [view, setView] = useState<QueueView>('open');
  const [recording, setRecording] = useState(false);
  const [closing, setClosing] = useState<{ item: Violation; how: 'resolve' | 'dismiss' } | null>(
    null
  );

  const query = useQuery({
    queryKey: qk.estateManager.violations(estateId),
    queryFn: () => estateManagerApi.violations(estateId),
    enabled: !!estateId,
  });
  const open = useMemo(() => (query.data ?? []).filter((v) => isOpenItem(v.status)), [query.data]);
  const closed = useMemo(
    () => (query.data ?? []).filter((v) => !isOpenItem(v.status)),
    [query.data]
  );

  const refreshQueue = () =>
    qc.invalidateQueries({ queryKey: qk.estateManager.violations(estateId) });
  const warn = useMutation({
    mutationFn: (v: Violation) => estateManagerApi.warnViolation(estateId, v.id),
    onSuccess: (_v, v) => {
      void haptics.success();
      refreshQueue();
      toast.show(`Warning sent to ${v.unitLabel}.`, 'success');
    },
    onError: (e) => {
      refreshQueue();
      toast.show(errorText(e, 'Could not send the warning.'), 'error');
    },
  });
  const close = useMutation({
    mutationFn: (v: { item: Violation; how: 'resolve' | 'dismiss'; notes: string }) =>
      estateManagerApi.closeViolation(estateId, v.item.id, v.how, v.notes || undefined),
    onSuccess: (_x, v) => {
      void haptics.success();
      refreshQueue();
      toast.show(v.how === 'resolve' ? 'Violation resolved.' : 'Violation dismissed.', 'success');
      setClosing(null);
    },
    onError: (e) => {
      refreshQueue();
      toast.show(errorText(e, 'Could not close this violation.'), 'error');
    },
  });

  return (
    <>
      <QueueScreen
        eyebrow={estate?.name ?? 'Operations'}
        title="Violations"
        subtitle="Estate rules a household has broken"
        accessory={
          <IconButton
            accessibilityLabel="Record a violation"
            disabled={!estateId}
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setRecording(true)}
          />
        }
        query={query}
        items={view === 'open' ? open : closed}
        view={view}
        onView={setView}
        openCount={open.length}
        icon={<Gavel size={34} color={colors.mutedForeground} />}
        emptyOpen={{
          title: 'No open violations',
          description: 'Record one against a household, then send them a warning.',
        }}
        emptyClosed={{
          title: 'Nothing closed yet',
          description: 'Resolved and dismissed violations are kept here.',
        }}
        renderItem={(v) => (
          <QueueCard
            title={categoryLabel(v.category)}
            where={`${v.unitLabel} · ${v.residentName}`}
            description={v.description}
            createdAt={v.createdAt}
            notes={v.resolutionNotes}
            pills={[VIOLATION_STATUS[v.status] ?? VIOLATION_STATUS.reported]}
            actions={
              isOpenItem(v.status) ? (
                <>
                  {v.status === 'reported' ? (
                    <Button
                      label="Send warning"
                      size="sm"
                      style={{ flex: 1 }}
                      loading={warn.isPending && warn.variables?.id === v.id}
                      onPress={() =>
                        Alert.alert(
                          `Warn ${v.unitLabel}?`,
                          'The resident is notified in their app with what you recorded. It can’t be unsent.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Send warning', onPress: () => warn.mutate(v) },
                          ]
                        )
                      }
                    />
                  ) : null}
                  <Button
                    label="Resolve"
                    size="sm"
                    variant={v.status === 'reported' ? 'secondary' : 'primary'}
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: v, how: 'resolve' })}
                  />
                  <Button
                    label="Dismiss"
                    size="sm"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => setClosing({ item: v, how: 'dismiss' })}
                  />
                </>
              ) : undefined
            }
          />
        )}
      />
      <CloseSheet
        open={!!closing}
        how={closing?.how ?? 'resolve'}
        what="violation"
        busy={close.isPending}
        onClose={() => setClosing(null)}
        onConfirm={(notes) => closing && close.mutate({ ...closing, notes })}
      />
      <Sheet open={recording} onClose={() => setRecording(false)} title="Record a violation">
        {recording ? <RecordForm estateId={estateId} onDone={() => setRecording(false)} /> : null}
      </Sheet>
    </>
  );
}

function RecordForm({ estateId, onDone }: { estateId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [household, setHousehold] = useState<Household | null>(null);
  const [category, setCategory] = useState('NOISE');
  const [description, setDescription] = useState('');
  const save = useMutation({
    mutationFn: () =>
      estateManagerApi.reportViolation(estateId, {
        householdId: household!.id,
        category,
        description: description.trim(),
      }),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.estateManager.violations(estateId) });
      toast.show('Recorded. Send a warning when you’re ready.', 'success');
      onDone();
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <HouseholdPicker estateId={estateId} value={household} onChange={setHousehold} />
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">What kind</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {VIOLATION_CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              label={c.label}
              size="sm"
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
      </View>
      <TextField
        label="What happened"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
        hint="The resident reads this if you send a warning, so say it as you would to them."
      />
      {save.error ? <FormAlert message={errorText(save.error, 'Could not record it.')} /> : null}
      <Button
        label="Record violation"
        disabled={!household || description.trim().length < 5}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
