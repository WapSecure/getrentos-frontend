import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AlertTriangle, Clock, Siren } from 'lucide-react-native';
import {
  Button,
  Card,
  Divider,
  ErrorState,
  FormAlert,
  Price,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  STATUS_LABEL,
  categoryLabel,
  homeCareApi,
  nextStep,
  slaState,
  type WorkOrder,
} from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { Sheet } from '@/components/Sheet';
import { StatusPill } from '@/components/host/HostUI';
import { PriorityTag, STATUS_TONE } from '@/components/homecare/WorkOrderCard';
import { VendorPicker } from '@/components/homecare/VendorPicker';
import { InvoicesSection, QuotesSection } from '@/components/homecare/WorkOrderMoney';
import { ReasonSheet } from '@/components/homecare/ReasonSheet';

type Panel = 'assign' | 'approve' | 'resolve' | 'cancel' | null;
const err = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const dt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-NG', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

export default function WorkOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [panel, setPanel] = useState<Panel>(null);
  const query = useQuery({
    queryKey: qk.homeCare.workOrder(id),
    queryFn: () => homeCareApi.workOrder(id),
  });
  const w = query.data;

  const refresh = (next?: WorkOrder) => {
    if (next)
      qc.setQueryData(
        qk.homeCare.workOrder(id),
        (old: WorkOrder | undefined) => ({ ...(old ?? {}), ...next }) as WorkOrder
      );
    qc.invalidateQueries({ queryKey: qk.homeCare.workOrder(id) });
    qc.invalidateQueries({ queryKey: ['home-care', 'work-orders'] });
    qc.invalidateQueries({ queryKey: qk.homeCare.dashboard });
  };

  const act = useMutation({
    mutationFn: async (kind: 'acknowledge' | 'escalate' | 'start') =>
      kind === 'acknowledge'
        ? homeCareApi.acknowledge(id)
        : kind === 'escalate'
          ? homeCareApi.escalate(id)
          : homeCareApi.start(id),
    onSuccess: (_r, kind) => {
      void haptics.success();
      refresh();
      toast.show(
        {
          acknowledge: 'Acknowledged. The response clock is met.',
          escalate: 'Escalated.',
          start: 'Marked in progress.',
        }[kind],
        'success'
      );
    },
    onError: (e) => {
      void haptics.error();
      toast.show(err(e, 'That didn’t go through.'), 'error');
    },
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => homeCareApi.cancel(id, reason),
    onSuccess: (next) => {
      refresh(next);
      setPanel(null);
      toast.show('Work order cancelled.', 'success');
    },
    onError: (e) => toast.show(err(e, 'Could not cancel it.'), 'error'),
  });

  if (query.isError && !w) return <ErrorState onRetry={() => query.refetch()} />;

  const open = w && w.status !== 'RESOLVED' && w.status !== 'CANCELLED';
  const needsApproval = !!w && w.approvalRequired && !w.approvedAt;
  const sla = w ? slaState(w) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={w?.isEmergency ? 'Emergency' : 'Work order'}
          title={w?.issueTitle ?? 'Work order'}
          subtitle={
            w ? [w.unit.property?.title, w.unit.unitName].filter(Boolean).join(' · ') : undefined
          }
          onBack={() => router.back()}
        />
        {!w ? (
          <>
            <Skeleton height={120} radius={radius.lg} />
            <Skeleton height={200} radius={radius.lg} />
          </>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                alignItems: 'center',
              }}
            >
              <StatusPill label={STATUS_LABEL[w.status]} tone={STATUS_TONE[w.status]} />
              <PriorityTag p={w.priority} />
              <Text variant="caption" color="mutedForeground">
                {categoryLabel(w.category)} · logged {formatDate(w.createdAt, 'medium')}
              </Text>
            </View>

            {open ? (
              <Card
                elevated
                style={{
                  gap: spacing.md,
                  borderWidth: sla?.overdue ? 1.5 : 0,
                  borderColor: colors.destructive,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  {w.isEmergency ? (
                    <Siren size={18} color={colors.destructive} />
                  ) : sla?.overdue ? (
                    <AlertTriangle size={18} color={colors.destructive} />
                  ) : (
                    <Clock size={18} color={colors.primary} />
                  )}
                  <Text
                    variant="bodyStrong"
                    style={{
                      flex: 1,
                      color: sla?.overdue ? colors.destructive : colors.foreground,
                    }}
                  >
                    {sla?.label ?? 'No deadline set'}
                  </Text>
                </View>
                <View style={{ gap: 4 }}>
                  <Row
                    k="Respond by"
                    v={w.acknowledgedAt ? `Done ${dt(w.acknowledgedAt)}` : dt(w.responseDueAt)}
                  />
                  <Row k="Resolve by" v={dt(w.resolutionDueAt ?? w.dueAt)} />
                  {w.escalatedAt ? (
                    <Row k="Escalated" v={dt(w.escalatedAt)} />
                  ) : w.escalationDueAt ? (
                    <Row k="Escalates at" v={dt(w.escalationDueAt)} />
                  ) : null}
                </View>
                <Text variant="caption" color="mutedForeground">
                  {nextStep(w)}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {!w.acknowledgedAt ? (
                    <Button
                      label="Acknowledge"
                      style={{ flex: 1 }}
                      loading={act.isPending && act.variables === 'acknowledge'}
                      onPress={() => act.mutate('acknowledge')}
                    />
                  ) : null}
                  {!w.escalatedAt ? (
                    <Button
                      label="Escalate"
                      variant="secondary"
                      style={{ flex: 1 }}
                      loading={act.isPending && act.variables === 'escalate'}
                      onPress={() =>
                        Alert.alert(
                          'Escalate this job?',
                          'It’s flagged as needing senior attention and notifications go out.',
                          [
                            { text: 'Not now', style: 'cancel' },
                            { text: 'Escalate', onPress: () => act.mutate('escalate') },
                          ]
                        )
                      }
                    />
                  ) : null}
                </View>
              </Card>
            ) : null}

            <Card elevated style={{ gap: spacing.sm }}>
              <Text variant="body">{w.description}</Text>
              {w.images?.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.sm }}
                >
                  {w.images.map((uri, i) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={{
                        width: 120,
                        height: 90,
                        borderRadius: radius.md,
                        backgroundColor: colors.secondary,
                      }}
                      contentFit="cover"
                      accessibilityLabel={`Evidence photo ${i + 1}`}
                    />
                  ))}
                </ScrollView>
              ) : null}
              <Divider />
              {w.tenant?.legalName ? <Row k="Reported by" v={w.tenant.legalName} /> : null}
              {w.asset?.name ? <Row k="Item" v={w.asset.name} /> : null}
              <Row k="Vendor" v={w.assignedVendor?.name ?? 'Not assigned'} />
            </Card>

            <Card elevated style={{ gap: spacing.md }}>
              <Text variant="bodyStrong">Budget</Text>
              <Row
                k="Estimated"
                v={w.estimatedCost != null ? `₦${w.estimatedCost.toLocaleString('en-NG')}` : '—'}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="callout" color="mutedForeground" style={{ flex: 1 }}>
                  Approved
                </Text>
                {w.approvedCost != null ? (
                  <Price amount={w.approvedCost} variant="bodyStrong" />
                ) : (
                  <Text variant="callout">—</Text>
                )}
              </View>
              {needsApproval ? (
                <Button label="Approve spend" onPress={() => setPanel('approve')} />
              ) : null}
            </Card>

            {open ? (
              <View style={{ gap: spacing.sm }}>
                {w.status === 'SUBMITTED' || w.status === 'ASSIGNED' ? (
                  <Button
                    label={w.assignedVendor ? 'Change vendor' : 'Assign a vendor'}
                    variant={w.assignedVendor ? 'secondary' : 'primary'}
                    onPress={() => setPanel('assign')}
                  />
                ) : null}
                {w.status === 'ASSIGNED' ? (
                  <Button
                    label="Start the job"
                    disabled={needsApproval}
                    loading={act.isPending && act.variables === 'start'}
                    onPress={() => act.mutate('start')}
                  />
                ) : null}
                {w.status === 'ASSIGNED' || w.status === 'IN_PROGRESS' ? (
                  <Button
                    label="Resolve"
                    variant={w.status === 'IN_PROGRESS' ? 'primary' : 'secondary'}
                    disabled={needsApproval}
                    onPress={() => setPanel('resolve')}
                  />
                ) : null}
                <Button
                  label="Cancel work order"
                  variant="ghost"
                  onPress={() => setPanel('cancel')}
                />
              </View>
            ) : null}

            <QuotesSection w={w} />
            <InvoicesSection w={w} />
          </>
        )}
      </ScrollView>

      <Sheet
        open={panel === 'assign' || panel === 'approve' || panel === 'resolve'}
        onClose={() => setPanel(null)}
        title={
          panel === 'assign'
            ? 'Assign a vendor'
            : panel === 'approve'
              ? 'Approve spend'
              : 'Resolve the job'
        }
      >
        {w && panel === 'assign' ? (
          <AssignForm
            w={w}
            onDone={(n) => {
              refresh(n);
              setPanel(null);
            }}
          />
        ) : null}
        {w && panel === 'approve' ? (
          <ApproveForm
            w={w}
            onDone={(n) => {
              refresh(n);
              setPanel(null);
            }}
          />
        ) : null}
        {w && panel === 'resolve' ? (
          <ResolveForm
            w={w}
            onDone={(n) => {
              refresh(n);
              setPanel(null);
            }}
          />
        ) : null}
      </Sheet>
      <ReasonSheet
        open={panel === 'cancel'}
        title="Cancel this work order?"
        hint="Say why: the tenant and vendor may see it."
        action="Cancel work order"
        busy={cancel.isPending}
        onClose={() => setPanel(null)}
        onConfirm={(reason) => cancel.mutate(reason)}
      />
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground" style={{ width: 110 }}>
        {k}
      </Text>
      <Text variant="callout" style={{ flex: 1, fontWeight: '600' }}>
        {v}
      </Text>
    </View>
  );
}

function AssignForm({ w, onDone }: { w: WorkOrder; onDone: (n: WorkOrder) => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [vendorId, setVendorId] = useState<string | undefined>(w.assignedVendor?.id);
  const assign = useMutation({
    mutationFn: () => homeCareApi.assign(w.id, vendorId!),
    onSuccess: (n) => {
      void haptics.success();
      toast.show('Vendor assigned.', 'success');
      onDone(n);
    },
  });
  return (
    <View style={{ gap: spacing.md }}>
      <VendorPicker value={vendorId} onChange={setVendorId} />
      {assign.error ? <FormAlert message={err(assign.error, 'Could not assign.')} /> : null}
      <Button
        label="Assign"
        disabled={!vendorId || vendorId === w.assignedVendor?.id}
        loading={assign.isPending}
        onPress={() => assign.mutate()}
      />
    </View>
  );
}

function ApproveForm({ w, onDone }: { w: WorkOrder; onDone: (n: WorkOrder) => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [amount, setAmount] = useState(w.estimatedCost ? String(w.estimatedCost) : '');
  const value = Number(amount.replace(/\D/g, '')) || 0;
  const approve = useMutation({
    mutationFn: () => homeCareApi.approve(w.id, value),
    onSuccess: (n) => {
      void haptics.success();
      toast.show('Spend approved. Work can go ahead.', 'success');
      onDone(n);
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <TextField
          label="Approved budget (₦)"
          keyboardType="number-pad"
          value={value ? value.toLocaleString('en-NG') : ''}
          onChangeText={setAmount}
          hint="The vendor’s invoice can’t go above this."
        />
        {approve.error ? <FormAlert message={err(approve.error, 'Could not approve.')} /> : null}
        <Button
          label="Approve"
          disabled={!value}
          loading={approve.isPending}
          onPress={() => approve.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function ResolveForm({ w, onDone }: { w: WorkOrder; onDone: (n: WorkOrder) => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const needsCost = w.approvedCost == null;
  const value = Number(cost.replace(/\D/g, '')) || 0;
  const resolve = useMutation({
    mutationFn: () =>
      homeCareApi.resolve(w.id, {
        resolutionNote: note.trim() || undefined,
        ...(needsCost ? { finalCost: value } : {}),
      }),
    onSuccess: (n) => {
      void haptics.success();
      toast.show('Resolved. Invoice the vendor next.', 'success');
      onDone(n);
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        {needsCost ? (
          <TextField
            label="What it cost (₦)"
            keyboardType="number-pad"
            value={value ? value.toLocaleString('en-NG') : ''}
            onChangeText={setCost}
            hint="Needed so the vendor’s invoice can be checked against it."
          />
        ) : null}
        <TextField
          label="What was done (optional)"
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={2000}
        />
        {resolve.error ? <FormAlert message={err(resolve.error, 'Could not resolve.')} /> : null}
        <Button
          label="Mark resolved"
          disabled={needsCost && !cost.trim()}
          loading={resolve.isPending}
          onPress={() => resolve.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
