import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Gavel,
  Landmark,
  Lock,
  ReceiptText,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DateField,
  DetailSkeleton,
  FormAlert,
  NumberField,
  Price,
  QueryState,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  ENFORCEMENT,
  HEARING_RESULTS,
  isDone,
  LEGAL_STATUS,
  legalCasesApi,
  OUTCOMES,
  primaryAction,
  timelineFor,
  type EnforcementMethod,
  type HearingOutcome,
  type LegalCase,
  type LegalCaseHearing,
  type LegalCaseOutcome,
  type LegalCaseStatus,
} from '@/lib/api/legalCases';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type SheetKind = 'advocate' | 'cost' | null;

/**
 * One case: where it is, what has happened, and the single next thing to do.
 * Recording counsel and costs, closing and withdrawing sit below as secondary
 * actions.
 */
export default function LegalCaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const query = useQuery({
    queryKey: qk.legalCases.detail(id),
    queryFn: () => legalCasesApi.get(id),
    enabled: !!id,
  });
  const c = query.data;

  const settle = (message: string) => (updated: LegalCase) => {
    qc.setQueryData(qk.legalCases.detail(id), updated);
    qc.invalidateQueries({ queryKey: qk.legalCases.all });
    toast.show(message, 'success');
  };

  const close = useMutation({
    mutationFn: () => legalCasesApi.close(id),
    onSuccess: settle('Case closed.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not close the case.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: () =>
      legalCasesApi.withdraw(id, 'Withdrawn by the owner after the tenant settled directly.'),
    onSuccess: settle('Case withdrawn.'),
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw the case.'), 'error'),
  });

  const confirmClose = () =>
    Alert.alert('Close this case?', 'Nothing further will be expected on it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close case', onPress: () => close.mutate() },
    ]);
  const confirmWithdraw = () =>
    Alert.alert(
      'Withdraw this case?',
      'A withdrawn case stops being evidence of anything, and it does not unblock anything the way a closed case does.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: () => withdraw.mutate() },
      ]
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Legal case"
        title={c?.kindLabel ?? 'Case'}
        subtitle={
          c
            ? [c.property.address, c.property.city, c.unitName, c.tenantName]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState
        query={query}
        skeleton={<DetailSkeleton />}
        errorTitle="This case did not load"
        errorDescription="It may not be one you can read."
        style={{ paddingHorizontal: spacing.xl }}
      >
        {c ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={query.isRefetching}
                onRefresh={() => query.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            <StageTrack status={c.status} />

            {c.court ? (
              <Fact icon={Landmark}>
                {c.court}
                {c.suitNumber ? ` · ${c.suitNumber}` : ''}
              </Fact>
            ) : null}
            {c.advocateName ? (
              <Fact icon={Briefcase}>
                {[c.advocateName, c.advocateFirm, c.advocateContact].filter(Boolean).join(' · ')}
                {c.advocateFeeAgreement ? `\n${c.advocateFeeAgreement}` : ''}
              </Fact>
            ) : null}

            <NextAction legalCase={c} onSaved={settle} />

            {c.status === 'DECIDED' && c.enforcementAt ? (
              <FormAlert
                tone="info"
                title="Enforcement recorded"
                message="Close the case once nothing further is expected on it."
              />
            ) : null}

            {c.costs.items.length > 0 ? <Costs legalCase={c} /> : null}

            <Timeline legalCase={c} />

            {isDone(c) ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                <Lock size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                  {c.status === 'WITHDRAWN'
                    ? 'Withdrawn. It stops being evidence of anything, and it does not unblock anything the way a closed case does.'
                    : 'Closed. Nothing further is expected.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                <Button
                  label={c.advocateName ? 'Update advocate' : 'Record advocate'}
                  variant="secondary"
                  onPress={() => setSheet('advocate')}
                />
                <Button
                  label="Record a cost"
                  variant="secondary"
                  onPress={() => setSheet('cost')}
                />
                <Button
                  label="Close case"
                  variant="ghost"
                  loading={close.isPending}
                  onPress={confirmClose}
                />
                <Button
                  label="Withdraw case"
                  variant="ghost"
                  loading={withdraw.isPending}
                  onPress={confirmWithdraw}
                />
              </View>
            )}

            {c.leaseId ? (
              <Button
                label="Open the tenancy's notices"
                variant="ghost"
                onPress={() => router.push(`/(app)/notice-ladder/${c.leaseId}`)}
              />
            ) : null}

            <Text variant="caption" color="mutedForeground">
              Opened by {c.openedByName ?? 'unknown'} on {formatDate(c.createdAt)}
            </Text>
          </ScrollView>
        ) : null}
      </QueryState>

      <Sheet
        open={sheet === 'advocate'}
        onClose={() => setSheet(null)}
        title={c?.advocateName ? 'Update the advocate' : 'Record the advocate'}
      >
        {c ? (
          <AdvocateForm
            key={sheet ?? 'closed'}
            legalCase={c}
            onSaved={(updated) => {
              settle('Advocate recorded.')(updated);
              setSheet(null);
            }}
          />
        ) : null}
      </Sheet>
      <Sheet open={sheet === 'cost'} onClose={() => setSheet(null)} title="Record a cost">
        <CostForm
          key={sheet ?? 'closed'}
          id={id}
          onSaved={(updated) => {
            settle('Cost recorded.')(updated);
            setSheet(null);
          }}
        />
      </Sheet>
    </View>
  );
}

const STAGES: { status: LegalCaseStatus; label: string }[] = [
  { status: 'OPEN', label: 'Opened' },
  { status: 'FILED', label: 'Filed' },
  { status: 'DECIDED', label: 'Decided' },
  { status: 'CLOSED', label: 'Closed' },
];

/** Where the case is, as a position rather than a word. Withdrawn is a way out, not a stage. */
function StageTrack({ status }: { status: LegalCaseStatus }) {
  const { colors, spacing, radius } = useTheme();
  if (status === 'WITHDRAWN') {
    return <Badge label="Withdrawn" tone={LEGAL_STATUS.WITHDRAWN.tone} />;
  }
  const current = STAGES.findIndex((s) => s.status === status);
  return (
    <Card padding={spacing.md} style={{ flexDirection: 'row', gap: spacing.xs }}>
      {STAGES.map((s, i) => (
        <View key={s.status} style={{ flex: 1, gap: 6 }}>
          <View
            style={{
              height: 4,
              borderRadius: radius.full,
              backgroundColor: i <= current ? colors.primary : colors.border,
            }}
          />
          <Text
            variant="caption"
            style={{
              color: i === current ? colors.foreground : colors.mutedForeground,
              fontWeight: i === current ? '600' : '400',
            }}
          >
            {s.label}
          </Text>
        </View>
      ))}
    </Card>
  );
}

function Fact({ icon: Icon, children }: { icon: typeof Landmark; children: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <Icon size={14} color={colors.mutedForeground} style={{ marginTop: 3 }} />
      <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Landmark;
  title: string;
  children: React.ReactNode;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
        <Icon size={16} color={colors.mutedForeground} />
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
}

/** The one primary action for the case's state. */
function NextAction({
  legalCase: c,
  onSaved,
}: {
  legalCase: LegalCase;
  onSaved: (message: string) => (updated: LegalCase) => void;
}) {
  const primary = primaryAction(c);
  switch (primary.kind) {
    case 'blocked':
      return <FormAlert tone="warning" title={primary.title} message={primary.why} />;
    case 'file':
      return <FileForm id={c.id} onSaved={onSaved('Recorded as filed.')} />;
    case 'schedule':
      return <ScheduleForm id={c.id} onSaved={onSaved('Hearing scheduled.')} />;
    case 'record':
      return (
        <RecordSittingForm
          key={primary.hearing.id}
          id={c.id}
          hearing={primary.hearing}
          onSaved={onSaved('Sitting recorded.')}
        />
      );
    case 'enforce':
      return <EnforceForm legalCase={c} onSaved={onSaved('Enforcement recorded.')} />;
    default:
      return null;
  }
}

function useCaseMutation<T>(
  fn: (input: T) => Promise<LegalCase>,
  onSaved: (c: LegalCase) => void,
  fallback: string
) {
  const toast = useToast();
  return useMutation({
    mutationFn: fn,
    onSuccess: onSaved,
    // Shown verbatim: a refusal to file early is the server explaining why.
    onError: (e) => toast.show(errorMessage(e, fallback), 'error'),
  });
}

function FileForm({ id, onSaved }: { id: string; onSaved: (c: LegalCase) => void }) {
  const [court, setCourt] = useState('');
  const [suit, setSuit] = useState('');
  const file = useCaseMutation(
    () => legalCasesApi.file(id, { court: court.trim(), suitNumber: suit.trim() }),
    onSaved,
    'Could not record the filing.'
  );
  return (
    <SectionCard icon={Gavel} title="File in court">
      <TextField
        label="Court"
        placeholder="Lagos High Court"
        value={court}
        onChangeText={setCourt}
      />
      <TextField
        label="Suit number"
        placeholder="LD/1234/2026"
        value={suit}
        onChangeText={setSuit}
      />
      <Button
        label="Record as filed"
        loading={file.isPending}
        disabled={!court.trim() || !suit.trim() || file.isPending}
        onPress={() => file.mutate(undefined)}
      />
    </SectionCard>
  );
}

function ScheduleForm({ id, onSaved }: { id: string; onSaved: (c: LegalCase) => void }) {
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const schedule = useCaseMutation(
    () =>
      legalCasesApi.scheduleHearing(id, {
        scheduledFor: date,
        ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
      }),
    onSaved,
    'Could not schedule the hearing.'
  );
  return (
    <SectionCard icon={CalendarClock} title="Nothing is on the calendar">
      <Text variant="callout" color="mutedForeground">
        This case is filed and has no next date. Schedule it, or it is the one that gets forgotten.
      </Text>
      <DateField label="Next hearing" value={date} onChange={setDate} required />
      <TextField
        label="Purpose (optional)"
        placeholder="Mention, or hearing of the claim"
        value={purpose}
        onChangeText={setPurpose}
      />
      <Button
        label="Add to calendar"
        loading={schedule.isPending}
        disabled={!date || schedule.isPending}
        onPress={() => schedule.mutate(undefined)}
      />
    </SectionCard>
  );
}

function RecordSittingForm({
  id,
  hearing,
  onSaved,
}: {
  id: string;
  hearing: LegalCaseHearing;
  onSaved: (c: LegalCase) => void;
}) {
  const [outcome, setOutcome] = useState<HearingOutcome>('HEARD');
  const [heldAt, setHeldAt] = useState('');
  const [adjournTo, setAdjournTo] = useState('');
  const [decision, setDecision] = useState<LegalCaseOutcome | undefined>();
  const [decisionNotes, setDecisionNotes] = useState('');
  const [notes, setNotes] = useState('');

  // A sitting that decided the matter also decides the case, so both are
  // written from one action rather than leaving the case filed with a decision
  // nobody entered.
  const record = useCaseMutation(
    async () => {
      const updated = await legalCasesApi.recordHearing(id, hearing.id, {
        heldAt,
        outcome,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(outcome === 'ADJOURNED' ? { adjournNextFor: adjournTo } : {}),
      });
      if (outcome !== 'DECIDED' || !decision) return updated;
      return legalCasesApi.decide(id, {
        outcome: decision,
        ...(decisionNotes.trim() ? { notes: decisionNotes.trim() } : {}),
        decidedAt: heldAt,
      });
    },
    onSaved,
    'Could not record the sitting.'
  );

  const ready =
    !!heldAt && (outcome !== 'ADJOURNED' || !!adjournTo) && (outcome !== 'DECIDED' || !!decision);

  return (
    <SectionCard icon={CalendarClock} title={`Sitting on ${formatDate(hearing.scheduledFor)}`}>
      {hearing.purpose ? (
        <Text variant="callout" color="mutedForeground">
          {hearing.purpose}
        </Text>
      ) : null}
      <ChipSelect
        label="What happened"
        options={HEARING_RESULTS}
        value={outcome}
        onChange={setOutcome}
      />
      <DateField
        label="Date held"
        value={heldAt}
        onChange={setHeldAt}
        max={toISODate(new Date())}
        required
      />
      {outcome === 'ADJOURNED' ? (
        <DateField
          label="Adjourned to"
          value={adjournTo}
          onChange={setAdjournTo}
          required
          hint="An adjournment with no next date is how a case goes quiet."
        />
      ) : null}
      {outcome === 'DECIDED' ? (
        <>
          <ChipSelect
            label="What the court decided"
            options={OUTCOMES}
            value={decision}
            onChange={setDecision}
          />
          <TextField
            label="Decision notes (optional)"
            placeholder="Judgment entered for the full amount plus costs."
            value={decisionNotes}
            onChangeText={setDecisionNotes}
            multiline
          />
        </>
      ) : null}
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Button
        label="Record sitting"
        loading={record.isPending}
        disabled={!ready || record.isPending}
        onPress={() => record.mutate(undefined)}
      />
    </SectionCard>
  );
}

function EnforceForm({
  legalCase: c,
  onSaved,
}: {
  legalCase: LegalCase;
  onSaved: (c: LegalCase) => void;
}) {
  const [method, setMethod] = useState<EnforcementMethod>('BAILIFF');
  const [notes, setNotes] = useState('');
  const enforce = useCaseMutation(
    () => legalCasesApi.enforce(c.id, { method, ...(notes.trim() ? { notes: notes.trim() } : {}) }),
    onSaved,
    'Could not record enforcement.'
  );
  const outcome = OUTCOMES.find((o) => o.value === c.outcome)?.label ?? 'Decided';
  return (
    <SectionCard icon={CheckCircle2} title="Decide how it is enforced">
      <Text variant="callout" color="mutedForeground">
        {outcome}
        {c.outcomeAt ? ` on ${formatDate(c.outcomeAt)}` : ''}. Nothing is done until enforcement is
        recorded.
      </Text>
      <ChipSelect label="Method" options={ENFORCEMENT} value={method} onChange={setMethod} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      <Button
        label="Record enforcement"
        loading={enforce.isPending}
        disabled={enforce.isPending}
        onPress={() => enforce.mutate(undefined)}
      />
    </SectionCard>
  );
}

function AdvocateForm({
  legalCase: c,
  onSaved,
}: {
  legalCase: LegalCase;
  onSaved: (c: LegalCase) => void;
}) {
  const { spacing } = useTheme();
  const [name, setName] = useState(c.advocateName ?? '');
  const [firm, setFirm] = useState(c.advocateFirm ?? '');
  const [contact, setContact] = useState(c.advocateContact ?? '');
  const [fee, setFee] = useState(c.advocateFeeAgreement ?? '');
  const save = useCaseMutation(
    () =>
      legalCasesApi.advocate(c.id, {
        name: name.trim(),
        ...(firm.trim() ? { firm: firm.trim() } : {}),
        ...(contact.trim() ? { contact: contact.trim() } : {}),
        ...(fee.trim() ? { feeAgreement: fee.trim() } : {}),
      }),
    onSaved,
    'Could not record the advocate.'
  );
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Advocate"
        placeholder="Adaeze Okafor"
        value={name}
        onChangeText={setName}
        required
      />
      <TextField
        label="Firm (optional)"
        placeholder="Okafor & Co."
        value={firm}
        onChangeText={setFirm}
      />
      <TextField
        label="Contact (optional)"
        placeholder="Phone or email, as on the brief"
        value={contact}
        onChangeText={setContact}
      />
      <TextField
        label="Fee agreement (optional)"
        placeholder="10% of the sum recovered, ₦250,000 on brief"
        value={fee}
        onChangeText={setFee}
        multiline
      />
      <Button
        label={c.advocateName ? 'Update advocate' : 'Record advocate'}
        loading={save.isPending}
        disabled={!name.trim() || save.isPending}
        onPress={() => save.mutate(undefined)}
      />
    </View>
  );
}

function CostForm({ id, onSaved }: { id: string; onSaved: (c: LegalCase) => void }) {
  const { spacing } = useTheme();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const save = useCaseMutation(
    () =>
      legalCasesApi.cost(id, {
        amount: Math.round(Number(amount)),
        note: note.trim(),
        ...(date ? { incurredAt: date } : {}),
      }),
    onSaved,
    'Could not record the cost.'
  );
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        A filing fee, the advocate’s brief, a bailiff’s charge. It is added to the owner’s account
        on their next statement.
      </Text>
      <NumberField currency label="Amount" value={amount} onValueChange={setAmount} />
      <TextField
        label="What it was for"
        placeholder="Filing fee"
        value={note}
        onChangeText={setNote}
        required
      />
      <DateField
        label="When (optional)"
        value={date}
        onChange={setDate}
        max={toISODate(new Date())}
      />
      <Button
        label="Record cost"
        loading={save.isPending}
        disabled={!(Number(amount) > 0) || note.trim().length < 2 || save.isPending}
        onPress={() => save.mutate(undefined)}
      />
    </View>
  );
}

function Costs({ legalCase: c }: { legalCase: LegalCase }) {
  const { spacing } = useTheme();
  return (
    <SectionCard icon={ReceiptText} title="Costs to the owner">
      {c.costs.items.map((cost) => (
        <View key={cost.id} style={{ flexDirection: 'row', gap: spacing.md }}>
          <Text variant="callout" color="mutedForeground" style={{ flex: 1 }} numberOfLines={1}>
            {cost.note ?? 'Cost'} · {formatDate(cost.incurredAt, 'short')}
          </Text>
          <Price amount={cost.amount} variant="callout" />
        </View>
      ))}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="bodyStrong">Total</Text>
        <Price amount={c.costs.totalAmount} variant="bodyStrong" />
      </View>
    </SectionCard>
  );
}

function Timeline({ legalCase: c }: { legalCase: LegalCase }) {
  const { colors, spacing } = useTheme();
  const entries = timelineFor(c);
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="bodyStrong">What has happened</Text>
      {entries.map((e, i) => (
        <View key={`${e.at}-${e.title}-${i}`} style={{ flexDirection: 'row', gap: spacing.md }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 6,
              backgroundColor:
                e.tone === 'good'
                  ? colors.success
                  : e.tone === 'warn'
                    ? colors.warning
                    : colors.border,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="callout" style={{ fontWeight: '600' }}>
              {e.title}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {e.upcoming ? `due ${formatDate(e.at)}` : formatDate(e.at)}
            </Text>
            {e.detail ? (
              <Text variant="callout" color="mutedForeground">
                {e.detail}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
