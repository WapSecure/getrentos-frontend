import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, Info, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  IconButton,
  ListSkeleton,
  NumberField,
  PressableScale,
  QueryState,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  JURISDICTIONS,
  NOTICE_KIND_LABEL,
  noticesApi,
  STATUTORY_KINDS,
  type NoticeKind,
  type NoticePeriodSettings,
  type TenancyNotice,
} from '@/lib/api/tenancyNotices';
import { landlordApi } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

type Tab = 'running' | 'periods';

/** Tenancies far enough along to receive a notice. */
const NOTICEABLE = new Set(['signed', 'active', 'expired']);

/**
 * Tenancy notices. The daily view is what is running and what runs out next;
 * the period register is configuration on its own tab, surfacing on the daily
 * view only when it is blocking something.
 */
export default function LandlordNotices() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('running');
  const [picking, setPicking] = useState(false);

  const running = useQuery({
    queryKey: qk.notices.running,
    queryFn: () => noticesApi.list('SERVED'),
  });
  const periods = useQuery({ queryKey: qk.notices.periods, queryFn: noticesApi.periods });

  // Soonest first: the whole point of this view is what runs out next.
  const notices = [...(running.data?.notices ?? [])].sort(
    (a, b) => (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity)
  );
  const soon = notices.filter((n) => n.daysRemaining !== null && n.daysRemaining <= 14).length;
  const unconfigured = periods.data?.unconfigured.length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Tenancies"
        title="Notices"
        subtitle={
          notices.length === 0
            ? 'Nothing is running'
            : soon > 0
              ? `${notices.length} running · ${soon} ending within 14 days`
              : `${notices.length} running`
        }
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setPicking(true)}
            accessibilityLabel="Open a tenancy to raise a notice"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
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
            refreshing={running.isRefetching || periods.isRefetching}
            onRefresh={() => {
              running.refetch();
              periods.refetch();
            }}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <SegmentedControl
          options={[
            { value: 'running', label: 'Running' },
            {
              value: 'periods',
              label: unconfigured > 0 ? `Periods (${unconfigured})` : 'Periods',
            },
          ]}
          value={tab}
          onChange={setTab}
          accessibilityLabel="Notices view"
        />

        {tab === 'running' ? (
          <>
            {unconfigured > 0 ? (
              <PressableScale
                onPress={() => setTab('periods')}
                accessibilityRole="button"
                accessibilityLabel="Record the missing notice periods"
              >
                <FormAlert
                  tone="warning"
                  title={`${unconfigured} notice ${unconfigured === 1 ? 'period is' : 'periods are'} unrecorded`}
                  message="A notice to quit or an intention to recover will be refused in those places until you record a number. Tap to record one."
                />
              </PressableScale>
            ) : null}

            <QueryState
              query={running}
              skeleton={<ListSkeleton rows={3} variant="card" height={88} />}
              errorTitle="We couldn't load your notices"
              isEmpty={notices.length === 0}
              empty={{
                icon: <BellRing size={32} color={colors.mutedForeground} />,
                title: 'Nothing is running',
                description: 'Open a tenancy to raise its first step.',
                action: <Button label="Open a tenancy" onPress={() => setPicking(true)} />,
              }}
            >
              {notices.map((n) => (
                <RunningRow key={n.id} notice={n} />
              ))}
            </QueryState>
          </>
        ) : (
          <QueryState
            query={periods}
            skeleton={<ListSkeleton rows={3} variant="card" height={120} />}
            errorTitle="We couldn't load your notice periods"
            errorDescription="Nothing was changed. Try again."
          >
            {periods.data ? <PeriodRegister settings={periods.data} /> : null}
          </QueryState>
        )}
      </ScrollView>

      <Sheet open={picking} onClose={() => setPicking(false)} title="Which tenancy?">
        <TenancyPicker
          onPick={(leaseId) => {
            setPicking(false);
            router.push(`/(app)/notice-ladder/${leaseId}`);
          }}
        />
      </Sheet>
    </View>
  );
}

function RunningRow({ notice: n }: { notice: TenancyNotice }) {
  const { spacing } = useTheme();
  const urgent = n.daysRemaining !== null && n.daysRemaining <= 14;
  return (
    <PressableScale
      onPress={() => router.push(`/(app)/notice-ladder/${n.leaseId}`)}
      accessibilityRole="button"
      accessibilityLabel={`${n.kindLabel}, ${n.property?.address ?? 'tenancy'}`}
    >
      <Card padding={spacing.lg} style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {n.property?.address ?? 'Tenancy'}
          </Text>
          {n.daysRemaining !== null ? (
            <Badge
              label={`${n.daysRemaining} ${n.daysRemaining === 1 ? 'day' : 'days'} left`}
              tone={urgent ? 'warning' : 'neutral'}
            />
          ) : null}
        </View>
        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {[n.kindLabel, n.property?.city, n.tenantName].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="caption" color="mutedForeground">
          {n.serviceDate ? `Served ${formatDate(n.serviceDate, 'short')}` : 'Not served'}
          {n.expiresAt ? ` · runs to ${formatDate(n.expiresAt, 'short')}` : ' · no set period'}
        </Text>
      </Card>
    </PressableScale>
  );
}

function TenancyPicker({ onPick }: { onPick: (leaseId: string) => void }) {
  const { spacing } = useTheme();
  const leases = useQuery({
    queryKey: qk.landlord.leases(1, 100),
    queryFn: () => landlordApi.leases(1, 100),
  });
  if (leases.isLoading) return <ListSkeleton rows={4} />;
  const options = (leases.data?.items ?? []).filter((l) => NOTICEABLE.has(l.status));
  if (options.length === 0) {
    return (
      <FormAlert tone="info" message="No signed tenancies yet. Notices are served on a tenancy." />
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((l) => (
        <PressableScale
          key={l.id}
          onPress={() => onPick(l.id)}
          accessibilityRole="button"
          accessibilityLabel={`${l.tenantName}, ${l.propertyName}`}
        >
          <Card padding={spacing.lg} style={{ gap: 2 }}>
            <Text variant="bodyStrong">{l.tenantName}</Text>
            <Text variant="caption" color="mutedForeground">
              {l.propertyName}
              {l.unitName ? ` · ${l.unitName}` : ''} · ends {formatDate(l.leaseEnd, 'short')}
            </Text>
          </Card>
        </PressableScale>
      ))}
    </View>
  );
}

/**
 * The period register and the worklist of what is still missing. The number
 * a landlord enters is theirs: the platform ships no day counts, so every
 * entry carries a basis and is recorded as the landlord's, not as authority.
 */
function PeriodRegister({ settings }: { settings: NoticePeriodSettings }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [jurisdiction, setJurisdiction] = useState('NG-LA');
  const [kind, setKind] = useState<NoticeKind>('NOTICE_TO_QUIT');
  const [days, setDays] = useState('');
  const [basis, setBasis] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['notices'] });
  const save = useMutation({
    mutationFn: () =>
      noticesApi.setPeriod({ jurisdiction, kind, days: Number(days), basis: basis.trim() }),
    onSuccess: () => {
      setDays('');
      setBasis('');
      refresh();
      toast.show('Period recorded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record the period.'), 'error'),
  });
  const clear = useMutation({
    mutationFn: (input: { jurisdiction: string; kind: NoticeKind }) =>
      noticesApi.clearPeriod(input),
    onSuccess: () => {
      refresh();
      toast.show('Your period was removed.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not remove the period.'), 'error'),
  });

  const daysNumber = Number(days);
  const canSave = Number.isInteger(daysNumber) && daysNumber > 0 && basis.trim().length >= 10;
  const missing = settings.unconfigured;
  const placeLabel = (code: string) => JURISDICTIONS.find((j) => j.value === code)?.label ?? code;

  return (
    <View style={{ gap: spacing.lg }}>
      {missing.length > 0 ? (
        <FormAlert
          tone="warning"
          title={`${missing.length} ${missing.length === 1 ? 'period is' : 'periods are'} still unrecorded`}
          message="Any notice that runs for a statutory period is refused there until a number is recorded. GetRentos holds no day count of its own, so it will not guess one."
        />
      ) : (
        <FormAlert
          tone="success"
          message="Every statutory period your properties need has a number recorded. Notices that run for a period can be served."
        />
      )}

      {missing.length > 0 ? (
        <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong" accessibilityRole="header">
            Still to confirm
          </Text>
          {missing.map((m) => (
            <View
              key={`${m.jurisdiction}|${m.kind}`}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.sm,
                padding: spacing.md,
                gap: 4,
              }}
            >
              <Text variant="callout" style={{ fontWeight: '600' }}>
                {NOTICE_KIND_LABEL[m.kind]} · {placeLabel(m.jurisdiction)}
              </Text>
              <Text variant="caption" color="mutedForeground">
                {m.basis}
              </Text>
              <Button
                label="Record this one"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setJurisdiction(m.jurisdiction);
                  setKind(m.kind);
                }}
              />
            </View>
          ))}
        </Card>
      ) : null}

      <Card padding={spacing.lg} style={{ gap: spacing.md }}>
        <Text variant="bodyStrong" accessibilityRole="header">
          Record a period
        </Text>
        <Text variant="caption" color="mutedForeground">
          The number and its basis are stored as yours, and shown beside every notice served under
          them.
        </Text>
        <ChipSelect
          label="Where"
          options={JURISDICTIONS}
          value={jurisdiction}
          onChange={setJurisdiction}
        />
        <ChipSelect
          label="Step"
          options={STATUTORY_KINDS.map((k) => ({ value: k, label: NOTICE_KIND_LABEL[k] }))}
          value={kind}
          onChange={setKind}
        />
        <NumberField
          label="Days"
          placeholder="90"
          value={days}
          onValueChange={setDays}
          hint="Whole days. Lagos ties the notice to the length of the tenancy, so check it for this tenancy first."
          editable={!save.isPending}
        />
        <TextField
          label="Basis"
          placeholder="Confirmed with counsel against the Lagos State Tenancy Law, 12 Oct."
          value={basis}
          onChangeText={setBasis}
          multiline
          hint="Where this number comes from: the provision, advice or date."
          editable={!save.isPending}
        />
        <Button
          label="Record period"
          loading={save.isPending}
          disabled={!canSave || save.isPending}
          onPress={() => save.mutate()}
        />
      </Card>

      <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="bodyStrong" accessibilityRole="header" style={{ flex: 1 }}>
            Recorded periods
          </Text>
          <Text variant="caption" color="mutedForeground">
            table {settings.tableVersion}
          </Text>
        </View>
        {settings.entries.length === 0 ? (
          <Text variant="callout" color="mutedForeground">
            Nothing recorded yet. Every statutory notice will be refused until something is.
          </Text>
        ) : (
          settings.entries.map((e) => (
            <View key={e.id} style={{ gap: 2, paddingVertical: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
                  {e.kindLabel} · {placeLabel(e.jurisdiction)}
                </Text>
                <Badge
                  label={e.scope === 'FIRM' ? 'Yours' : 'Shipped'}
                  tone={e.scope === 'FIRM' ? 'success' : 'neutral'}
                />
              </View>
              <Text variant="body">{e.days} days</Text>
              <Text variant="caption" color="mutedForeground">
                {e.basis}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Updated {formatDate(e.updatedAt, 'short')}
              </Text>
              {e.editable ? (
                <Button
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  disabled={clear.isPending}
                  onPress={() =>
                    Alert.alert('Remove this period?', 'Statutory notices there will be refused.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => clear.mutate({ jurisdiction: e.jurisdiction, kind: e.kind }),
                      },
                    ])
                  }
                />
              ) : null}
            </View>
          ))
        )}
      </Card>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          backgroundColor: colors.secondary,
          borderRadius: radius.md,
          padding: spacing.md,
        }}
      >
        <Info size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
        <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
          This register is a tracking record, not legal advice. The entries are yours, and the basis
          keeps the reasoning of the person who made them.
        </Text>
      </View>
    </View>
  );
}
