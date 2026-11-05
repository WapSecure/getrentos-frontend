import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ShieldCheck } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DateField,
  IconButton,
  ListSkeleton,
  NumberField,
  QueryState,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agencyFirmApi,
  ATTESTATION_STATUS,
  protectionProblem,
  type ProtectionAttestation,
} from '@/lib/api/agencyFirm';
import { formatDay } from '@/lib/api/agency';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

/** The firm's client-money protection: the scheme it belongs to and its cover. */
export default function AgencyProtection() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [adding, setAdding] = useState(false);
  const list = useQuery({ queryKey: qk.agency.protection, queryFn: agencyFirmApi.protection });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Agency"
        title="Client-money protection"
        subtitle="The scheme that protects the client money you hold"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setAdding(true)}
            accessibilityLabel="Add attestation"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.md,
        }}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => list.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <QueryState
          query={list}
          skeleton={<ListSkeleton rows={2} variant="card" height={110} />}
          isEmpty={!list.data?.length}
          empty={{
            icon: <ShieldCheck size={32} color={colors.mutedForeground} />,
            title: 'No protection attestations yet.',
            description: 'Record the client-money protection scheme your firm belongs to.',
            action: <Button label="Add attestation" onPress={() => setAdding(true)} />,
          }}
        >
          {(list.data ?? []).map((a) => (
            <AttestationCard key={a.id} attestation={a} />
          ))}
        </QueryState>
      </ScrollView>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add attestation">
        <AttestForm key={adding ? 'open' : 'closed'} onDone={() => setAdding(false)} />
      </Sheet>
    </View>
  );
}

function AttestationCard({ attestation: a }: { attestation: ProtectionAttestation }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const revoke = useMutation({
    mutationFn: () => agencyFirmApi.revokeAttestation(a.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.protection });
      toast.show('Attestation revoked.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not revoke it.'), 'error'),
  });
  const status = ATTESTATION_STATUS[a.status];
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {a.schemeName}
        </Text>
        <Badge label={status.label} tone={status.tone} />
      </View>
      <Text variant="caption" color="mutedForeground">
        {a.schemeReference ? `${a.schemeReference} · ` : ''}
        {a.coverageAmount ? `cover ${formatNaira(a.coverageAmount)} · ` : ''}
        {formatDay(a.effectiveFrom)} to {a.effectiveTo ? formatDay(a.effectiveTo) : 'open-ended'}
      </Text>
      <Text variant="caption" color="mutedForeground">
        {a.segregationConfirmed
          ? 'Client money held in a segregated client account'
          : 'Segregated client account not confirmed'}
        {a.attestedByName ? ` · attested by ${a.attestedByName}` : ''}
      </Text>
      {a.note ? <Text variant="callout">{a.note}</Text> : null}
      {a.status === 'ACTIVE' ? (
        <Button
          label="Revoke"
          size="sm"
          variant="ghost"
          loading={revoke.isPending}
          onPress={() =>
            Alert.alert('Revoke this attestation?', 'Owners will no longer see it as active.', [
              { text: 'Keep it', style: 'cancel' },
              { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate() },
            ])
          }
          style={{ alignSelf: 'flex-start' }}
        />
      ) : null}
    </Card>
  );
}

function AttestForm({ onDone }: { onDone: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [schemeName, setSchemeName] = useState('');
  const [reference, setReference] = useState('');
  const [cover, setCover] = useState('');
  const [from, setFrom] = useState(() => toISODate(new Date()));
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [segregated, setSegregated] = useState(true);
  const problem = protectionProblem({ schemeName, effectiveFrom: from, effectiveTo: to });
  const save = useMutation({
    mutationFn: () =>
      agencyFirmApi.attest({
        schemeName: schemeName.trim(),
        ...(reference.trim() ? { schemeReference: reference.trim() } : {}),
        ...(Number(cover) > 0 ? { coverageAmount: Math.round(Number(cover)) } : {}),
        segregationConfirmed: segregated,
        effectiveFrom: from,
        ...(to ? { effectiveTo: to } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.agency.protection });
      toast.show('Attestation recorded.', 'success');
      onDone();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record it.'), 'error'),
  });
  return (
    <View style={{ gap: spacing.lg }}>
      <TextField label="Scheme name" value={schemeName} onChangeText={setSchemeName} required />
      <TextField
        label="Membership or policy number (optional)"
        value={reference}
        onChangeText={setReference}
      />
      <NumberField
        currency
        label="Cover amount (optional)"
        value={cover}
        onValueChange={setCover}
      />
      <DateField label="Effective from" value={from} onChange={setFrom} required />
      <DateField
        label="Effective to (optional)"
        value={to}
        onChange={setTo}
        min={from}
        hint="Leave empty if it has no end date."
      />
      <TextField label="Note (optional)" value={note} onChangeText={setNote} multiline />
      <Checkbox
        checked={segregated}
        onChange={setSegregated}
        label="Client money is held in a segregated client account"
      />
      {problem && schemeName ? (
        <Text variant="caption" color="mutedForeground">
          {problem}
        </Text>
      ) : null}
      <Button
        label="Record attestation"
        loading={save.isPending}
        disabled={!!problem || save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
