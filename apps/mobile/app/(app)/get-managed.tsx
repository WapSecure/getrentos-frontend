import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Building2, Check, Clock, Sparkles } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  FormAlert,
  ListSkeleton,
  NumberField,
  PressableScale,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  END_REASON_MIN,
  humanizeMinutes,
  indicativeMonthly,
  INTAKE_STEPS,
  intakeBlocker,
  isPendingMandate,
  MANDATE_STATUS,
  managedApi,
  noticeEndsAt,
  openForFirm,
  PRIORITY_LABEL,
  PROPERTY_CLASSES,
  propertyState,
  SERVICE_NEEDS,
  TIER_LABEL,
  type ManagedIntake,
  type ManagedTierCard,
  type Mandate,
  type PropertyClass,
  type PropertyState,
  type ServicingTier,
  type VettedFirm,
} from '@/lib/api/managedService';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatDateTime, formatNaira } from '@/lib/format';
import { useMyHomes, type MyHome } from '@/hooks/useMyHomes';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

export default function GetManaged() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [requestFor, setRequestFor] = useState<MyHome | null>(null);
  const [ending, setEnding] = useState<Mandate | null>(null);
  const [appointing, setAppointing] = useState<VettedFirm | null>(null);

  const homes = useMyHomes();
  const feeCard = useQuery({ queryKey: qk.managed.feeCard, queryFn: managedApi.feeCard });
  const sla = useQuery({ queryKey: qk.managed.sla, queryFn: managedApi.sla });
  const firms = useQuery({ queryKey: qk.managed.firms, queryFn: managedApi.firms });
  const mandates = useQuery({ queryKey: qk.managed.mandates, queryFn: managedApi.mandates });
  const intakes = useQuery({ queryKey: qk.managed.intakes, queryFn: managedApi.intakes });

  const refresh = () => qc.invalidateQueries({ queryKey: qk.managed.all });
  const propertiesQuery = {
    data: homes.data && mandates.data && intakes.data ? homes.data : undefined,
    isError: homes.isError || mandates.isError || intakes.isError,
    refetch: () => {
      homes.refetch();
      refresh();
    },
  };
  const properties = homes.data ?? [];
  const cards = feeCard.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Management"
        title="Get it managed"
        subtitle="By Sureground, or a vetted firm you choose"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={mandates.isRefetching || intakes.isRefetching}
            onRefresh={() => {
              refresh();
              homes.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <Text variant="callout" color="mutedForeground">
          Either way, Sureground holds the money and keeps the record, so the property’s history
          stays with you.
        </Text>
        <PressableScale
          onPress={() => router.push('/(app)/change-manager')}
          accessibilityRole="link"
        >
          <Text variant="callout" style={{ color: colors.primary, fontWeight: '600' }}>
            Already managed and want someone else? Change manager →
          </Text>
        </PressableScale>

        <SectionTitle icon={Sparkles} title="Let Sureground manage it" />
        <Text variant="callout" color="mutedForeground">
          One published fee card, a service commitment you can hold us to, and a portfolio manager.
          Ask below: we visit, then send a proposal to accept.
        </Text>
        {feeCard.isLoading ? (
          <ListSkeleton rows={2} variant="card" height={150} />
        ) : (
          cards.map((c) => (
            <FeeCard key={c.tier} card={c} highlight={c.tier === 'FULL_MANAGEMENT'} />
          ))
        )}

        <SectionTitle icon={Building2} title="Your properties" />
        <QueryState
          query={propertiesQuery}
          skeleton={<ListSkeleton rows={3} variant="card" height={110} />}
          isEmpty={properties.length === 0}
          empty={{
            icon: <Building2 size={32} color={colors.mutedForeground} />,
            title: 'No properties yet',
            description: 'Add a property first, then you can place it under management.',
          }}
        >
          {properties.map((p) => (
            <PropertyRow
              key={p.id}
              home={p}
              state={propertyState(p.id, mandates.data ?? [], intakes.data ?? [])}
              onRequest={() => setRequestFor(p)}
              onEnd={setEnding}
              onChanged={refresh}
            />
          ))}
        </QueryState>

        <SectionTitle icon={Briefcase} title="Vetted firms" />
        <Text variant="callout" color="mutedForeground">
          Independent agencies on Sureground, ranked by how they handle maintenance, then how much
          they run. Appoint one and it goes to them to accept, then to our team to verify.
        </Text>
        {firms.isLoading ? (
          <ListSkeleton rows={2} variant="card" height={100} />
        ) : (firms.data ?? []).length === 0 ? (
          <Card padding={0}>
            <EmptyState
              size="compact"
              title="No vetted firms yet"
              description="Agencies our team has vetted are listed here, ready for you to appoint."
            />
          </Card>
        ) : (
          (firms.data ?? []).map((f) => (
            <FirmCard
              key={f.id}
              firm={f}
              showRank={(firms.data ?? []).length >= 2}
              onAppoint={() => setAppointing(f)}
            />
          ))
        )}

        {(sla.data ?? []).length > 0 ? (
          <>
            <SectionTitle icon={Clock} title="Our service commitment" />
            <Text variant="callout" color="mutedForeground">
              Every Sureground-managed property follows the same targets for maintenance, by how
              urgent the issue is.
            </Text>
            <Card padding="none">
              {(sla.data ?? []).map((row, i) => (
                <View
                  key={row.priority}
                  style={{
                    padding: spacing.lg,
                    gap: 2,
                    borderTopWidth: i ? 1 : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {PRIORITY_LABEL[row.priority]}
                    </Text>
                    {row.emergencyRoutingEnabled ? <Badge label="Emergency" tone="danger" /> : null}
                  </View>
                  <Text variant="caption" color="mutedForeground">
                    Respond within {humanizeMinutes(row.responseTargetMinutes)} · resolve within{' '}
                    {humanizeMinutes(row.resolutionTargetMinutes)}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <Sheet
        open={!!requestFor}
        onClose={() => setRequestFor(null)}
        title={`Ask Sureground to manage ${requestFor?.name ?? ''}`}
      >
        {requestFor ? (
          <IntakeForm
            key={requestFor.id}
            home={requestFor}
            cards={cards}
            onDone={() => {
              setRequestFor(null);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={!!ending}
        onClose={() => setEnding(null)}
        title={ending && isPendingMandate(ending) ? 'Cancel the request' : 'End management'}
      >
        {ending ? (
          <EndForm
            key={ending.id}
            mandate={ending}
            onDone={() => {
              setEnding(null);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={!!appointing}
        onClose={() => setAppointing(null)}
        title={`Appoint ${appointing?.name ?? ''}`}
      >
        {appointing ? (
          <AppointForm
            key={appointing.id}
            firm={appointing}
            properties={properties}
            mandates={mandates.data ?? []}
            onDone={() => {
              setAppointing(null);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Clock; title: string }) {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}
    >
      <Icon size={18} color={colors.primary} />
      <Text variant="heading">{title}</Text>
    </View>
  );
}

function FeeCard({ card, highlight }: { card: ManagedTierCard; highlight: boolean }) {
  const { colors, spacing } = useTheme();
  return (
    <Card
      padding={spacing.lg}
      style={{
        gap: spacing.sm,
        borderWidth: highlight ? 1.5 : 0,
        borderColor: highlight ? colors.primary : 'transparent',
      }}
    >
      <Text variant="bodyStrong">{card.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
        <Text variant="display">{card.feePct}%</Text>
        <Text variant="callout" color="mutedForeground">
          of rent collected
        </Text>
      </View>
      <Text variant="callout" color="mutedForeground">
        {card.summary}
      </Text>
      {card.includes.map((line) => (
        <View key={line} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Check size={14} color={colors.success} style={{ marginTop: 3 }} />
          <Text variant="callout" style={{ flex: 1 }}>
            {line}
          </Text>
        </View>
      ))}
      <Text variant="caption" color="mutedForeground">
        Letting {card.lettingCommissionPct}% · renewal {card.renewalCommissionPct}% commission
      </Text>
    </Card>
  );
}

function PropertyRow({
  home,
  state,
  onRequest,
  onEnd,
  onChanged,
}: {
  home: MyHome;
  state: PropertyState;
  onRequest: () => void;
  onEnd: (m: Mandate) => void;
  onChanged: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const handover = useMutation({
    mutationFn: (id: string) => managedApi.recordHandover(id),
    onSuccess: () => {
      toast.show('Handover confirmed.', 'success');
      onChanged();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record the handover.'), 'error'),
  });

  const mandate = 'mandate' in state ? state.mandate : null;
  const notice = mandate?.noticeServedAt
    ? `${mandate.managerIsSureground ? 'Sureground' : (mandate.managerOrganizationName ?? 'Your manager')} served notice on ${formatDate(mandate.noticeServedAt)}; management ends ${formatDate(noticeEndsAt(mandate)!)}.`
    : null;
  const intake =
    state.kind === 'requested'
      ? state.intake
      : state.kind === 'sureground'
        ? state.settingUp
        : state.kind === 'firm'
          ? state.openIntake
          : null;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong">{home.name}</Text>
        <Text variant="caption" color="mutedForeground">
          {home.city}
        </Text>
      </View>

      {state.kind === 'sureground' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {state.mandate.servicingTier ? (
              <Badge label={TIER_LABEL[state.mandate.servicingTier]} tone="neutral" />
            ) : null}
            {state.settingUp ? (
              <Badge label="Being set up by Sureground" tone="info" />
            ) : (
              <Badge
                label={MANDATE_STATUS[state.mandate.status].label}
                tone={MANDATE_STATUS[state.mandate.status].tone}
              />
            )}
          </View>
          {state.mandate.managerName ? (
            <Text variant="caption" color="mutedForeground">
              Portfolio manager: {state.mandate.managerName}
            </Text>
          ) : null}
          {state.mandate.deliveryPartnerName ? (
            <Text variant="caption" color="mutedForeground">
              Delivered locally by {state.mandate.deliveryPartnerName}
            </Text>
          ) : null}
        </>
      ) : state.kind === 'firm' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          <Badge label={state.mandate.managerOrganizationName ?? 'A firm'} tone="neutral" />
          <Badge
            label={
              state.mandate.status !== 'ACTIVE'
                ? 'Firm pending'
                : state.mandate.noticeServedAt
                  ? 'Under notice'
                  : 'Managed by firm'
            }
            tone={
              state.mandate.status === 'ACTIVE' && !state.mandate.noticeServedAt
                ? 'success'
                : 'warning'
            }
          />
        </View>
      ) : state.kind === 'winding-down' ? (
        <Badge label="Ending: handover due" tone="warning" />
      ) : null}

      {notice ? (
        <Text variant="caption" color="mutedForeground">
          {notice}
        </Text>
      ) : null}

      {intake ? <IntakePanel intake={intake} onChanged={onChanged} /> : null}

      {state.kind === 'none' && state.declined ? (
        <Text variant="caption" color="mutedForeground">
          Sureground declined your last request: {state.declined.declinedReason}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {state.kind === 'none' ? (
          <Button label="Ask Sureground to manage" size="sm" onPress={onRequest} />
        ) : null}
        {state.kind === 'firm' && state.mandate.status === 'ACTIVE' && !state.openIntake ? (
          <Button label="Move to Sureground" size="sm" variant="secondary" onPress={onRequest} />
        ) : null}
        {mandate && (state.kind === 'sureground' || state.kind === 'firm') ? (
          <Button
            label={isPendingMandate(mandate) ? 'Cancel request' : 'End management'}
            size="sm"
            variant="ghost"
            onPress={() => onEnd(mandate)}
          />
        ) : null}
        {state.kind === 'winding-down' ? (
          <Button
            label="Confirm handover"
            size="sm"
            variant="secondary"
            loading={handover.isPending}
            onPress={() =>
              Alert.alert(
                'Confirm the handover?',
                'You and the manager have exchanged keys, balances and documents.',
                [
                  { text: 'Not yet', style: 'cancel' },
                  { text: 'Confirm', onPress: () => handover.mutate(state.mandate.id) },
                ]
              )
            }
          />
        ) : null}
      </View>
    </Card>
  );
}

function IntakePanel({ intake, onChanged }: { intake: ManagedIntake; onChanged: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const [agree, setAgree] = useState(false);
  const current =
    intake.status === 'ACCEPTED'
      ? INTAKE_STEPS.length
      : INTAKE_STEPS.findIndex((s) => s.status === intake.status);
  const p = intake.proposal;

  const accept = useMutation({
    mutationFn: () => managedApi.acceptProposal(intake.id),
    onSuccess: () => {
      toast.show('Accepted. Sureground takes it from here.', 'success');
      onChanged();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not accept the proposal.'), 'error'),
  });
  const withdraw = useMutation({
    mutationFn: () => managedApi.withdrawIntake(intake.id),
    onSuccess: () => {
      toast.show('Request withdrawn.', 'success');
      onChanged();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not withdraw the request.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {INTAKE_STEPS.map((s, i) => (
          <View key={s.status} style={{ flex: 1, gap: 4 }}>
            <View
              style={{
                height: 4,
                borderRadius: radius.full,
                backgroundColor:
                  i < current ? colors.success : i === current ? colors.primary : colors.border,
              }}
            />
            <Text
              variant="caption"
              style={{
                fontSize: 12,
                color: i === current ? colors.foreground : colors.mutedForeground,
              }}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      {intake.status === 'SUBMITTED' ? (
        <Text variant="callout" color="mutedForeground">
          We have your request. Next, Sureground books a site visit. Indicative fee{' '}
          {intake.indicativeFeePct}% of rent collected
          {intake.indicativeMonthlyFee !== null
            ? ` (about ${formatNaira(intake.indicativeMonthlyFee)} a month)`
            : ''}
          .
        </Text>
      ) : intake.status === 'ASSESSMENT_SCHEDULED' && intake.assessmentScheduledFor ? (
        <Text variant="callout" color="mutedForeground">
          {intake.assessorName ?? 'A Sureground assessor'} visits on{' '}
          {formatDateTime(intake.assessmentScheduledFor)}.
        </Text>
      ) : intake.status === 'ASSESSED' ? (
        <Text variant="callout" color="mutedForeground">
          We visited. Your proposal is being prepared.
        </Text>
      ) : intake.status === 'ACCEPTED' ? (
        <Text variant="callout" color="mutedForeground">
          You accepted on {formatDate(intake.acceptedAt ?? intake.createdAt)}. Sureground assigns
          your portfolio manager and takes over once the opening balances are confirmed.
        </Text>
      ) : null}

      {intake.status === 'PROPOSED' && p ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: radius.md,
            padding: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Text variant="bodyStrong">
            Our proposal: {p.tierName} at {p.feePct}% of rent collected
          </Text>
          <Text variant="caption" color="mutedForeground">
            Letting {p.lettingCommissionPct}% · renewal {p.renewalCommissionPct}%
            {p.expiresAt ? ` · valid until ${formatDate(p.expiresAt)}` : ''}
          </Text>
          {p.includes.map((line) => (
            <View key={line} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Check size={14} color={colors.success} style={{ marginTop: 3 }} />
              <Text variant="callout" style={{ flex: 1 }}>
                {line}
              </Text>
            </View>
          ))}
          {p.exclusions ? <Text variant="callout">Not included: {p.exclusions}</Text> : null}
          {p.note ? (
            <Text variant="callout" color="mutedForeground">
              {p.note}
            </Text>
          ) : null}
          {intake.findings ? (
            <Text variant="callout" color="mutedForeground">
              From our visit: {intake.findings}
            </Text>
          ) : null}
          {intake.proposalExpired ? (
            <FormAlert
              tone="warning"
              message="This proposal has lapsed. Contact Sureground for a fresh one."
            />
          ) : (
            <>
              <Checkbox
                checked={agree}
                onChange={setAgree}
                label="I agree to Sureground managing this property on these terms. Accepting signs the management agreement."
              />
              <Button
                label="Accept and sign"
                loading={accept.isPending}
                disabled={!agree || accept.isPending}
                onPress={() => accept.mutate()}
              />
            </>
          )}
        </View>
      ) : null}

      {intake.status !== 'ACCEPTED' ? (
        <Button
          label="Withdraw request"
          size="sm"
          variant="ghost"
          loading={withdraw.isPending}
          onPress={() =>
            Alert.alert('Withdraw this request?', 'You can ask again later.', [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Withdraw', style: 'destructive', onPress: () => withdraw.mutate() },
            ])
          }
        />
      ) : null}
    </View>
  );
}

function IntakeForm({
  home,
  cards,
  onDone,
}: {
  home: MyHome;
  cards: ManagedTierCard[];
  onDone: () => void;
}) {
  const { spacing, radius, colors } = useTheme();
  const toast = useToast();
  const [tier, setTier] = useState<ServicingTier>('FULL_MANAGEMENT');
  const [propertyClass, setPropertyClass] = useState<PropertyClass>('BLOCK_OF_FLATS');
  const [units, setUnits] = useState('1');
  const [occupied, setOccupied] = useState('0');
  const [rentRoll, setRentRoll] = useState('');
  const [needs, setNeeds] = useState<string[]>(['Collect rent']);
  const [notes, setNotes] = useState('');
  const card = cards.find((c) => c.tier === tier);
  const annual = Math.round(Number(rentRoll) || 0);
  const monthly = card ? indicativeMonthly(annual, card.feePct) : null;
  const blocker = intakeBlocker(units, occupied);

  const submit = useMutation({
    mutationFn: () =>
      managedApi.submitIntake({
        propertyId: home.id,
        requestedTier: tier,
        propertyClass,
        unitCount: Number(units),
        occupiedUnits: Number(occupied),
        ...(annual > 0 ? { annualRentRoll: annual } : {}),
        serviceNeeds: needs,
        ...(notes.trim() ? { ownerNotes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      toast.show('Request sent. Sureground books a site visit next.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your request.'), 'error'),
  });

  const toggle = (need: string) =>
    setNeeds((prev) => (prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]));

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        Tell us about the property. We visit, then send you a proposal. Nothing is agreed until you
        accept it.
      </Text>
      <ChipSelect
        label="Service level"
        options={cards.map((c) => ({ value: c.tier, label: `${c.name} · ${c.feePct}%` }))}
        value={tier}
        onChange={setTier}
      />
      <ChipSelect
        label="What kind of property is it?"
        options={PROPERTY_CLASSES}
        value={propertyClass}
        onChange={setPropertyClass}
      />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <NumberField label="Units" value={units} onValueChange={setUnits} />
        </View>
        <View style={{ flex: 1 }}>
          <NumberField label="Occupied now" value={occupied} onValueChange={setOccupied} />
        </View>
      </View>
      <NumberField
        currency
        label="Rent a year across the property (optional)"
        value={rentRoll}
        onValueChange={setRentRoll}
        hint="Used for the fee estimate."
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground">
          What do you need help with?
        </Text>
        {SERVICE_NEEDS.map((need) => (
          <Checkbox
            key={need}
            checked={needs.includes(need)}
            onChange={() => toggle(need)}
            label={need}
          />
        ))}
      </View>
      <TextField
        label="Anything we should know? (optional)"
        placeholder="Current manager, tenants in arrears, repairs outstanding…"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      {card ? (
        <View
          style={{
            backgroundColor: colors.secondary,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Text variant="callout" style={{ fontWeight: '600' }}>
            Indicative fee: {card.feePct}% of rent collected
            {monthly !== null ? ` (about ${formatNaira(monthly)} a month)` : ''}
          </Text>
          <Text variant="caption" color="mutedForeground">
            Not binding. Your proposal follows our site visit. Letting {card.lettingCommissionPct}%,
            renewal {card.renewalCommissionPct}%.
          </Text>
        </View>
      ) : null}
      {blocker ? (
        <Text variant="caption" color="mutedForeground">
          {blocker}
        </Text>
      ) : null}
      <Button
        label="Send request"
        loading={submit.isPending}
        disabled={!!blocker || submit.isPending}
        onPress={() => submit.mutate()}
      />
    </View>
  );
}

function EndForm({ mandate, onDone }: { mandate: Mandate; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const pending = isPendingMandate(mandate);
  const [reason, setReason] = useState('');
  const breakFee = useQuery({
    queryKey: qk.managed.breakFee(mandate.id),
    queryFn: () => managedApi.breakFee(mandate.id),
    enabled: !pending && mandate.managerIsSureground,
    retry: false,
  });
  const end = useMutation({
    mutationFn: () => managedApi.terminate(mandate.id, reason.trim()),
    onSuccess: () => {
      toast.show(pending ? 'Request cancelled.' : 'Management ended.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not end the engagement.'), 'error'),
  });
  const short = reason.trim().length < END_REASON_MIN;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {pending
          ? 'Withdraw this request. Nothing has started, so there is nothing to settle.'
          : 'The manager’s access stops immediately. Sureground then prepares your final statement with rent collected to date, fees and any break fee. You and the manager then exchange keys, balances and documents, and you confirm the handover here.'}
      </Text>
      {breakFee.data ? (
        <FormAlert
          tone={breakFee.data.waived ? 'info' : 'warning'}
          message={
            breakFee.data.waived
              ? `No break fee. ${breakFee.data.reason}`
              : `Notice-in-lieu of ${formatNaira(breakFee.data.amount)} (${breakFee.data.reason}) will be added to your final statement.`
          }
        />
      ) : null}
      <TextField
        label="Why are you ending it?"
        value={reason}
        onChangeText={setReason}
        multiline
        hint={
          short
            ? `At least ${END_REASON_MIN} characters (${reason.trim().length}/${END_REASON_MIN}).`
            : 'Shared with the manager and kept on the record.'
        }
        required
      />
      <Button
        label={pending ? 'Cancel the request' : 'End management'}
        variant="destructive"
        loading={end.isPending}
        disabled={short || end.isPending}
        onPress={() => end.mutate()}
      />
    </View>
  );
}

function FirmCard({
  firm: f,
  showRank,
  onAppoint,
}: {
  firm: VettedFirm;
  showRank: boolean;
  onAppoint: () => void;
}) {
  const { spacing } = useTheme();
  const onTime =
    f.maintenance.slaOnTimeRate !== null ? Math.round(f.maintenance.slaOnTimeRate * 100) : null;
  const facts = [
    `${f.teamSize} on the team`,
    f.activeEngagements > 0
      ? `Manages ${f.activeEngagements} ${f.activeEngagements === 1 ? 'property' : 'properties'} now`
      : 'Not managing any yet',
    onTime !== null
      ? `${onTime}% of repairs on time${f.maintenance.averageResolutionDays !== null ? ` · ~${f.maintenance.averageResolutionDays}d to resolve` : ''}`
      : 'No maintenance handled yet',
    `On Sureground since ${formatDate(f.since, 'short')}`,
  ];
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {f.name}
        </Text>
        {showRank ? (
          f.rank === 1 ? (
            <Badge label="Top ranked" tone="success" />
          ) : (
            <Text variant="caption" color="mutedForeground">
              #{f.rank}
            </Text>
          )
        ) : null}
      </View>
      {facts.map((t) => (
        <Text key={t} variant="caption" color="mutedForeground">
          {t}
        </Text>
      ))}
      <Button label="Appoint" size="sm" variant="secondary" onPress={onAppoint} />
    </Card>
  );
}

function AppointForm({
  firm,
  properties,
  mandates,
  onDone,
}: {
  firm: VettedFirm;
  properties: MyHome[];
  mandates: Mandate[];
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const toast = useToast();
  const open = new Set(
    openForFirm(
      properties.map((p) => p.id),
      mandates
    )
  );
  const options = properties.filter((p) => open.has(p.id));
  const [propertyId, setPropertyId] = useState(options[0]?.id ?? '');
  const appoint = useMutation({
    mutationFn: () => managedApi.appointFirm(firm.id, propertyId),
    onSuccess: () => {
      toast.show(`Sent to ${firm.name} to accept.`, 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not appoint the firm.'), 'error'),
  });

  if (options.length === 0) {
    return (
      <FormAlert
        tone="info"
        message="All your properties already have a manager or one on the way."
      />
    );
  }
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        It goes to {firm.name} to accept, then to Sureground to verify before anything turns on. You
        and the firm agree the terms.
      </Text>
      <ChipSelect
        label="Which property"
        options={options.map((p) => ({ value: p.id, label: p.name }))}
        value={propertyId || undefined}
        onChange={setPropertyId}
      />
      <Button
        label="Appoint"
        loading={appoint.isPending}
        disabled={!propertyId || appoint.isPending}
        onPress={() => appoint.mutate()}
      />
    </View>
  );
}
