import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  FormAlert,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import {
  approvalOutcomeMessage,
  coApprovalConfirmDescription,
  type CoApprovalPendingStep,
} from '@sureground/shared';
import { qk } from '@/lib/query/keys';
import {
  deviceTimeZone,
  INSPECTION_FOCUS,
  LAND_TOUR_DISCLAIMER,
  landBuyerExtrasApi,
  PRE_PURCHASE_DISCLAIMER,
  type Deal,
} from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';

type Target = { listingId: string } | { plotId: string };

export function RequestTour({
  target,
  landName,
  onDone,
}: {
  target: Target;
  landName: string;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [timeZone] = useState(deviceTimeZone);
  const [preferred, setPreferred] = useState('');
  const [attendee, setAttendee] = useState<string | undefined>();
  const [ack, setAck] = useState(false);
  const reps = useQuery({
    queryKey: qk.buyerLand.representatives,
    queryFn: landBuyerExtrasApi.representatives,
  });
  const attendees = (reps.data ?? []).filter(
    (r) => r.status === 'ACTIVE' && r.scopes.includes('ATTEND')
  );
  const send = useMutation({
    mutationFn: () =>
      landBuyerExtrasApi.requestTour({
        ...target,
        timeZone,
        ...(preferred.trim() ? { preferredTimes: preferred.trim() } : {}),
        ...(attendee ? { attendeeAppointmentId: attendee } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.tours });
      toast.show('Tour requested. The seller will offer times.', 'success');
      onDone();
      router.push('/(app)/buyer-land-tours');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not request the tour.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {landName}. The seller offers up to three times in daylight at the land; you see them in
        your own time zone ({timeZone}) and pick one.
      </Text>
      <TextField
        label="When suits you (optional)"
        placeholder="Weekday mornings, after 9am my time"
        value={preferred}
        onChangeText={setPreferred}
        maxLength={500}
        multiline
      />
      {attendees.length ? (
        <ChipSelect
          label="Invite a representative (optional)"
          options={attendees.map((a) => ({ value: a.id, label: a.name ?? a.email }))}
          value={attendee}
          onChange={(id) => setAttendee(id === attendee ? undefined : id)}
        />
      ) : null}
      <Checkbox checked={ack} onChange={setAck} label={LAND_TOUR_DISCLAIMER} />
      <Button
        label="Send request"
        loading={send.isPending}
        disabled={!ack || send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}

export function RequestInspection({
  target,
  landName,
  onDone,
}: {
  target: Target;
  landName: string;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [focus, setFocus] = useState<string[]>(INSPECTION_FOCUS.map((f) => f.value));
  const [notes, setNotes] = useState('');
  const [ack, setAck] = useState(false);
  const send = useMutation({
    mutationFn: () =>
      landBuyerExtrasApi.requestInspection({
        ...target,
        focus,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.buyerLand.inspections });
      toast.show('Inspection commissioned.', 'success');
      onDone();
      router.push('/(app)/buyer-land-inspections');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not commission the inspection.'), 'error'),
  });
  const toggle = (v: string) =>
    setFocus((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {landName}. An accredited inspector visits within 10 days. Every photo is geotagged and
        timestamped, and Sureground checks the report before you see it.
      </Text>
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground">
          What to look at
        </Text>
        {INSPECTION_FOCUS.map((f) => (
          <Checkbox
            key={f.value}
            checked={focus.includes(f.value)}
            onChange={() => toggle(f.value)}
            label={f.label}
          />
        ))}
      </View>
      <TextField
        label="Notes for the inspector (optional)"
        value={notes}
        onChangeText={setNotes}
        maxLength={1000}
        multiline
      />
      <Checkbox checked={ack} onChange={setAck} label={PRE_PURCHASE_DISCLAIMER} />
      <Button
        label="Commission inspection"
        loading={send.isPending}
        disabled={!ack || send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}

const CO_APPROVAL_COPY = {
  // Plot purchases and land resales: each step can release money held for the deal.
  steps: {
    on: (name: string) =>
      `Money is only released to the seller once you and ${name} have both approved each step.`,
    off: 'Buying from abroad? Require someone you trust in Nigeria to approve each step too, before any money is released to the seller.',
    representative:
      'The buyer asked that money is only released with your approval too. Approve a step only once you have seen the document or been on site yourself.',
  },
  // Built homes (D11): Sureground holds only the deposit, never the rest of the price.
  deposit: {
    on: (name: string) =>
      `The deposit held under Payment Protection is only released to the seller once you and ${name} have both approved the handover. Sureground does not hold the rest of the price.`,
    off: 'Buying from abroad? Require someone you trust in Nigeria to approve the handover too, before the deposit held under Payment Protection is released to the seller.',
    representative:
      'The buyer asked that the deposit is only released with your approval too. Approve only once you have seen the keys handed over or the document yourself.',
  },
} as const;

const humaniseKey = (key: string) => {
  const words = key.toLowerCase().replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * Two-person approval on a deal. The buyer turns it on or off (switching off takes 48 hours); the
 * representative it names gives the second approval here. Once on, money is released to the
 * seller only when both have approved.
 */
export function CoApprovalCard({
  deal,
  viewer = 'buyer',
  moneyScope = 'steps',
  labelFor = humaniseKey,
  onApproved,
}: {
  deal: Deal;
  viewer?: 'buyer' | 'representative';
  /** `deposit` for a built home, where only the held deposit is released. */
  moneyScope?: 'steps' | 'deposit';
  labelFor?: (milestoneKey: string) => string;
  /** After the representative approves, so the caller can refresh what depends on it. */
  onApproved?: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const isBuyer = viewer === 'buyer';
  const copy = CO_APPROVAL_COPY[moneyScope];
  const key = isBuyer
    ? qk.buyerLand.coApproval(deal.kind, deal.id)
    : qk.buyerLand.represented(deal.kind, `${deal.id}:co-approval`);
  const q = useQuery({
    queryKey: key,
    queryFn: () =>
      isBuyer
        ? landBuyerExtrasApi.coApproval(deal)
        : landBuyerExtrasApi.representedCoApproval(deal),
    retry: false,
  });
  const reps = useQuery({
    queryKey: qk.buyerLand.representatives,
    queryFn: landBuyerExtrasApi.representatives,
    enabled: isBuyer && q.data?.binding === false,
  });
  const [rep, setRep] = useState<string | undefined>();
  const done = (message: string) => () => {
    qc.invalidateQueries({ queryKey: key });
    toast.show(message, 'success');
  };
  const fail = (e: unknown) => toast.show(errorMessage(e, 'That did not go through.'), 'error');
  const on = useMutation({
    mutationFn: () => landBuyerExtrasApi.turnOnCoApproval(deal, rep!),
    onSuccess: done('Two-person approval is on.'),
    onError: fail,
  });
  const off = useMutation({
    mutationFn: () => landBuyerExtrasApi.disableCoApproval(deal),
    onSuccess: done('Two-person approval will switch off in 48 hours.'),
    onError: fail,
  });
  const keep = useMutation({
    mutationFn: () => landBuyerExtrasApi.keepCoApproval(deal),
    onSuccess: done('Two-person approval stays on.'),
    onError: fail,
  });
  const approve = useMutation({
    mutationFn: async (step: CoApprovalPendingStep): Promise<string> => {
      // A built home's handover approval also stands for the deposit release, which has its own route.
      if (step.releasesDeposit && deal.kind === 'sale') {
        const result = await landBuyerExtrasApi.approveDepositRelease(deal.id);
        return approvalOutcomeMessage(result.outcome);
      }
      await landBuyerExtrasApi.representativeApprove(deal, step.milestoneKey);
      return 'Your approval is recorded.';
    },
    onSuccess: (message) => {
      qc.invalidateQueries({ queryKey: key });
      onApproved?.();
      toast.show(message, 'success');
    },
    onError: fail,
  });

  const c = q.data;
  if (!c) return null;
  // A representative who does not hold the rule has nothing to approve here.
  if (!isBuyer && !c.binding) return null;
  const approvers = (reps.data ?? []).filter(
    (r) => r.status === 'ACTIVE' && r.scopes.includes('CO_APPROVE')
  );
  const stepLabel = (step: CoApprovalPendingStep) =>
    step.releasesDeposit
      ? `${labelFor(step.milestoneKey)} (approves the deposit release)`
      : labelFor(step.milestoneKey);
  const confirmApprove = (step: CoApprovalPendingStep) =>
    Alert.alert(
      'Give your approval?',
      coApprovalConfirmDescription({
        viewer: isBuyer ? 'buyer' : 'representative',
        stepLabel: stepLabel(step),
        releasesDeposit: step.releasesDeposit,
        representativeName: c.representative?.name,
      }),
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Approve', onPress: () => approve.mutate(step) },
      ]
    );

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Two-person approval
        </Text>
        <Badge
          label={c.binding ? (c.status === 'DISABLE_PENDING' ? 'Switching off' : 'On') : 'Off'}
          tone={c.binding ? (c.status === 'DISABLE_PENDING' ? 'warning' : 'success') : 'neutral'}
        />
      </View>
      {c.binding ? (
        <>
          <Text variant="callout" color="mutedForeground">
            {isBuyer
              ? copy.on(c.representative?.name ?? 'your representative')
              : copy.representative}
          </Text>
          {(c.pending ?? []).map((p) => (
            <View key={p.milestoneKey} style={{ gap: spacing.xs }}>
              <Text variant="callout">{stepLabel(p)}</Text>
              <Text variant="caption" color="mutedForeground">
                {isBuyer
                  ? `${p.buyerApproved ? 'You approved' : 'Waiting for you'} · ${
                      p.representativeApproved
                        ? 'representative approved'
                        : 'waiting for your representative'
                    }`
                  : `${p.buyerApproved ? 'The buyer approved' : 'Waiting for the buyer'} · ${
                      p.representativeApproved ? 'you approved' : 'waiting for you'
                    }`}
              </Text>
              {!isBuyer && !p.representativeApproved ? (
                <Button
                  label="Approve"
                  size="sm"
                  loading={approve.isPending && approve.variables?.milestoneKey === p.milestoneKey}
                  disabled={approve.isPending}
                  onPress={() => confirmApprove(p)}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </View>
          ))}
          {!isBuyer ? null : c.status === 'DISABLE_PENDING' ? (
            <>
              <FormAlert
                tone="warning"
                message={`Switches off on ${c.disableEffectiveAt ? formatDateTime(c.disableEffectiveAt) : 'soon'}. If you did not ask for this, keep it on and contact Sureground.`}
              />
              <Button
                label="Keep it on"
                size="sm"
                loading={keep.isPending}
                onPress={() => keep.mutate()}
              />
            </>
          ) : (
            <Button
              label="Switch off (takes 48 hours)"
              size="sm"
              variant="ghost"
              loading={off.isPending}
              onPress={() => off.mutate()}
              style={{ alignSelf: 'flex-start' }}
            />
          )}
        </>
      ) : approvers.length === 0 ? (
        <>
          <Text variant="callout" color="mutedForeground">
            {copy.off} First appoint a representative who may approve payments.
          </Text>
          <Button
            label="Representatives"
            size="sm"
            variant="secondary"
            onPress={() => router.push('/(app)/buyer-land-representatives')}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      ) : (
        <>
          <Text variant="callout" color="mutedForeground">
            {copy.off}
          </Text>
          <ChipSelect
            options={approvers.map((a) => ({ value: a.id, label: a.name ?? a.email }))}
            value={rep}
            onChange={setRep}
          />
          <Button
            label="Turn on"
            size="sm"
            loading={on.isPending}
            disabled={!rep || on.isPending}
            onPress={() => on.mutate()}
          />
        </>
      )}
    </Card>
  );
}
