import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, Download } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  DetailSkeleton,
  Divider,
  FormAlert,
  IconButton,
  Price,
  QueryState,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DEPOSIT_TREATMENT_LABEL,
  handoverActions,
  managementTransfersApi,
  type DepositTreatment,
  type Handover,
} from '@/lib/api/managementTransfers';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { shareDownloadedFile } from '@/lib/shareFile';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const TREATMENTS = (Object.keys(DEPOSIT_TREATMENT_LABEL) as DepositTreatment[]).map((t) => ({
  value: t,
  label: DEPOSIT_TREATMENT_LABEL[t],
}));

export default function HandoverScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [keys, setKeys] = useState('');
  const [deposits, setDeposits] = useState<
    Record<string, { treatment?: DepositTreatment; note: string }>
  >({});
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState('');

  const q = useQuery({
    queryKey: qk.transfers.handover(id),
    queryFn: () => managementTransfersApi.handover(id),
    enabled: !!id,
  });
  const done = (h: Handover, msg: string) => {
    qc.setQueryData(qk.transfers.handover(id), { ...q.data, ...h });
    qc.invalidateQueries({ queryKey: ['management-transfers'] });
    toast.show(msg, 'success');
  };
  const fail = (e: unknown) => toast.show(errorMessage(e, 'That did not go through.'), 'error');

  const h = q.data;
  const pack = h?.pack;
  const snap = pack?.snapshot;
  const outside = (snap?.leases ?? []).flatMap((l) =>
    l.deposit && !l.deposit.heldBySureground
      ? [{ ...l.deposit, tenant: l.tenant, unit: l.unit }]
      : []
  );

  const signOutgoing = useMutation({
    mutationFn: () =>
      managementTransfersApi.signOutgoing(id, {
        hash: pack!.hash,
        keysDeclaration: keys.trim(),
        deposits: outside.map((d) => ({
          depositHoldId: d.id,
          treatment: deposits[d.id]!.treatment!,
          note: deposits[d.id]?.note.trim() || undefined,
        })),
      }),
    onSuccess: (r) => done(r, 'Handover signed.'),
    onError: fail,
  });
  const sign = useMutation({
    mutationFn: (side: 'owner' | 'incoming') => managementTransfersApi.sign(id, side, pack!.hash),
    onSuccess: (r, side) => done(r, side === 'owner' ? 'Acknowledged.' : 'Handover accepted.'),
    onError: fail,
  });
  const dispute = useMutation({
    mutationFn: () => managementTransfersApi.dispute(id, disputeText.trim()),
    onSuccess: (r) => {
      setShowDispute(false);
      done(r, 'Handover disputed. Sureground will settle it before sign-off resumes.');
    },
    onError: fail,
  });
  const exportPack = useMutation({
    mutationFn: async () => {
      const data = await managementTransfersApi.exportHandover(id);
      const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2));
      await shareDownloadedFile(
        bytes,
        `handover-${id.slice(0, 8)}.json`,
        'application/json',
        'Handover pack'
      );
    },
    onError: fail,
  });

  if (!h) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <DetailScreenHeader eyebrow="Change of manager" title="Handover" onBack={() => goBack()} />
        <QueryState
          query={q}
          skeleton={<DetailSkeleton />}
          style={{ paddingHorizontal: spacing.xl }}
        >
          {null}
        </QueryState>
      </View>
    );
  }

  if (!pack || !snap) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <DetailScreenHeader eyebrow="Change of manager" title="Handover" onBack={() => goBack()} />
        <Text variant="callout" color="mutedForeground" style={{ padding: spacing.xl }}>
          The handover pack is made when the change of manager takes effect.
        </Text>
      </View>
    );
  }

  const { canOutgoing, canOwner, canIncoming, canDispute } = handoverActions(h);
  const outgoingReady = keys.trim().length >= 10 && outside.every((d) => deposits[d.id]?.treatment);
  const steps = [
    ...(h.required.outgoing
      ? [{ label: `${snap.outgoing ?? 'Outgoing manager'} signs`, at: pack.outgoingSignedAt }]
      : []),
    { label: 'Owner acknowledges', at: pack.ownerSignedAt },
    ...(h.required.incoming
      ? [{ label: `${snap.incoming} accepts`, at: pack.incomingSignedAt }]
      : []),
  ];
  const statusBadge =
    h.status === 'COMPLETED'
      ? { label: 'Completed', tone: 'success' as const }
      : h.status === 'DISPUTED'
        ? { label: 'Disputed', tone: 'danger' as const }
        : { label: 'Signing', tone: 'info' as const };

  const money: { label: string; value: number }[] = [
    { label: 'Rent owed by tenants', value: snap.totals.arrears },
    { label: 'Rent held for the owner', value: snap.totals.heldForOwner },
    { label: 'Tenant credit', value: snap.totals.credit },
    { label: 'Deposits with Sureground', value: snap.totals.depositsWithSureground },
    { label: 'Deposits outside Sureground', value: snap.totals.depositsOutside },
    { label: 'Owner’s money with Sureground', value: snap.ownerMoney.heldBySureground },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Handover"
        title={snap.property.name}
        subtitle={`${snap.outgoing ?? 'The owner'} → ${snap.incoming}, as at ${formatDate(snap.asOf)}`}
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => exportPack.mutate()}
            accessibilityLabel="Export the handover pack"
            icon={<Download size={20} color={colors.primary} />}
          />
        }
      />
      <QueryState query={q} style={{ paddingHorizontal: spacing.xl }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Badge label={statusBadge.label} tone={statusBadge.tone} />
            <Text variant="caption" color="mutedForeground">
              Pack {pack.hash.slice(0, 12)}
            </Text>
          </View>

          <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              Sign-off
            </Text>
            {steps.map((s) => (
              <View
                key={s.label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                {s.at ? (
                  <CheckCircle2 size={16} color={colors.success} />
                ) : (
                  <Circle size={16} color={colors.mutedForeground} />
                )}
                <Text variant="callout" color={s.at ? 'foreground' : 'mutedForeground'}>
                  {s.label}
                  {s.at ? ` · ${formatDate(s.at, 'short')}` : ''}
                </Text>
              </View>
            ))}
            {pack.disputeReason ? (
              <FormAlert
                tone="warning"
                title={`Disputed${pack.disputedAt ? ` ${formatDate(pack.disputedAt, 'short')}` : ''}`}
                message={`${pack.disputeReason}\n${
                  pack.disputeResolution
                    ? `Settled by Sureground: ${pack.disputeResolution}`
                    : 'Sureground will settle it before sign-off resumes.'
                }`}
              />
            ) : null}
          </Card>

          <Card padding={spacing.lg} style={{ gap: spacing.md }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              Money at handover
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
              {money.map((m) => (
                <View key={m.label} style={{ width: '50%', paddingRight: spacing.sm }}>
                  <Text variant="caption" color="mutedForeground">
                    {m.label}
                  </Text>
                  <Price amount={m.value} variant="bodyStrong" />
                </View>
              ))}
            </View>
            {snap.leases.length ? <Divider /> : null}
            {snap.leases.map((l) => (
              <View key={l.leaseId} style={{ gap: 2 }}>
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  {l.tenant}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {l.unit} · {formatDate(l.start, 'short')} – {formatDate(l.end, 'short')}
                </Text>
                <Text variant="caption" color="mutedForeground">
                  Rent {formatNaira(l.rent)} · owed {formatNaira(l.arrears)} · held{' '}
                  {formatNaira(l.heldForOwner)}
                  {l.deposit
                    ? ` · deposit ${formatNaira(l.deposit.amount)} ${
                        l.deposit.heldBySureground ? 'with Sureground' : 'outside Sureground'
                      }`
                    : ''}
                </Text>
              </View>
            ))}
          </Card>

          <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              Open work
            </Text>
            {snap.openWork.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                None.
              </Text>
            ) : (
              snap.openWork.map((w) => (
                <Text key={w.id} variant="caption" color="mutedForeground">
                  {w.category.toLowerCase().replace(/_/g, ' ')}: {w.description.slice(0, 80)} (
                  {w.status.toLowerCase()})
                </Text>
              ))
            )}
            <Text variant="bodyStrong" accessibilityRole="header" style={{ marginTop: spacing.sm }}>
              Open matters
            </Text>
            {snap.openItems.length === 0 ? (
              <Text variant="callout" color="mutedForeground">
                None.
              </Text>
            ) : (
              snap.openItems.map((i) => (
                <Text key={`${i.kind}-${i.id}`} variant="caption" color="mutedForeground">
                  • {i.label}
                </Text>
              ))
            )}
            <Text variant="bodyStrong" accessibilityRole="header" style={{ marginTop: spacing.sm }}>
              Records
            </Text>
            <Text variant="caption" color="mutedForeground">
              {snap.documents.length} document{snap.documents.length === 1 ? '' : 's'} ·{' '}
              {snap.inspections.length} inspection{snap.inspections.length === 1 ? '' : 's'}. They
              stay with the property; the incoming manager sees them from the effective date.
            </Text>
            {pack.keysDeclaration ? (
              <>
                <Text
                  variant="bodyStrong"
                  accessibilityRole="header"
                  style={{ marginTop: spacing.sm }}
                >
                  Keys and access
                </Text>
                <Text variant="caption" color="mutedForeground">
                  {pack.keysDeclaration}
                </Text>
              </>
            ) : null}
            {pack.depositAttestations?.length ? (
              <>
                <Text
                  variant="bodyStrong"
                  accessibilityRole="header"
                  style={{ marginTop: spacing.sm }}
                >
                  Deposits held outside Sureground
                </Text>
                {pack.depositAttestations.map((a) => (
                  <Text key={a.depositHoldId} variant="caption" color="mutedForeground">
                    {formatNaira(a.amount)}: {DEPOSIT_TREATMENT_LABEL[a.treatment]}
                    {a.note ? ` (${a.note})` : ''}
                  </Text>
                ))}
              </>
            ) : null}
          </Card>

          {canOutgoing ? (
            <Card padding={spacing.lg} style={{ gap: spacing.md }}>
              <Text variant="bodyStrong" accessibilityRole="header">
                Sign as the outgoing manager
              </Text>
              {outside.map((d) => (
                <View key={d.id} style={{ gap: spacing.sm }}>
                  <ChipSelect
                    label={`Deposit of ${formatNaira(d.amount)} (${d.tenant}, ${d.unit}) you held outside Sureground`}
                    options={TREATMENTS}
                    value={deposits[d.id]?.treatment}
                    onChange={(treatment) =>
                      setDeposits((s) => ({
                        ...s,
                        [d.id]: { note: s[d.id]?.note ?? '', treatment },
                      }))
                    }
                  />
                  <TextField
                    label="Reference or note"
                    optional
                    value={deposits[d.id]?.note ?? ''}
                    onChangeText={(note) =>
                      setDeposits((s) => ({ ...s, [d.id]: { ...s[d.id], note } }))
                    }
                  />
                </View>
              ))}
              <TextField
                label="Keys, codes and access handed over"
                placeholder="e.g. Two sets of keys, gate remote, alarm code shared with the new manager"
                value={keys}
                onChangeText={setKeys}
                multiline
                hint="At least 10 characters."
              />
              <Button
                label="Sign the handover"
                loading={signOutgoing.isPending}
                disabled={!outgoingReady || signOutgoing.isPending}
                onPress={() => signOutgoing.mutate()}
              />
            </Card>
          ) : null}

          {canOwner || canIncoming ? (
            <Card padding={spacing.lg} style={{ gap: spacing.md }}>
              <Text variant="callout">
                {canOwner
                  ? 'Acknowledge that this is the state of your property at the handover.'
                  : 'Accept the handover: you take over from this state.'}
              </Text>
              <Button
                label={canOwner ? 'Acknowledge' : 'Accept the handover'}
                loading={sign.isPending}
                disabled={sign.isPending}
                onPress={() => sign.mutate(canOwner ? 'owner' : 'incoming')}
              />
            </Card>
          ) : null}

          {canDispute ? (
            showDispute ? (
              <Card padding={spacing.lg} style={{ gap: spacing.md }}>
                <TextField
                  label="What is wrong with the handover?"
                  value={disputeText}
                  onChangeText={setDisputeText}
                  multiline
                  hint="At least 10 characters."
                />
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Dispute the handover"
                    variant="destructive"
                    loading={dispute.isPending}
                    disabled={disputeText.trim().length < 10 || dispute.isPending}
                    onPress={() => dispute.mutate()}
                    style={{ flex: 1 }}
                  />
                  <Button label="Cancel" variant="ghost" onPress={() => setShowDispute(false)} />
                </View>
              </Card>
            ) : (
              <Button
                label="Something isn’t right? Dispute instead of signing"
                variant="ghost"
                onPress={() => setShowDispute(true)}
              />
            )
          ) : null}
        </ScrollView>
      </QueryState>
    </View>
  );
}
