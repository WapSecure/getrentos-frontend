import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ShieldCheck, SlidersHorizontal, X } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ListSkeleton,
  NumberField,
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
  SPEND_APPROVAL_LABEL,
  SPEND_APPROVAL_TONE,
  type AwaitingCountersign,
  type OwnerMandate,
  type SpendApproval,
  type SpendApprovalRole,
} from '@/lib/api/management';
import { relationshipLabel } from '@/lib/api/propertyAuthority';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const ROLES: { value: SpendApprovalRole; label: string }[] = [
  { value: 'owner', label: 'To review' },
  { value: 'requester', label: 'My requests' },
];

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

/**
 * Spend a manager wants to make above the owner's approval limit, the limits
 * themselves, and any mandate waiting on this co-owner's countersignature.
 */
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
            onRefresh={() => list.refetch()}
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
            <ApprovalCard key={a.id} approval={a} role={role} />
          ))}
        </QueryState>
      </ScrollView>
    </View>
  );
}

function ApprovalCard({ approval: a, role }: { approval: SpendApproval; role: SpendApprovalRole }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const canDecide = role === 'owner' && a.status === 'PENDING';
  const invalidate = () => qc.invalidateQueries({ queryKey: ['management', 'spend-approvals'] });

  const approve = useMutation({
    mutationFn: () => managementApi.approveSpend(a.id),
    onSuccess: () => {
      invalidate();
      toast.show('Approved. The expense has been recorded.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not approve.'), 'error'),
  });
  const reject = useMutation({
    mutationFn: () => managementApi.rejectSpend(a.id, reason.trim()),
    onSuccess: () => {
      invalidate();
      toast.show('Request declined.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not decline.'), 'error'),
  });
  const busy = approve.isPending || reject.isPending;

  return (
    <Card padding={spacing.lg} style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">
            {formatNaira(a.amount)} · {titleCase(a.category)}
          </Text>
          <Text variant="caption" color="mutedForeground">
            {a.propertyTitle ?? 'Property'}
            {role === 'owner' && a.requestedByName ? ` · ${a.requestedByName}` : ''} ·{' '}
            {formatDate(a.createdAt, 'short')}
          </Text>
        </View>
        <Badge label={SPEND_APPROVAL_LABEL[a.status]} tone={SPEND_APPROVAL_TONE[a.status]} />
      </View>
      {a.note ? (
        <Text variant="callout" color="mutedForeground">
          {a.note}
        </Text>
      ) : null}
      {a.status === 'REJECTED' && a.decisionNote ? (
        <Text variant="callout" color="mutedForeground">
          Declined: {a.decisionNote}
        </Text>
      ) : null}

      {canDecide ? (
        declining ? (
          <View style={{ gap: spacing.sm }}>
            <TextField
              label="Reason for declining"
              value={reason}
              onChangeText={setReason}
              editable={!busy}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Confirm decline"
                variant="destructive"
                size="sm"
                loading={reject.isPending}
                disabled={!reason.trim() || busy}
                onPress={() => reject.mutate()}
                style={{ flex: 1 }}
              />
              <Button
                label="Cancel"
                variant="ghost"
                size="sm"
                disabled={busy}
                onPress={() => {
                  setDeclining(false);
                  setReason('');
                }}
              />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Approve"
              size="sm"
              icon={<Check size={14} color={colors.primaryForeground} />}
              loading={approve.isPending}
              disabled={busy}
              onPress={() => approve.mutate()}
              style={{ flex: 1 }}
            />
            <Button
              label="Decline"
              variant="ghost"
              size="sm"
              icon={<X size={14} color={colors.foreground} />}
              disabled={busy}
              onPress={() => setDeclining(true)}
            />
          </View>
        )
      ) : null}
    </Card>
  );
}

/** Per engagement, the most a manager may spend before it needs sign-off. */
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
          Approval limits
        </Text>
      </View>
      <Text variant="caption" color="mutedForeground">
        Spend above the limit you set needs your approval. Leave it blank for no limit.
      </Text>
      {active.map((m) => (
        <CapRow key={m.id} mandate={m} />
      ))}
    </Card>
  );
}

function CapRow({ mandate }: { mandate: OwnerMandate }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [cap, setCap] = useState(
    mandate.maintenanceApprovalCap ? String(mandate.maintenanceApprovalCap) : ''
  );
  const save = useMutation({
    mutationFn: () => managementApi.setMandateCap(mandate.id, Number(cap) > 0 ? Number(cap) : null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.management.mandates });
      toast.show('Approval limit saved.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not save the limit.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <NumberField
        currency
        label={mandate.propertyTitle ?? 'Property'}
        placeholder="No limit"
        value={cap}
        onValueChange={setCap}
        editable={!save.isPending}
      />
      <Button
        label="Save limit"
        variant="secondary"
        size="sm"
        loading={save.isPending}
        disabled={save.isPending}
        onPress={() => save.mutate()}
      />
    </View>
  );
}

/**
 * Co-owner quorum is unanimous: a manager or agent mandate on a jointly owned
 * property only takes effect once every co-owner countersigns. Renders nothing
 * when nothing is waiting on this co-owner.
 */
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
