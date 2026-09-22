import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Download,
  FileSignature,
  PenLine,
  RefreshCw,
  Send,
} from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Price,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { landlordApi, LEASE_STATUS_TONE, type LandlordLease } from '@/lib/api/landlord';
import { formatDate } from '@/lib/format';
import { ApiError } from '@/lib/api/client';
import { RenewLeaseSheet } from '@/components/landlord/RenewLeaseSheet';
import { SignLeaseSheet } from '@/components/landlord/SignLeaseSheet';
import { PDF_MIME, shareDownloadedFile } from '@/lib/shareFile';

export default function LandlordLeases() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [signing, setSigning] = useState<LandlordLease | null>(null);
  const [renewing, setRenewing] = useState<LandlordLease | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const downloadPdf = useMutation({
    mutationFn: async (lease: LandlordLease) => {
      const { bytes } = await landlordApi.leasePdf(lease.id);
      await shareDownloadedFile(
        bytes,
        `lease-${lease.tenantName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        PDF_MIME,
        'Lease'
      );
    },
    onMutate: (lease) => setBusyId(lease.id),
    onSettled: () => setBusyId(null),
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not download that lease.', 'error'),
  });

  const send = useMutation({
    mutationFn: (id: string) => landlordApi.sendLease(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show('Lease sent to the tenant.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not send that lease.', 'error'),
  });

  const query = useQuery({
    queryKey: qk.landlord.leases(),
    queryFn: () => landlordApi.leases(),
  });

  const items = query.data?.items ?? [];
  const awaitingSignature = items.filter((l) => !l.tenantSigned || !l.landlordSigned).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
        >
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title">Leases</Text>
          {query.data ? (
            <Text variant="caption" color="mutedForeground">
              {query.data.total} lease{query.data.total === 1 ? '' : 's'}
              {awaitingSignature > 0 ? ` · ${awaitingSignature} awaiting signature` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(l) => l.id}
          renderItem={({ item }: { item: LandlordLease }) => (
            <LeaseCard
              lease={item}
              busy={busyId === item.id}
              onSend={() => send.mutate(item.id)}
              onSign={() => setSigning(item)}
              onRenew={() => setRenewing(item)}
              onDownload={() => downloadPdf.mutate(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<FileSignature size={32} color={colors.mutedForeground} />}
              title="No leases yet"
              description="Leases you create for approved applicants appear here."
            />
          }
        />
      )}

      <SignLeaseSheet open={!!signing} onClose={() => setSigning(null)} lease={signing} />
      <RenewLeaseSheet open={!!renewing} onClose={() => setRenewing(null)} lease={renewing} />
    </View>
  );
}

function LeaseCard({
  lease: l,
  busy,
  onSend,
  onSign,
  onRenew,
  onDownload,
}: {
  lease: LandlordLease;
  busy: boolean;
  onSend: () => void;
  onSign: () => void;
  onRenew: () => void;
  onDownload: () => void;
}) {
  const { colors, spacing } = useTheme();

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {l.tenantName}
          </Text>
          <Badge label={l.status} tone={LEASE_STATUS_TONE[l.status]} />
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {l.propertyName}
          {l.unitName ? ` · ${l.unitName}` : ''}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {formatDate(l.leaseStart, 'short')} – {formatDate(l.leaseEnd, 'short')}
          </Text>
          <Price amount={l.rentAmount} period="year" variant="callout" />
        </View>

        {/* Signature state is the thing a landlord chases, so surface it plainly. */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SignatureChip label="Landlord" signed={l.landlordSigned} />
          <SignatureChip label="Tenant" signed={l.tenantSigned} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
          {l.status === 'draft' ? (
            <LeaseAction
              icon={<Send size={13} color={colors.primaryForeground} />}
              label="Send"
              onPress={onSend}
              busy={busy}
              filled
            />
          ) : null}
          {!l.landlordSigned ? (
            <LeaseAction
              icon={<PenLine size={13} color={colors.primary} />}
              label="Sign"
              onPress={onSign}
              busy={busy}
            />
          ) : null}
          {l.status === 'signed' || l.status === 'active' || l.status === 'expired' ? (
            <LeaseAction
              icon={<RefreshCw size={13} color={colors.primary} />}
              label="Renew"
              onPress={onRenew}
              busy={busy}
            />
          ) : null}
          <LeaseAction
            icon={<Download size={13} color={colors.primary} />}
            label="PDF"
            onPress={onDownload}
            busy={busy}
          />
        </View>
      </View>
    </Card>
  );
}

function LeaseAction({
  icon,
  label,
  onPress,
  busy,
  filled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  busy: boolean;
  filled?: boolean;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: filled ? 0 : 1,
        borderColor: colors.border,
        backgroundColor: filled ? colors.primary : 'transparent',
        opacity: busy ? 0.5 : 1,
      }}
    >
      {icon}
      <Text
        variant="caption"
        style={{
          fontWeight: '600',
          color: filled ? colors.primaryForeground : colors.primary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SignatureChip({ label, signed }: { label: string; signed: boolean }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: spacing.md,
        paddingVertical: 5,
        borderRadius: radius.full,
        backgroundColor: signed ? colors.success + '1f' : colors.secondary,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: signed ? colors.success : colors.mutedForeground,
        }}
      />
      <Text
        variant="caption"
        style={{ fontSize: 11, color: signed ? colors.success : colors.mutedForeground }}
      >
        {label} {signed ? 'signed' : 'pending'}
      </Text>
    </View>
  );
}
