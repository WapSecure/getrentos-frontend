import { useState } from 'react';
import { Image, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, KeyRound, Plus, UserPlus } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  Screen,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  residentApi,
  type IssuedVisitorPass,
  type VisitorPass,
  type VisitorPassStatus,
} from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate, formatTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const STATUS_LABEL: Record<VisitorPassStatus, string> = {
  pending: 'Pending',
  // A walk-in the gate raised: this household is being asked to decide.
  awaiting_approval: 'Needs your answer',
  approved: 'Approved',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  expired: 'Expired',
  revoked: 'Revoked',
  denied: 'Refused',
};

const STATUS_TONE: Record<VisitorPassStatus, BadgeTone> = {
  pending: 'warning',
  // Warning tone, not neutral: this one is waiting on the resident.
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

export default function ResidentVisitorPasses() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [issueOpen, setIssueOpen] = useState(false);
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);
  /** The walk-in the resident is refusing, so the reason can be collected. */
  const [denying, setDenying] = useState<VisitorPass | null>(null);

  const query = useQuery({
    queryKey: qk.resident.visitorPasses,
    queryFn: () => residentApi.listVisitorPasses(1, 50),
  });

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

  /**
   * Consenting to a walk-in. Someone is standing at the gate, so the outcome is
   * always reported: silence here means a visitor is left waiting with no idea
   * whether anyone is deciding.
   */
  const approve = useMutation({
    mutationFn: (passId: string) => residentApi.approveWalkIn(passId),
    onSuccess: (pass) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: qk.resident.visitorPasses });
      toast.show(`The gate has been told to admit ${pass.visitorName}.`, 'success');
    },
    onError: (error) => {
      void haptics.error();
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
      toast.show(error instanceof Error ? error.message : "Couldn't refuse that visitor.", 'error');
    },
  });

  const passes = query.data?.items ?? [];

  // Walk-ins waiting on this household get their own section at the top and are
  // kept out of the list below: this is the one thing on the screen where a real
  // person is standing at a barrier while the resident reads it.
  const awaiting = passes.filter((pass) => pass.status === 'awaiting_approval');
  const others = passes.filter((pass) => pass.status !== 'awaiting_approval');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Access control"
        title="Visitor Passes"
        subtitle="Invite guests and approve gate arrivals"
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setIssueOpen(true)}
            accessibilityLabel="Issue a new pass"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {awaiting.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Clock size={16} color={colors.destructive} />
              <Text variant="bodyStrong">Waiting at the gate</Text>
            </View>
            {awaiting.map((pass) => (
              <Card key={pass.id} elevated>
                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <UserPlus size={20} color={colors.primary} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{pass.visitorName}</Text>
                      <Text variant="caption" color="mutedForeground">
                        {pass.purpose ? `${pass.purpose} · ` : ''}for {pass.unitLabel}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        Asked at {formatTime(pass.createdAt)}. If nobody answers by{' '}
                        {formatTime(pass.expiresAt)}, they are turned away.
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Button
                      label="Let them in"
                      fullWidth
                      style={{ flex: 1 }}
                      loading={approve.isPending}
                      onPress={() => approve.mutate(pass.id)}
                    />
                    <Button
                      label="Refuse"
                      variant="outline"
                      fullWidth
                      style={{ flex: 1 }}
                      disabled={approve.isPending || deny.isPending}
                      onPress={() => setDenying(pass)}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={76} radius={16} />
            <Skeleton height={76} radius={16} />
          </View>
        ) : others.length > 0 ? (
          others.map((pass) => (
            <Card key={pass.id} elevated>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{pass.visitorName}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {pass.purpose ? `${pass.purpose} · ` : ''}Expires{' '}
                    {formatDate(pass.expiresAt, 'short')}
                  </Text>
                </View>
                <Badge label={STATUS_LABEL[pass.status]} tone={STATUS_TONE[pass.status]} />
              </View>
              {pass.status === 'pending' ? (
                <Button
                  label="Revoke"
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  loading={revoke.isPending}
                  onPress={() => revoke.mutate(pass.id)}
                  style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                />
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<KeyRound size={34} color={colors.mutedForeground} />}
            title="No visitor passes yet"
            description="Issue a pass so your visitor can check in at the gate."
            action={<Button label="Issue Pass" onPress={() => setIssueOpen(true)} />}
          />
        )}
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
        onSubmit={(reason) => denying && deny.mutate({ passId: denying.id, reason })}
        submitting={deny.isPending}
      />
    </View>
  );
}

/**
 * Collects why a visitor was refused.
 *
 * The reason is optional — somebody declining a visitor should not have to
 * justify it to reach the button — but when it is given the guard reads it out
 * loud, so it is framed as something to say to the person at the barrier rather
 * than as a note for the record.
 */
function DenyWalkInSheet({
  pass,
  onClose,
  onSubmit,
  submitting,
}: {
  pass: VisitorPass | null;
  onClose: () => void;
  onSubmit: (reason?: string) => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');

  return (
    <Sheet
      open={!!pass}
      onClose={onClose}
      title={pass ? `Refuse ${pass.visitorName}?` : 'Refuse visitor?'}
      footer={
        <View style={{ gap: spacing.xs }}>
          <Button
            label="Refuse entry"
            fullWidth
            loading={submitting}
            onPress={() => {
              onSubmit(reason.trim() || undefined);
              setReason('');
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
    <Sheet open={open} onClose={onClose} title="Issue Visitor Pass">
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
    <View style={{ gap: spacing.lg }}>
      <Field label="Visitor name">
        <TextField
          placeholder="e.g. Tunde Adekunle"
          value={visitorName}
          onChangeText={setVisitorName}
        />
      </Field>
      <Field label="Phone (optional)">
        <TextField
          placeholder="e.g. 08012345678"
          keyboardType="phone-pad"
          value={visitorPhone}
          onChangeText={setVisitorPhone}
        />
      </Field>
      <Field label="Purpose (optional)">
        <TextField placeholder="e.g. Family visit" value={purpose} onChangeText={setPurpose} />
      </Field>
      <Field label="Expires (defaults to 24 hours)">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {EXPIRY_PRESETS.map((p) => (
            <Chip
              key={p.hours}
              label={p.label}
              selected={expiryHours === p.hours}
              onPress={() => setExpiryHours(p.hours)}
            />
          ))}
        </View>
      </Field>
      <Button
        label={submitting ? 'Issuing…' : 'Issue Pass'}
        disabled={!canSubmit}
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
  const { colors, spacing, radius } = useTheme();
  return (
    <Sheet open={!!pass} onClose={onClose} title="Visitor Pass Issued">
      {pass ? (
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <Text variant="body" color="mutedForeground" center>
            For {pass.visitorName} — {pass.unitLabel}
          </Text>
          <Image
            source={{ uri: pass.qrDataUrl }}
            style={{
              width: 180,
              height: 180,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: '#fff',
            }}
          />
          <Text variant="title" style={{ letterSpacing: 6 }}>
            {pass.pin}
          </Text>
          <Text variant="caption" color="mutedForeground" center>
            Show this QR code at the gate, or share the PIN. It expires{' '}
            {formatDate(pass.expiresAt, 'medium')} and won&apos;t be shown again.
          </Text>
          <Button label="Done" fullWidth onPress={onClose} />
        </View>
      ) : null}
    </Sheet>
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
