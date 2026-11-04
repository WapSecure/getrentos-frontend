import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRightLeft, CalendarClock } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DateField,
  FormAlert,
  ListSkeleton,
  RadioGroup,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  effectiveAtFor,
  lagosToday,
  managementTransfersApi,
  TRANSFER_STATUS,
  transferBlocker,
  type Incoming,
  type ManagementTransfer,
} from '@/lib/api/managementTransfers';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { useMyHomes } from '@/hooks/useMyHomes';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type IncomingKind = Incoming['kind'];

/**
 * Move a property to a verified firm, to GetRentos Managed, or back to
 * yourself. The current manager runs it until the date chosen; then their
 * access ends, the new manager's begins, and every tenant is told.
 */
export default function ChangeManager() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const homes = useMyHomes();

  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [fromMandateId, setFromMandateId] = useState('');
  const [incoming, setIncoming] = useState<Incoming>({ kind: 'GETRENTOS' });
  const [when, setWhen] = useState<'DATE' | 'ASAP'>('DATE');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const preview = useQuery({
    queryKey: qk.transfers.preview(propertyId ?? ''),
    queryFn: () => managementTransfersApi.preview(propertyId!),
    enabled: !!propertyId,
  });
  const firms = useQuery({ queryKey: qk.transfers.firms, queryFn: managementTransfersApi.firms });
  const transfers = useQuery({ queryKey: qk.transfers.mine, queryFn: managementTransfersApi.mine });

  const p = preview.data;
  const outgoing = p?.running.find((r) => r.mandateId === fromMandateId) ?? null;
  const effectiveAt = effectiveAtFor(when, date);
  const early =
    !!outgoing && !!effectiveAt && new Date(effectiveAt) < new Date(outgoing.noticeEndsAt);
  const blocker = transferBlocker({
    preview: p,
    fromMandateId,
    incoming,
    effectiveAt,
    acknowledged,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['management-transfers'] });

  const submit = useMutation({
    mutationFn: () =>
      managementTransfersApi.request({
        propertyId: propertyId!,
        fromMandateId: fromMandateId || undefined,
        incomingIsGetRentos: incoming.kind === 'GETRENTOS' || undefined,
        incomingOrganizationId: incoming.kind === 'FIRM' ? incoming.id : undefined,
        effectiveAt,
        reason: reason.trim() || undefined,
        acknowledgeOpenItems: acknowledged || undefined,
      }),
    onSuccess: (t) => {
      setMessage({
        ok: true,
        text:
          t.status === 'SWITCHED'
            ? `${t.propertyName} is now managed by ${t.incoming.manager}.`
            : `Scheduled: ${t.propertyName} moves to ${t.incoming.manager} on ${formatDate(t.effectiveAt)}. Until then nothing changes.`,
      });
      setPropertyId(undefined);
      setFromMandateId('');
      setReason('');
      setAcknowledged(false);
      invalidate();
    },
    onError: (e) =>
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Could not schedule it.' }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => managementTransfersApi.cancel(id),
    onSuccess: invalidate,
    onError: (e) =>
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Could not call it off.' }),
  });

  const pickProperty = (id: string) => {
    setPropertyId(id);
    setFromMandateId('');
    setAcknowledged(false);
    setMessage(null);
  };

  const incomingOptions: { value: IncomingKind; label: string; disabled?: boolean }[] = [
    // You cannot move a property to the manager you are ending.
    { value: 'GETRENTOS', label: 'GetRentos Managed', disabled: !!outgoing?.managerIsGetRentos },
    { value: 'FIRM', label: 'A verified firm' },
    { value: 'SELF', label: 'Me' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Management"
        title="Change manager"
        subtitle="Rent keeps going through GetRentos throughout"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={transfers.isRefetching}
            onRefresh={() => {
              transfers.refetch();
              if (propertyId) preview.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <Card padding={spacing.lg} style={{ gap: spacing.lg }}>
          <Text variant="callout" color="mutedForeground">
            Move a property to a verified firm, to GetRentos Managed, or back to yourself. The
            current manager runs it until the date you choose; then every tenant is told.
          </Text>

          {homes.isLoading ? (
            <ListSkeleton rows={2} />
          ) : (
            <ChipSelect
              label="Property"
              options={(homes.data ?? []).map((h) => ({ value: h.id, label: h.name }))}
              value={propertyId}
              onChange={pickProperty}
              emptyText="Add a property first."
            />
          )}

          {propertyId && preview.isLoading ? <ListSkeleton rows={2} /> : null}
          {preview.isError && !p ? (
            <FormAlert
              message={
                preview.error instanceof ApiError
                  ? preview.error.message
                  : 'Could not check this property.'
              }
            />
          ) : null}

          {p ? (
            <>
              {p.openTransferId ? (
                <FormAlert
                  tone="warning"
                  message="A change of manager is already scheduled for this property. Call it off below to set up a different one."
                />
              ) : null}

              {p.running.length === 0 ? (
                <View style={{ gap: 2 }}>
                  <Text variant="callout" style={{ fontWeight: '600' }}>
                    Managed now by
                  </Text>
                  <Text variant="callout" color="mutedForeground">
                    You manage it yourself.
                  </Text>
                </View>
              ) : (
                <RadioGroup
                  label="Managed now by"
                  variant="card"
                  value={fromMandateId}
                  onChange={(mandateId) => {
                    setFromMandateId(mandateId);
                    const r = p.running.find((x) => x.mandateId === mandateId);
                    if (r?.managerIsGetRentos && incoming.kind === 'GETRENTOS')
                      setIncoming({ kind: 'FIRM', id: '' });
                  }}
                  options={p.running.map((r) => ({
                    value: r.mandateId,
                    label: r.manager,
                    description: `${r.scope.map((s) => s.toLowerCase()).join(', ')} · ${r.noticePeriodDays} days’ notice, ending ${formatDate(r.noticeEndsAt)} if given today`,
                  }))}
                />
              )}

              <RadioGroup
                label="Who takes over"
                variant="card"
                value={incoming.kind}
                onChange={(kind) =>
                  setIncoming(kind === 'FIRM' ? { kind, id: '' } : ({ kind } as Incoming))
                }
                options={incomingOptions}
              />
              {incoming.kind === 'FIRM' ? (
                firms.isLoading ? (
                  <ListSkeleton rows={2} />
                ) : (
                  <ChipSelect
                    label="Firm"
                    options={(firms.data ?? []).map((f) => ({
                      value: f.id,
                      label: `${f.name} · ${f.activeEngagements} active`,
                    }))}
                    value={incoming.id || undefined}
                    onChange={(id) => setIncoming({ kind: 'FIRM', id })}
                    emptyText="No verified firms are available yet."
                  />
                )
              ) : null}

              <View style={{ gap: spacing.sm }}>
                <Text variant="callout" style={{ fontWeight: '600' }}>
                  When
                </Text>
                <SegmentedControl
                  options={[
                    { value: 'DATE', label: 'On a date' },
                    { value: 'ASAP', label: 'Straight away' },
                  ]}
                  value={when}
                  onChange={setWhen}
                  accessibilityLabel="When"
                />
                {when === 'DATE' ? (
                  <DateField
                    label="Change date"
                    value={date}
                    onChange={setDate}
                    min={lagosToday()}
                  />
                ) : null}
                {early && outgoing ? (
                  <Text variant="caption" color="warning">
                    This is before the end of {outgoing.manager}&apos;s notice period (
                    {formatDate(outgoing.noticeEndsAt)}).{' '}
                    {outgoing.managerIsGetRentos
                      ? 'GetRentos charges notice in lieu for an early end.'
                      : 'Check your agreement with them for early-exit terms.'}
                  </Text>
                ) : null}
              </View>

              <TextField
                label="Reason"
                optional
                value={reason}
                onChangeText={setReason}
                multiline
              />

              {p.openItems.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  <FormAlert
                    tone="warning"
                    title="Open on this property"
                    message={p.openItems.map((i) => `• ${i.label}`).join('\n')}
                  />
                  <Checkbox
                    checked={acknowledged}
                    onChange={setAcknowledged}
                    label="I’ve seen these. They carry over and are settled with the handover."
                  />
                </View>
              ) : null}

              <Button
                label="Schedule change of manager"
                loading={submit.isPending}
                loadingLabel="Scheduling…"
                disabled={!!blocker || submit.isPending}
                onPress={() => submit.mutate()}
              />
              <Text variant="caption" color="mutedForeground" center>
                {blocker ?? 'You’ll be asked to confirm it’s you.'}
              </Text>
            </>
          ) : null}

          {message ? (
            <FormAlert tone={message.ok ? 'success' : 'error'} message={message.text} />
          ) : null}
        </Card>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CalendarClock size={18} color={colors.primary} />
          <Text variant="bodyStrong" accessibilityRole="header">
            Changes of manager
          </Text>
        </View>
        {transfers.isLoading ? (
          <ListSkeleton rows={2} />
        ) : !transfers.data?.length ? (
          <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
            <ArrowRightLeft size={28} color={colors.mutedForeground} />
            <Text variant="callout" color="mutedForeground">
              None yet.
            </Text>
          </View>
        ) : (
          transfers.data.map((t) => (
            <TransferCard
              key={t.id}
              transfer={t}
              cancelling={cancel.isPending && cancel.variables === t.id}
              onCancel={() => cancel.mutate(t.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TransferCard({
  transfer: t,
  cancelling,
  onCancel,
}: {
  transfer: ManagementTransfer;
  cancelling: boolean;
  onCancel: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{t.propertyName}</Text>
          <Text variant="caption" color="mutedForeground">
            {t.outgoing ? `${t.outgoing.manager} → ` : 'You → '}
            {t.incoming.manager} · {formatDate(t.effectiveAt, 'short')}
          </Text>
          {t.status === 'OPEN' ? (
            <Text variant="caption" color="mutedForeground">
              {t.incoming.ready
                ? 'The new manager is set up and starts on the date.'
                : t.incoming.manager === 'the owner'
                  ? 'You take over on the date.'
                  : 'Waiting for the new manager’s engagement to be set up.'}
            </Text>
          ) : null}
        </View>
        <Badge label={TRANSFER_STATUS[t.status].label} tone={TRANSFER_STATUS[t.status].tone} />
      </View>
      {t.switchLog.map((l) => (
        <Text
          key={l.step}
          variant="caption"
          style={{ color: l.ok ? colors.mutedForeground : colors.destructive }}
        >
          {l.ok ? '✓' : '✗'} {l.note}
        </Text>
      ))}
      {t.status === 'OPEN' ? (
        <Button
          label="Call off"
          variant="ghost"
          size="sm"
          loading={cancelling}
          accessibilityLabel={`Call off the change for ${t.propertyName}`}
          onPress={onCancel}
        />
      ) : t.status !== 'CANCELLED' ? (
        <Button
          label="Open handover"
          variant="outline"
          size="sm"
          onPress={() => router.push(`/(app)/handover/${t.id}`)}
        />
      ) : null}
    </Card>
  );
}
