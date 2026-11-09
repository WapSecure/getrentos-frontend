import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, Clock, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DateField,
  DetailSkeleton,
  FormAlert,
  NumberField,
  QueryState,
  SwitchRow,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  AMOUNT_KINDS,
  NOTICE_KIND_LABEL,
  NOTICE_STATE,
  noticeFacts,
  noticesApi,
  raiseBlocker,
  SERVICE_METHODS,
  STATUTORY_KINDS,
  type LeaseLadder,
  type NoticeServiceMethod,
  type TenancyNotice,
} from '@/lib/api/tenancyNotices';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** Serving a step early is fatal to the claim: raising is only ever the next step, and a block is stated with its date. */
export default function NoticeLadderScreen() {
  const { leaseId } = useLocalSearchParams<{ leaseId: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [raising, setRaising] = useState(false);
  const [serving, setServing] = useState<TenancyNotice | null>(null);

  const ladder = useQuery({
    queryKey: qk.notices.ladder(leaseId),
    queryFn: () => noticesApi.ladder(leaseId),
    enabled: !!leaseId,
  });
  const periods = useQuery({ queryKey: qk.notices.periods, queryFn: noticesApi.periods });
  const l = ladder.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Notices on this tenancy"
        title={l?.lease.property.address ?? 'Tenancy'}
        subtitle={
          l
            ? [l.lease.property.city, l.lease.tenantName ?? 'Tenant not named', l.jurisdiction]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        onBack={() => goBack()}
      />
      <QueryState
        query={ladder}
        skeleton={
          <View style={{ paddingHorizontal: spacing.xl }}>
            <DetailSkeleton />
          </View>
        }
        errorTitle="This tenancy did not load"
        errorDescription="It may not be one you can read."
      >
        {l ? (
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.xl,
              paddingBottom: insets.bottom + spacing['3xl'],
              gap: spacing.lg,
            }}
            refreshControl={
              <RefreshControl
                refreshing={ladder.isRefetching}
                onRefresh={() => ladder.refetch()}
                tintColor={colors.mutedForeground}
              />
            }
          >
            {l.next && l.nextBlockedReason ? (
              <FormAlert
                tone="warning"
                title={`${NOTICE_KIND_LABEL[l.next.kind]} is not available yet`}
                message={
                  l.next.blockedUntil
                    ? `${l.nextBlockedReason} Available from ${formatDate(l.next.blockedUntil)}.`
                    : l.nextBlockedReason
                }
              />
            ) : null}

            {l.jurisdictionFellBack ? (
              <FormAlert
                tone="warning"
                message={`The property's state is recorded as "${l.jurisdictionDerivedFrom}", which does not match a jurisdiction, so this tenancy is read against ${l.jurisdiction}. Check the property before relying on any period here.`}
              />
            ) : null}

            {l.next && !l.nextBlockedReason ? (
              <Button
                label={`Raise ${NOTICE_KIND_LABEL[l.next.kind].toLowerCase()}`}
                icon={<Plus size={16} color={colors.primaryForeground} />}
                onPress={() => setRaising(true)}
              />
            ) : null}

            {l.notices.length === 0 ? (
              <Card padding={spacing.lg} style={{ gap: 4 }}>
                <Text variant="bodyStrong">Nothing has been served yet</Text>
                <Text variant="callout" color="mutedForeground">
                  {l.next
                    ? `The first step is the ${NOTICE_KIND_LABEL[l.next.kind].toLowerCase()}.`
                    : 'This tenancy is at the top of the ladder.'}
                </Text>
              </Card>
            ) : (
              l.notices.map((n) => (
                <NoticeStep key={n.id} notice={n} onServe={() => setServing(n)} />
              ))
            )}

            {l.next && !l.nextBlockedReason ? (
              <Text variant="caption" color="mutedForeground">
                Next step: {NOTICE_KIND_LABEL[l.next.kind]}. Its period comes from your register for{' '}
                {l.jurisdiction}.
              </Text>
            ) : null}
          </ScrollView>
        ) : null}
      </QueryState>

      <Sheet open={raising} onClose={() => setRaising(false)} title="Raise a notice">
        {l?.next ? (
          <RaiseForm
            key={raising ? 'open' : 'closed'}
            ladder={l}
            missingPeriod={
              STATUTORY_KINDS.includes(l.next.kind)
                ? periods.data?.unconfigured.find(
                    (u) => u.jurisdiction === l.jurisdiction && u.kind === l.next!.kind
                  )
                : undefined
            }
            onDone={() => setRaising(false)}
          />
        ) : null}
      </Sheet>

      <Sheet open={!!serving} onClose={() => setServing(null)} title="Record service">
        {serving ? (
          <ServeForm
            key={serving.id}
            notice={serving}
            leaseId={leaseId}
            onDone={() => setServing(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function NoticeStep({ notice: n, onServe }: { notice: TenancyNotice; onServe: () => void }) {
  const { colors, spacing } = useTheme();
  const spent = n.state === 'WITHDRAWN' || n.state === 'SUPERSEDED';
  const Mark = n.state === 'EXPIRED' ? CheckCircle2 : n.state === 'SERVED' ? Clock : Circle;
  const markColor =
    n.state === 'EXPIRED' ? colors.success : n.state === 'SERVED' ? colors.primary : colors.border;
  const basis =
    n.periodDays !== null && (n.periodSource === 'FIRM_OVERRIDE' || n.periodSource === 'MANUAL')
      ? n.periodBasis
      : null;

  return (
    <Card padding={spacing.lg} style={{ flexDirection: 'row', gap: spacing.md }}>
      <Mark size={18} color={markColor} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text
            variant="bodyStrong"
            style={{ flex: 1, color: spent ? colors.mutedForeground : colors.foreground }}
          >
            {n.kindLabel}
          </Text>
          <Badge label={NOTICE_STATE[n.state].label} tone={NOTICE_STATE[n.state].tone} />
        </View>
        {n.reason ? (
          <Text variant="callout" color="mutedForeground">
            {n.reason}
            {n.arrearsAmount !== null ? ` · arrears ${formatNaira(n.arrearsAmount)}` : ''}
          </Text>
        ) : null}
        <Text variant="caption" color="mutedForeground">
          {noticeFacts(n, (iso) => formatDate(iso)).join(' · ')}
        </Text>
        {n.evidenceNote && !spent ? (
          <Text variant="caption" color="mutedForeground">
            Proof of service: {n.evidenceNote}
          </Text>
        ) : null}
        {basis ? (
          <Text variant="caption" color="mutedForeground">
            Recorded on: {basis}
          </Text>
        ) : null}
        {n.state === 'DRAFT' ? (
          <Button
            label="Record service"
            size="sm"
            onPress={onServe}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}
      </View>
    </Card>
  );
}

function RaiseForm({
  ladder,
  missingPeriod,
  onDone,
}: {
  ladder: LeaseLadder;
  missingPeriod?: { jurisdiction: string; basis: string };
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const kind = ladder.next!.kind;
  const [reason, setReason] = useState('');
  const [arrears, setArrears] = useState('');
  const [ownPeriod, setOwnPeriod] = useState(false);
  const [manualDays, setManualDays] = useState('');
  const [manualBasis, setManualBasis] = useState('');

  const blocker = raiseBlocker({
    kind,
    reason,
    manualDays: ownPeriod ? manualDays : '',
    manualBasis,
    periodMissing: !!missingPeriod,
  });

  const raise = useMutation({
    mutationFn: () =>
      noticesApi.raise({
        leaseId: ladder.lease.id,
        kind,
        reason: reason.trim(),
        ...(arrears.trim() && AMOUNT_KINDS.includes(kind)
          ? { arrearsAmount: Number(arrears) }
          : {}),
        ...(ownPeriod && manualDays.trim()
          ? { manualDays: Number(manualDays), manualBasis: manualBasis.trim() }
          : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      toast.show('Notice raised. It is a draft until you record service.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not raise the notice.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="callout" color="mutedForeground">
          Step
        </Text>
        <Text variant="bodyStrong">{NOTICE_KIND_LABEL[kind]}</Text>
        <Text variant="caption" color="mutedForeground">
          The ladder is walked in order, so only the next step is offered.
        </Text>
      </View>

      {missingPeriod ? (
        <FormAlert
          tone="warning"
          title={`No period is recorded for this step in ${missingPeriod.jurisdiction}`}
          message={`${missingPeriod.basis} Record it under Periods, or enter a number for this one notice below.`}
        />
      ) : null}

      <TextField
        label="What the tenant is being told"
        placeholder="Rent for the current quarter has not been received…"
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={3}
        hint="At least 10 characters. This becomes part of the service record."
        required
      />

      {AMOUNT_KINDS.includes(kind) ? (
        <NumberField
          currency
          label="Arrears (optional)"
          value={arrears}
          onValueChange={setArrears}
          hint="Left blank, the notice carries no amount."
        />
      ) : null}

      <SwitchRow
        label="Enter a period for this notice only"
        description="Recorded as the least certain source, because it was typed rather than configured."
        value={ownPeriod}
        onValueChange={setOwnPeriod}
      />
      {ownPeriod ? (
        <>
          <NumberField
            label="Days"
            placeholder="90"
            value={manualDays}
            onValueChange={setManualDays}
          />
          <TextField
            label="Basis"
            placeholder="Counsel advised 30 days for this tenancy, on the call of 12 Oct."
            value={manualBasis}
            onChangeText={setManualBasis}
            multiline
            hint="Where the number came from. A number without one cannot be reviewed later."
          />
        </>
      ) : null}

      {blocker && reason.length > 0 ? (
        <Text variant="caption" color="mutedForeground">
          {blocker}
        </Text>
      ) : null}
      <Button
        label="Raise notice"
        loading={raise.isPending}
        disabled={!!blocker || raise.isPending}
        onPress={() => raise.mutate()}
      />
    </View>
  );
}

function ServeForm({
  notice: n,
  leaseId,
  onDone,
}: {
  notice: TenancyNotice;
  leaseId: string;
  onDone: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  // Declared, not defaulted to today: whether a period runs from the day of
  // service or the day after is interpretation, so the person serving says.
  const [serviceDate, setServiceDate] = useState('');
  const [method, setMethod] = useState<NoticeServiceMethod>('HAND_DELIVERY');
  const [evidence, setEvidence] = useState('');

  const serve = useMutation({
    mutationFn: () =>
      noticesApi.serve(n.id, {
        serviceDate,
        serviceMethod: method,
        ...(evidence.trim() ? { evidenceNote: evidence.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] });
      qc.invalidateQueries({ queryKey: qk.notices.ladder(leaseId) });
      toast.show('Service recorded. The period now runs from the date you gave.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record service.'), 'error'),
  });

  const source =
    n.periodSource === 'MANUAL'
      ? 'typed for this notice'
      : n.periodSource === 'FIRM_OVERRIDE'
        ? 'from your own recorded period'
        : 'from the reference table';

  return (
    <View style={{ gap: spacing.lg }}>
      <View
        style={{ backgroundColor: colors.secondary, borderRadius: radius.md, padding: spacing.md }}
      >
        <Text variant="callout" style={{ fontWeight: '600' }}>
          {n.kindLabel}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {n.periodDays === null
            ? 'This step runs for no set period, so serving it starts no countdown.'
            : `This will run for ${n.periodDays} days from the date you give, ${source}.`}
        </Text>
      </View>
      <DateField
        label="Date the period runs from"
        value={serviceDate}
        onChange={setServiceDate}
        max={toISODate(new Date())}
        required
        hint="The date you use to calculate expiry. Sureground won't assume whether it is the service date or the next day."
      />
      <ChipSelect
        label="How it was delivered"
        options={SERVICE_METHODS}
        value={method}
        onChange={setMethod}
      />
      <TextField
        label="Proof of service (optional)"
        placeholder="Handed to the tenant, who signed a copy."
        value={evidence}
        onChangeText={setEvidence}
        multiline
        hint="Who accepted it, what was attached, where it was left. This is what a court reads."
      />
      <Button
        label="Record service"
        loading={serve.isPending}
        disabled={!serviceDate || serve.isPending}
        onPress={() => serve.mutate()}
      />
    </View>
  );
}
