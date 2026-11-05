import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ListSkeleton,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  emailOk,
  landBuyerExtrasApi,
  REP_RELATIONSHIPS,
  REP_SCOPES,
  REP_STATUS,
  type Appointment,
  type RepScope,
} from '@/lib/api/landBuyerExtras';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const scopeLabel = (s: RepScope) => REP_SCOPES.find((x) => x.value === s)?.label ?? s;

/** People the buyer trusts to follow purchases, attend tours and co-approve payments. */
export default function BuyerLandRepresentatives() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const q = useQuery({
    queryKey: qk.buyerLand.representatives,
    queryFn: landBuyerExtrasApi.representatives,
  });
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="My land"
        title="Representatives"
        subtitle="People you trust in Nigeria"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={q.isRefetching}
            onRefresh={() => q.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <Text variant="callout" color="mutedForeground">
          Buying land from abroad? Appoint people you trust in Nigeria to follow your purchases,
          attend site visits and approve payments with you. Video and representatives never replace
          official searches.
        </Text>
        <QueryState query={q} skeleton={<ListSkeleton rows={2} variant="card" height={100} />}>
          {(q.data ?? []).length === 0 ? (
            <Text variant="callout" color="mutedForeground">
              You have not appointed anyone yet.
            </Text>
          ) : (
            (q.data ?? []).map((a) => <AppointmentRow key={a.id} appointment={a} />)
          )}
        </QueryState>
        <AppointForm />
      </ScrollView>
    </View>
  );
}

function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState('');
  const end = useMutation({
    mutationFn: () => landBuyerExtrasApi.endAppointment(a.id, reason),
    onSuccess: (list) => {
      qc.setQueryData(qk.buyerLand.representatives, list);
      toast.show('Appointment ended.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not end the appointment.'), 'error'),
  });
  const status = REP_STATUS[a.status];
  const len = reason.trim().length;
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{a.name ?? a.email}</Text>
          <Text variant="caption" color="mutedForeground">
            {REP_RELATIONSHIPS.find((r) => r.value === a.relationship)?.label ?? a.relationship}
            {a.name ? ` · ${a.email}` : ''}
          </Text>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>
      {a.scopes.map((s) => (
        <Text key={s} variant="caption" color="mutedForeground">
          • {scopeLabel(s)}
        </Text>
      ))}
      {a.endedAt ? (
        <Text variant="caption" color="mutedForeground">
          Ended {formatDate(a.endedAt, 'short')}
          {a.endedReason ? `: ${a.endedReason}` : ''}
        </Text>
      ) : null}
      {a.status === 'INVITED' || a.status === 'ACTIVE' ? (
        ending ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Why are you ending it?"
              value={reason}
              onChangeText={setReason}
              maxLength={500}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="End appointment"
                size="sm"
                variant="destructive"
                loading={end.isPending}
                disabled={len < 3 || end.isPending}
                onPress={() => end.mutate()}
              />
              <Button label="Back" size="sm" variant="ghost" onPress={() => setEnding(false)} />
            </View>
          </View>
        ) : (
          <Button
            label="End appointment"
            size="sm"
            variant="ghost"
            onPress={() => setEnding(true)}
            style={{ alignSelf: 'flex-start' }}
          />
        )
      ) : null}
    </Card>
  );
}

function AppointForm() {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<string | undefined>();
  const [scopes, setScopes] = useState<RepScope[]>(['VIEW']);
  const [note, setNote] = useState('');
  const appoint = useMutation({
    mutationFn: () =>
      landBuyerExtrasApi.appoint({
        email: email.trim(),
        relationship: relationship!,
        scopes,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (list) => {
      qc.setQueryData(qk.buyerLand.representatives, list);
      toast.show('Invitation sent. They need to accept it.', 'success');
      setEmail('');
      setNote('');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send the invitation.'), 'error'),
  });
  const toggle = (s: RepScope) =>
    setScopes((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]));
  return (
    <Card style={{ gap: spacing.md }}>
      <Text variant="heading">Appoint someone</Text>
      <Text variant="caption" color="mutedForeground">
        They need a GetRentos account, and must verify their identity before they can approve
        payments. They accept the appointment themselves.
      </Text>
      <TextField
        label="Their email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ChipSelect
        label="Relationship"
        options={[...REP_RELATIONSHIPS]}
        value={relationship}
        onChange={setRelationship}
      />
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground">
          What they may do
        </Text>
        {REP_SCOPES.map((s) => (
          <Checkbox
            key={s.value}
            checked={scopes.includes(s.value)}
            onChange={() => toggle(s.value)}
            label={s.label}
          />
        ))}
      </View>
      <TextField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        maxLength={500}
        multiline
      />
      <Button
        label="Send invitation"
        loading={appoint.isPending}
        disabled={!emailOk(email) || !relationship || scopes.length === 0 || appoint.isPending}
        onPress={() => appoint.mutate()}
      />
    </Card>
  );
}
