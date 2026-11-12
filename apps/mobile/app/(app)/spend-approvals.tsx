import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ShieldCheck, SlidersHorizontal } from '@sureground/icons/native';
import { bandsFromInputs } from '@sureground/shared';
import {
  Badge,
  Button,
  Card,
  CurrencyField,
  ListSkeleton,
  QueryState,
  SegmentedControl,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  managementApi,
  type AwaitingCountersign,
  type OwnerMandate,
  type SpendApprovalRole,
} from '@/lib/api/management';
import { relationshipLabel } from '@/lib/api/propertyAuthority';
import { errorMessage } from '@/lib/api/client';
import { withStepUpSummary } from '@/lib/stepUp';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import { SpendApprovalCard } from '@/components/management/SpendApprovalCard';

const ROLES: { value: SpendApprovalRole; label: string }[] = [
  { value: 'owner', label: 'To review' },
  { value: 'requester', label: 'My requests' },
];

export default function SpendApprovals() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<SpendApprovalRole>('owner');

  const list = useQuery({
    queryKey: qk.management.spendApprovals(role),
    queryFn: () => managementApi.spendApprovals(role, 1, 50),
  });
  const items = list.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Oversight"
        title="Approvals"
        subtitle="Spend above your limit waits for you"
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
            refreshing={list.isRefetching}
            onRefresh={() => void list.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
      >
        <CountersignSection />
        <ApprovalLimits />

        <SegmentedControl
          options={ROLES}
          value={role}
          onChange={setRole}
          accessibilityLabel="Whose requests"
        />

        <QueryState
          query={list}
          skeleton={<ListSkeleton rows={3} variant="card" height={120} />}
          isEmpty={items.length === 0}
          empty={{
            icon: <ShieldCheck size={32} color={colors.mutedForeground} />,
            title: role === 'owner' ? 'Nothing to review' : 'No requests',
            description:
              role === 'owner'
                ? 'Spend requests from your managers will appear here for you to approve.'
                : 'Spend you raise above the owner’s limit will appear here.',
          }}
        >
          {items.map((a) => (
            <SpendApprovalCard key={a.id} approval={a} role={role} />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function ApprovalLimits() {
  const { colors, spacing } = useTheme();
  const mandates = useQuery({
    queryKey: qk.management.mandates,
    queryFn: () => managementApi.myMandates(),
  });
  const active = (mandates.data ?? []).filter((m) => m.status === 'ACTIVE');
  if (active.length === 0) return null;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <SlidersHorizontal size={16} color={colors.mutedForeground} />
        <Text variant="bodyStrong" accessibilityRole="header">
          Spending limits
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        Spend above the routine limit waits for your approval. Leave a limit blank for none. Saving
        asks you to confirm it is you.
      </Text>
      {active.map((m) => (
        <BandsRow key={m.id} mandate={m} />
      ))}
    </Card>
  );
}

const BAND_FIELDS = [
  { key: 'routine', label: 'Routine', hint: 'Your manager spends up to this without asking you.' },
  {
    key: 'emergency',
    label: 'Emergency',
    hint: 'Urgent repairs up to this go ahead first, and you are told straight away.',
  },
  {
    key: 'explicit',
    label: 'Explicit authorisation',
    hint: 'Above this, you confirm it is you before approving.',
  },
] as const;

type BandKey = (typeof BAND_FIELDS)[number]['key'];

function BandsRow({ mandate }: { mandate: OwnerMandate }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const title = mandate.propertyTitle ?? 'this property';
  const [values, setValues] = useState<Record<BandKey, number | null>>({
    routine: mandate.bands?.routineCap ?? mandate.maintenanceApprovalCap ?? null,
    emergency: mandate.bands?.emergencyCap ?? null,
    explicit: mandate.bands?.explicitAbove ?? null,
  });
  const { bands, error } = bandsFromInputs({
    routine: values.routine ?? 0,
    emergency: values.emergency ?? 0,
    explicit: values.explicit ?? 0,
  });
  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(`Change the spending limits for ${title}`, () =>
        managementApi.setMandateBands(mandate.id, bands)
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.management.mandates });
      qc.invalidateQueries({ queryKey: qk.investor.managed });
      toast.show('Spending limits saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the limits.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">{mandate.propertyTitle ?? 'Property'}</Text>
      {BAND_FIELDS.map((field) => (
        <CurrencyField
          key={field.key}
          label={field.label}
          placeholder="No limit"
          hint={field.hint}
          value={values[field.key]}
          onValueChange={(next) => setValues((old) => ({ ...old, [field.key]: next }))}
          error={error?.field === field.key ? error.message : null}
          editable={!save.isPending}
        />
      ))}
      <Button
        label="Save limits"
        variant="secondary"
        size="sm"
        loading={save.isPending}
        disabled={save.isPending || !!error}
        onPress={() => save.mutate()}
        accessibilityLabel={`Save spending limits for ${title}`}
      />
    </View>
  );
}

/** A mandate on a jointly owned property takes effect only once every co-owner countersigns. */
function CountersignSection() {
  const { colors, spacing } = useTheme();
  const pending = useQuery({
    queryKey: qk.management.countersign,
    queryFn: () => managementApi.awaitingCountersign(),
  });
  if (!pending.data?.length) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ShieldCheck size={16} color={colors.primary} />
        <Text variant="bodyStrong" accessibilityRole="header">
          Claims awaiting your approval
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        Every co-owner must approve a manager or agent mandate, or a new co-owner, before it takes
        effect.
      </Text>
      {pending.data.map((m) => (
        <CountersignCard key={m.id} claim={m} />
      ))}
    </View>
  );
}

function CountersignCard({ claim: m }: { claim: AwaitingCountersign }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.management.countersign });

  const sign = useMutation({
    mutationFn: () => managementApi.countersign(m.id),
    onSuccess: (result) => {
      invalidate();
      toast.show(
        result.awaitingCountersign
          ? 'Countersigned. Waiting on the other co-owners.'
          : 'Countersigned. The mandate is now active.',
        'success'
      );
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not countersign.'), 'error'),
  });
  const decline = useMutation({
    mutationFn: () => managementApi.declineCountersign(m.id, reason.trim() || undefined),
    onSuccess: () => {
      invalidate();
      toast.show('Mandate declined.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not decline.'), 'error'),
  });
  const busy = sign.isPending || decline.isPending;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{relationshipLabel(m.relationship)}</Text>
          <Text variant="caption" color="mutedForeground">
            {m.propertyReferenceCode ?? 'Your property'}
            {m.note ? ` · ${m.note}` : ''}
          </Text>
        </View>
        {m.countersignRequired != null ? (
          <Badge
            label={`${m.countersignApproved ?? 0}/${m.countersignRequired} approved`}
            tone="warning"
          />
        ) : null}
      </View>
      {declining ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="Reason for declining (optional)"
            value={reason}
            onChangeText={setReason}
            editable={!busy}
          />
          <Text variant="caption" color="mutedForeground">
            One decline refuses the whole mandate.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Confirm decline"
              variant="destructive"
              size="sm"
              loading={decline.isPending}
              disabled={busy}
              onPress={() => decline.mutate()}
              style={{ flex: 1 }}
            />
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              disabled={busy}
              onPress={() => setDeclining(false)}
            />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button
            label="Countersign"
            size="sm"
            icon={<Check size={14} color={colors.primaryForeground} />}
            loading={sign.isPending}
            disabled={busy}
            onPress={() => sign.mutate()}
            style={{ flex: 1 }}
          />
          <Button
            label="Decline"
            variant="ghost"
            size="sm"
            disabled={busy}
            onPress={() => setDeclining(true)}
          />
        </View>
      )}
    </Card>
  );
}
