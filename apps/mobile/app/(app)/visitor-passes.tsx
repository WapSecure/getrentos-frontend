import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, KeyRound, Plus } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  Chip,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { residentApi, type IssuedVisitorPass, type VisitorPassStatus } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

const STATUS_LABEL: Record<VisitorPassStatus, string> = {
  pending: 'Pending',
  checked_in: 'Checked In',
  expired: 'Expired',
  revoked: 'Revoked',
};

const STATUS_TONE: Record<VisitorPassStatus, BadgeTone> = {
  pending: 'warning',
  checked_in: 'success',
  expired: 'neutral',
  revoked: 'danger',
};

const EXPIRY_PRESETS = [
  { label: '2 hours', hours: 2 },
  { label: '4 hours', hours: 4 },
  { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 },
] as const;

function BackHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={10}
      >
        <ChevronLeft size={24} color={colors.foreground} />
      </Pressable>
      <Text variant="title" style={{ flex: 1 }}>
        {title}
      </Text>
      {action}
    </View>
  );
}

export default function ResidentVisitorPasses() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [issueOpen, setIssueOpen] = useState(false);
  const [issuedPass, setIssuedPass] = useState<IssuedVisitorPass | null>(null);

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

  const passes = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader
        title="Visitor Passes"
        action={
          <Pressable
            onPress={() => setIssueOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Issue a new pass"
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.accent,
            }}
          >
            <Plus size={18} color={colors.primary} />
          </Pressable>
        }
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={76} radius={16} />
            <Skeleton height={76} radius={16} />
          </View>
        ) : passes.length > 0 ? (
          passes.map((pass) => (
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
    </View>
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
            {formatDate(pass.expiresAt, 'medium')} and won't be shown again.
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
