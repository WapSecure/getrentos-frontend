import { useState } from 'react';
import { View } from 'react-native';
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
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  deviceTimeZone,
  INSPECTION_FOCUS,
  LAND_TOUR_DISCLAIMER,
  landBuyerExtrasApi,
  PRE_PURCHASE_DISCLAIMER,
  type Deal,
} from '@/lib/api/landBuyerExtras';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';

type Target = { listingId: string } | { plotId: string };

const errorText = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Ask the seller for a live video tour of a listing or an estate plot. */
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
    onError: (e) => toast.show(errorText(e, 'Could not request the tour.'), 'error'),
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

/** Commission an independent inspection of a listing or an estate plot. */
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
    onError: (e) => toast.show(errorText(e, 'Could not commission the inspection.'), 'error'),
  });
  const toggle = (v: string) =>
    setFocus((f) => (f.includes(v) ? f.filter((x) => x !== v) : [...f, v]));
  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="callout" color="mutedForeground">
        {landName}. An accredited inspector visits within 10 days. Every photo is geotagged and
        timestamped, and GetRentos checks the report before you see it.
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

/**
 * Two-person approval on a deal: once on, money is released to the seller only
 * when the buyer and their representative have both approved each step.
 */
export function CoApprovalCard({ deal }: { deal: Deal }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const key = qk.buyerLand.coApproval(deal.kind, deal.id);
  const q = useQuery({
    queryKey: key,
    queryFn: () => landBuyerExtrasApi.coApproval(deal),
    retry: false,
  });
  const reps = useQuery({
    queryKey: qk.buyerLand.representatives,
    queryFn: landBuyerExtrasApi.representatives,
    enabled: q.data?.binding === false,
  });
  const [rep, setRep] = useState<string | undefined>();
  const done = (message: string) => () => {
    qc.invalidateQueries({ queryKey: key });
    toast.show(message, 'success');
  };
  const fail = (e: unknown) => toast.show(errorText(e, 'That did not go through.'), 'error');
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

  const c = q.data;
  if (!c) return null;
  const approvers = (reps.data ?? []).filter(
    (r) => r.status === 'ACTIVE' && r.scopes.includes('CO_APPROVE')
  );

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          Two-person approval
        </Text>
        <Badge label={c.binding ? 'On' : 'Off'} tone={c.binding ? 'success' : 'neutral'} />
      </View>
      {c.binding ? (
        <>
          <Text variant="callout" color="mutedForeground">
            Money is only released to the seller once you and{' '}
            {c.representative?.name ?? 'your representative'} have both approved each step.
          </Text>
          {(c.pending ?? []).map((p) => (
            <Text key={p.milestoneKey} variant="caption" color="mutedForeground">
              {p.milestoneKey.replace(/_/g, ' ').toLowerCase()}:{' '}
              {p.buyerApproved ? 'you approved' : 'waiting for you'} ·{' '}
              {p.representativeApproved
                ? 'representative approved'
                : 'waiting for your representative'}
            </Text>
          ))}
          {c.status === 'DISABLE_PENDING' ? (
            <>
              <FormAlert
                tone="warning"
                message={`Switches off on ${c.disableEffectiveAt ? formatDateTime(c.disableEffectiveAt) : 'soon'}. If you did not ask for this, keep it on and contact GetRentos.`}
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
            First appoint a representative who may approve payments.
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
            Have someone you trust give the second approval before money is released to the seller.
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
