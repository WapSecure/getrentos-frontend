import { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, DoorOpen, KeyRound, Plus, Share2, X } from '@sureground/icons/native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  ErrorState,
  IconButton,
  Screen,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  residentApi,
  type IssuedVisitorPass,
  type VisitorPass,
  type VisitorPassStatus,
} from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDateTime, formatTime } from '@/lib/format';
import { passTimeline } from '@sureground/shared';
import { haptics } from '@/lib/haptics';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';
import {
  DurationChoice,
  GroupLabel,
  PassTicket,
  VisitorInitials,
} from '@/components/resident/VisitorParts';

const STATUS_LABEL: Record<VisitorPassStatus, string> = {
  pending: 'Pending',
  awaiting_approval: 'Needs your answer',
  approved: 'Approved',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  expired: 'Expired',
  revoked: 'Revoked',
  denied: 'Refused',
};

const STATUS_TONE: Record<VisitorPassStatus, BadgeTone> = {
  pending: 'warning',
  awaiting_approval: 'warning',
  approved: 'success',
  checked_in: 'success',
  checked_out: 'neutral',
  expired: 'neutral',
  revoked: 'danger',
  denied: 'danger',
};

const EXPIRY_PRESETS = [
  { label: '2 hours', hours: 2 },
  { label: '4 hours', hours: 4 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
] as const;
const DEFAULT_EXPIRY_HOURS = 24;

/** Passes that can still be used at the gate. */
const ACTIVE_STATUSES = new Set<VisitorPassStatus>(['pending', 'approved', 'checked_in']);

export default function ResidentVisitorPasses() {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [issueOpen, setIssueOpen] = useState(false);
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  const [denying, setDenying] = useState<VisitorPass | null>(null);

  // A walk-in lapses ten minutes after it is raised; keep refreshing so a dead request stops offering buttons.
  const [now, setNow] = useState(() => Date.now());
  const query = useQuery({
    queryKey: qk.resident.visitorPasses,
    queryFn: () => residentApi.listVisitorPasses(1, 50),
    refetchInterval: (q) =>
      q.state.data?.items.some((pass) => pass.status === 'awaiting_approval') ? 15_000 : false,
  });
  const hasAwaiting = (query.data?.items ?? []).some((pass) => pass.status === 'awaiting_approval');
  useEffect(() => {
    if (!hasAwaiting) return;
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, [hasAwaiting]);

  const issue = useMutation({
    mutationFn: (data: {
      visitorName: string;
      visitorPhone?: string;
      purpose?: string;
      expiresAt?: string;
    }) => residentApi.issueVisitorPass(data),
    onSuccess: (pass) => {
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      setIssueOpen(false);
      setIssuedPass(pass);
    },
    onError: () => toast.show("Couldn't issue that pass. Try again.", 'error'),
  });

  const revoke = useMutation({
    mutationFn: (passId: string) => residentApi.revokeVisitorPass(passId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.resident.visitorPasses }),
    onError: () => toast.show("Couldn't revoke that pass. Try again.", 'error'),
  });

  /** Always report the outcome: a visitor is standing at the gate waiting. */
  const approve = useMutation({
    mutationFn: (passId: string) => residentApi.approveWalkIn(passId),
    onSuccess: (pass) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      toast.show(`The gate has been told to admit ${pass.visitorName}.`, 'success');
    },
    onError: (error) => {
      void haptics.error();
      // Most often the request has just lapsed: refresh so the card says so.
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      toast.show(
        error instanceof Error ? error.message : "Couldn't approve that visitor.",
        'error'
      );
    },
  });

  const deny = useMutation({
    mutationFn: ({ passId, reason }: { passId: string; reason?: string }) =>
      residentApi.denyWalkIn(passId, reason),
    onSuccess: (pass) => {
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      setDenying(null);
      toast.show(`${pass.visitorName} was refused. The gate has been told.`, 'info');
    },
    onError: (error) => {
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      setDenying(null);
      toast.show(error instanceof Error ? error.message : "Couldn't refuse that visitor.", 'error');
    },
  });

  // A request whose window has run out is shown as expired straight away, even
  // before the server's sweep has recorded it.
  const passes = (query.data?.items ?? []).map((pass) =>
    pass.status === 'awaiting_approval' && new Date(pass.expiresAt).getTime() <= now
      ? { ...pass, status: 'expired' as const }
      : pass
  );

  // Walk-ins get their own section at the top: a real person is waiting at the barrier.
  const awaiting = passes.filter((pass) => pass.status === 'awaiting_approval');
  const others = passes.filter((pass) => pass.status !== 'awaiting_approval');
  // Passes that can still be used come first; the rest are a record of past visits.
  const active = others.filter((pass) => ACTIVE_STATUSES.has(pass.status));
  const finished = others.filter((pass) => !ACTIVE_STATUSES.has(pass.status));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Access control"
        title="Visitor passes"
        subtitle="Invite guests and approve gate arrivals"
        onBack={() => goBack()}
        accessory={
          <IconButton
            onPress={() => setIssueOpen(true)}
            accessibilityLabel="Issue a new pass"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />
      <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        {awaiting.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <GroupLabel
              label="Waiting at the gate"
              count={awaiting.length}
              tone="urgent"
              icon={<DoorOpen size={14} color={colors.warning} />}
            />
            {awaiting.map((pass) => (
              <GateArrivalCard
                key={pass.id}
                pass={pass}
                approving={approve.isPending && approve.variables === pass.id}
                busy={approve.isPending || deny.isPending}
                onApprove={() => approve.mutate(pass.id)}
                onRefuse={() => setDenying(pass)}
              />
            ))}
          </View>
        ) : null}

        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={12} width="35%" />
            <Skeleton height={112} radius={radius.lg} />
            <Skeleton height={112} radius={radius.lg} />
          </View>
        ) : query.isError && !query.data ? (
          <ErrorState
            title="We couldn't load your passes"
            description="Check your connection, then try again."
            onRetry={() => void query.refetch()}
          />
        ) : others.length > 0 ? (
          <>
            {active.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <GroupLabel label="Active passes" count={active.length} />
                {active.map((pass) => (
                  <PassCard
                    key={pass.id}
                    pass={pass}
                    revoking={revoke.isPending && revoke.variables === pass.id}
                    onRevoke={() => revoke.mutate(pass.id)}
                  />
                ))}
              </View>
            ) : null}
            {finished.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                <GroupLabel label="Past visitors" count={finished.length} />
                {finished.map((pass) => (
                  <PassCard key={pass.id} pass={pass} />
                ))}
              </View>
            ) : null}
          </>
        ) : awaiting.length === 0 ? (
          <PassesEmptyState onIssue={() => setIssueOpen(true)} />
        ) : null}
      </Screen>

      <IssuePassSheet
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onSubmit={(d) => issue.mutate(d)}
        submitting={issue.isPending}
      />
      <PassIssuedSheet pass={issuedPass} onClose={() => setIssuedPass(null)} />
      <DenyWalkInSheet
        pass={denying}
        onClose={() => setDenying(null)}
        onSubmit={async (reason) => {
          if (!denying) return false;
          try {
            await deny.mutateAsync({ passId: denying.id, reason });
            return true;
          } catch {
            return false;
          }
        }}
        submitting={deny.isPending}
      />
    </View>
  );
}

/** A real person is standing at the barrier: the two answers are large, stacked and labelled with their name. */
function GateArrivalCard({
  pass,
  approving,
  busy,
  onApprove,
  onRefuse,
}: {
  pass: VisitorPass;
  approving: boolean;
  busy: boolean;
  onApprove: () => void;
  onRefuse: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Card elevated padding="none" style={{ borderColor: colors.warning }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          backgroundColor: colors.warningSubtle,
        }}
      >
        <Clock size={14} color={colors.warning} />
        <Text variant="caption" style={{ flex: 1, color: colors.warning, fontWeight: '600' }}>
          Answer by {formatTime(pass.expiresAt)} or they are turned away
        </Text>
      </View>
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <VisitorInitials name={pass.visitorName} tone="waiting" size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="subheading" numberOfLines={2}>
              {pass.visitorName}
            </Text>
            <Text variant="caption" color="mutedForeground">
              {pass.purpose ? `${pass.purpose} · ` : ''}for {pass.unitLabel}
            </Text>
            <Text variant="caption" color="mutedForeground">
              Asked at {formatTime(pass.createdAt)}
            </Text>
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          <Button
            label="Let them in"
            size="lg"
            fullWidth
            accessibilityLabel={`Let ${pass.visitorName} in`}
            icon={<Check size={18} color={colors.primaryForeground} />}
            loading={approving}
            onPress={onApprove}
          />
          <Button
            label="Refuse"
            variant="outline"
            fullWidth
            accessibilityLabel={`Refuse ${pass.visitorName}`}
            icon={<X size={18} color={colors.foreground} />}
            disabled={busy}
            onPress={onRefuse}
          />
        </View>
      </View>
    </Card>
  );
}

/** Active passes are raised cards; finished ones sit flat and quiet so the live ones stand out. */
function PassCard({
  pass,
  revoking = false,
  onRevoke,
}: {
  pass: VisitorPass;
  revoking?: boolean;
  onRevoke?: () => void;
}) {
  const { colors, spacing } = useTheme();
  const isActive = ACTIVE_STATUSES.has(pass.status);
  const timeline = passTimeline(pass, formatDateTime, formatTime);

  return (
    <Card
      elevated={isActive}
      padding={isActive ? spacing.lg : spacing.md}
      style={isActive ? undefined : { backgroundColor: colors.muted }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <VisitorInitials
          name={pass.visitorName}
          tone={isActive ? 'active' : 'finished'}
          size={isActive ? 44 : 36}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            variant={isActive ? 'bodyStrong' : 'callout'}
            numberOfLines={1}
            style={isActive ? undefined : { fontWeight: '600' }}
          >
            {pass.visitorName}
          </Text>
          {pass.purpose ? (
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {pass.purpose}
            </Text>
          ) : null}
        </View>
        <Badge label={STATUS_LABEL[pass.status]} tone={STATUS_TONE[pass.status]} />
      </View>

      {timeline || (isActive && pass.status === 'pending') ? (
        <View
          style={{
            marginTop: isActive ? spacing.md : spacing.sm,
            paddingTop: isActive ? spacing.md : 0,
            borderTopWidth: isActive ? StyleSheet.hairlineWidth : 0,
            borderTopColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            // Lines the text up under the name rather than under the initials.
            paddingLeft: isActive ? 0 : 36 + spacing.md,
          }}
        >
          {timeline ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              {isActive ? <Clock size={14} color={colors.mutedForeground} /> : null}
              <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                {timeline}
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {pass.status === 'pending' && onRevoke ? (
            <Button
              label="Revoke"
              variant="outline"
              size="sm"
              fullWidth={false}
              accessibilityLabel={`Revoke ${pass.visitorName}'s pass`}
              loading={revoking}
              onPress={onRevoke}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const HOW_IT_WORKS = [
  'Add your visitor’s name and how long the pass should last.',
  'Send them the PIN or QR code.',
  'The gate checks it when they arrive.',
] as const;

function PassesEmptyState({ onIssue }: { onIssue: () => void }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Card elevated padding={spacing['2xl']} style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.md }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.lg,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <KeyRound size={24} color={colors.primary} />
        </View>
        <View style={{ gap: spacing.xs }} accessibilityLiveRegion="polite">
          <Text variant="heading" headingLevel={2}>
            No visitor passes yet
          </Text>
          <Text variant="callout" color="mutedForeground">
            Issue a pass so your visitor can check in at the gate.
          </Text>
        </View>
      </View>
      <View style={{ gap: spacing.md }}>
        {HOW_IT_WORKS.map((step, i) => (
          <View
            key={step}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="label" color="mutedForeground">
                {i + 1}
              </Text>
            </View>
            <Text variant="callout" style={{ flex: 1 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>
      <Button
        label="Issue pass"
        icon={<Plus size={18} color={colors.primaryForeground} />}
        onPress={onIssue}
      />
    </Card>
  );
}

/** Optional, but the guard reads it aloud, so it is framed as something to say to the visitor. */
function DenyWalkInSheet({
  pass,
  onClose,
  onSubmit,
  submitting,
}: {
  pass: VisitorPass | null;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<boolean>;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');

  return (
    <Sheet
      open={!!pass}
      onClose={submitting ? () => undefined : onClose}
      title={pass ? `Refuse ${pass.visitorName}?` : 'Refuse visitor?'}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button
            label="Refuse entry"
            variant="destructive"
            fullWidth
            loading={submitting}
            disabled={submitting}
            onPress={() => {
              void onSubmit(reason.trim() || undefined).then((saved) => {
                if (saved) setReason('');
              });
            }}
          />
          <Button
            label="Back"
            variant="outline"
            fullWidth
            disabled={submitting}
            onPress={() => {
              setReason('');
              onClose();
            }}
          />
        </View>
      }
    >
      <View style={{ gap: spacing.md }}>
        <Text variant="body">
          The gate will be told not to admit them, and the visitor will be turned away.
        </Text>
        <TextField
          label="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          editable={!submitting}
          placeholder="e.g. I am not expecting anyone"
          hint="Shown to the guard, who may repeat it to the visitor."
        />
      </View>
    </Sheet>
  );
}

function IssuePassSheet({
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) => void;
  submitting: boolean;
}) {
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Issue visitor pass">
      <IssuePassForm key={open ? 'open' : 'closed'} onSubmit={onSubmit} submitting={submitting} />
    </Sheet>
  );
}

function IssuePassForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiryHours, setExpiryHours] = useState<number | undefined>(undefined);

  const canSubmit = visitorName.trim().length > 0;

  return (
    <View style={{ gap: spacing['2xl'] }}>
      <FormGroup title="Visitor">
        <TextField
          label="Visitor name"
          required
          placeholder="e.g. Tunde Adekunle"
          value={visitorName}
          onChangeText={setVisitorName}
          editable={!submitting}
        />
        <TextField
          label="Phone (optional)"
          placeholder="e.g. 08012345678"
          keyboardType="phone-pad"
          value={visitorPhone}
          onChangeText={(v) => setVisitorPhone(v.replace(/(?!^\+)\D/g, ''))}
          editable={!submitting}
        />
      </FormGroup>
      <FormGroup title="Visit">
        <TextField
          label="Purpose (optional)"
          placeholder="e.g. Family visit"
          value={purpose}
          onChangeText={setPurpose}
          editable={!submitting}
        />
        <Field label="Pass lasts for">
          <DurationChoice
            label="Pass lasts for"
            options={EXPIRY_PRESETS}
            // Nothing chosen means the server's 24-hour default, so that option shows as selected.
            value={expiryHours ?? DEFAULT_EXPIRY_HOURS}
            onChange={setExpiryHours}
            disabled={submitting}
          />
        </Field>
      </FormGroup>
      <Button
        label="Issue pass"
        loadingLabel="Issuing…"
        disabled={submitting || !canSubmit}
        loading={submitting}
        fullWidth
        onPress={() =>
          onSubmit({
            visitorName: visitorName.trim(),
            visitorPhone: visitorPhone.trim() || undefined,
            purpose: purpose.trim() || undefined,
            expiresAt: expiryHours
              ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
              : undefined,
          })
        }
      />
    </View>
  );
}

function PassIssuedSheet({
  pass,
  onClose,
}: {
  pass: IssuedVisitorPass | null;
  onClose: () => void;
}) {
  const { colors, spacing } = useTheme();
  const share = (p: IssuedVisitorPass) =>
    Share.share({
      message: `Your visitor PIN for ${p.unitLabel} is ${p.pin}. Show it at the gate. It expires ${formatDateTime(p.expiresAt, 'medium')}.`,
    }).catch(() => undefined);

  return (
    <Sheet
      open={!!pass}
      onClose={onClose}
      title="Visitor pass issued"
      footer={
        pass ? (
          <View style={{ gap: spacing.sm }}>
            <Button
              label="Share PIN"
              icon={<Share2 size={18} color={colors.primaryForeground} />}
              accessibilityLabel={`Share the PIN with ${pass.visitorName}`}
              onPress={() => void share(pass)}
            />
            <Button label="Done" variant="outline" fullWidth onPress={onClose} />
          </View>
        ) : null
      }
    >
      {pass ? (
        <View style={{ gap: spacing.md }}>
          <PassTicket pass={pass} />
          <Text variant="caption" color="mutedForeground" center>
            Show this QR code at the gate, or share the PIN. The PIN won&apos;t be shown again.
          </Text>
        </View>
      ) : null}
    </Sheet>
  );
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="label" color="mutedForeground" uppercase accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
