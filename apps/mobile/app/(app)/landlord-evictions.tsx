import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Download, Gavel, TriangleAlert, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { OpenEvictionSheet } from '@/components/landlord/SmallFormSheets';
import {
  landlordApi,
  EVICTION_TONE,
  type EvictionCase,
  type EvictionStatus,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { PDF_MIME, shareDownloadedFile } from '@/lib/shareFile';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

function tone(status: string) {
  return EVICTION_TONE[status.toLowerCase() as EvictionStatus] ?? 'neutral';
}

export default function LandlordEvictions() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.evictions(),
    queryFn: () => landlordApi.evictions(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['landlord', 'evictions'] });
  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const downloadNotice = useMutation({
    mutationFn: async (kase: EvictionCase) => {
      const { bytes } = await landlordApi.evictionNoticePdf(kase.id);
      await shareDownloadedFile(bytes, `eviction-notice-${kase.id}.pdf`, PDF_MIME, 'Notice');
    },
    onMutate: (kase) => setBusyId(kase.id),
    onSettled: () => setBusyId(null),
    onError: (e) => fail(e, 'Could not download that notice.'),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'file' | 'resolve' | 'withdraw' }) =>
      action === 'file'
        ? landlordApi.fileEviction(id)
        : action === 'resolve'
          ? landlordApi.resolveEviction(id)
          : landlordApi.withdrawEviction(id),
    onMutate: ({ id }) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: (_d, { action }) => {
      invalidate();
      toast.show(
        action === 'file'
          ? 'Case filed.'
          : action === 'resolve'
            ? 'Case resolved.'
            : 'Case withdrawn.',
        'success'
      );
    },
    onError: (e) => fail(e, 'Could not update that case.'),
  });

  const items = query.data?.items ?? [];
  const active = items.filter((e) => !['resolved', 'withdrawn'].includes(e.status.toLowerCase()));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Tenancy cases"
        title="Evictions"
        subtitle={
          query.data
            ? active.length > 0
              ? `${active.length} active`
              : 'No active cases'
            : 'Notices, filings and resolutions'
        }
        onBack={() => router.back()}
        accessory={
          <IconButton
            onPress={() => setCreating(true)}
            accessibilityLabel="Open an eviction case"
            icon={<Plus size={20} color={colors.primary} />}
          />
        }
      />

      {query.isError && !query.data ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={150} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(e) => e.id}
          renderItem={({ item }: { item: EvictionCase }) => (
            <CaseCard
              kase={item}
              busy={busyId === item.id}
              acting={busyId === item.id && act.isPending ? act.variables?.action : undefined}
              onAct={(action, label) =>
                Alert.alert(`${label}?`, `${item.tenantName} · ${item.propertyName}`, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: label,
                    style: action === 'withdraw' ? 'default' : 'destructive',
                    onPress: () => act.mutate({ id: item.id, action }),
                  },
                ])
              }
              onDownloadNotice={() => downloadNotice.mutate(item)}
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
              icon={<Gavel size={32} color={colors.mutedForeground} />}
              title="No eviction cases"
              description="Cases you open against a tenancy are tracked here through notice, filing and resolution."
            />
          }
        />
      )}

      <OpenEvictionSheet open={creating} onClose={() => setCreating(false)} />
    </View>
  );
}

function CaseCard({
  kase: e,
  busy,
  acting,
  onAct,
  onDownloadNotice,
}: {
  kase: EvictionCase;
  busy: boolean;
  /** The case action being sent, so its button shows progress. */
  acting?: 'file' | 'resolve' | 'withdraw';
  onAct: (action: 'file' | 'resolve' | 'withdraw', label: string) => void;
  onDownloadNotice: () => void;
}) {
  const { colors, spacing } = useTheme();
  const status = e.status.toLowerCase();
  const open = !['resolved', 'withdrawn'].includes(status);

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {e.tenantName}
          </Text>
          <Badge label={status} tone={tone(status)} />
        </View>

        <Text variant="caption" color="mutedForeground" numberOfLines={1}>
          {e.propertyName}
          {e.unitName ? ` · ${e.unitName}` : ''}
        </Text>

        <Text variant="callout" color="mutedForeground" numberOfLines={2}>
          {e.reason}
        </Text>

        {/* The cure deadline is the date everything else hangs off. */}
        {e.cureDeadline ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <TriangleAlert size={13} color={colors.warning} />
            <Text variant="caption" style={{ color: colors.warning }}>
              Cure deadline {formatDate(e.cureDeadline, 'short')}
            </Text>
          </View>
        ) : null}

        {e.resolutionNotes ? (
          <Text variant="caption" color="mutedForeground">
            {e.resolutionNotes}
          </Text>
        ) : null}

        {status !== 'draft' ? (
          <Pressable
            onPress={onDownloadNotice}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Download the notice"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, opacity: busy ? 0.5 : 1 }}
          >
            <Download size={13} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Download notice
            </Text>
          </Pressable>
        ) : null}

        {open ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
            <ActionButton
              label="Withdraw"
              onPress={() => onAct('withdraw', 'Withdraw')}
              busy={busy}
              loading={acting === 'withdraw'}
            />
            {status === 'issued' ? (
              <ActionButton
                label="File"
                onPress={() => onAct('file', 'File')}
                busy={busy}
                loading={acting === 'file'}
                tone="destructive"
              />
            ) : null}
            <ActionButton
              label="Resolve"
              onPress={() => onAct('resolve', 'Resolve')}
              busy={busy}
              loading={acting === 'resolve'}
              tone="primary"
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

function ActionButton({
  label,
  onPress,
  busy,
  loading,
  tone: t,
}: {
  label: string;
  onPress: () => void;
  busy: boolean;
  loading?: boolean;
  tone?: 'primary' | 'destructive';
}) {
  return (
    <Button
      label={label}
      onPress={onPress}
      disabled={busy}
      loading={loading}
      size="sm"
      fullWidth={false}
      variant={t ?? 'outline'}
      style={{ flex: 1 }}
    />
  );
}
