import { useState } from 'react';
import { Alert, Pressable, RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CircleCheck, HardHat, TriangleAlert, Wrench } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_TONE,
  PRIORITY_TONE,
  type LandlordMaintenance,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { AssignVendorSheet } from '@/components/landlord/AssignVendorSheet';

/** Requests still needing the landlord to act. */
const OPEN = ['pending', 'acknowledged', 'in_progress'];

export default function LandlordMaintenanceScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<LandlordMaintenance | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.maintenance(),
    queryFn: () => landlordApi.maintenance(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['landlord', 'maintenance'] });
    qc.invalidateQueries({ queryKey: qk.landlord.dashboardStats });
  };

  const fail = (e: unknown, fallback: string) =>
    toast.show(e instanceof ApiError ? e.message : fallback, 'error');

  const resolve = useMutation({
    mutationFn: (id: string) => landlordApi.resolveMaintenance(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      invalidate();
      toast.show('Marked resolved.', 'success');
    },
    onError: (e) => fail(e, 'Could not resolve that request.'),
  });

  const escalate = useMutation({
    mutationFn: (id: string) => landlordApi.escalateMaintenance(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      invalidate();
      toast.show('Escalated.', 'success');
    },
    onError: (e) => fail(e, 'Could not escalate that request.'),
  });

  const items = query.data?.items ?? [];
  const openCount = items.filter((m) => OPEN.includes(m.status)).length;

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
          <Text variant="title">Maintenance</Text>
          {query.data ? (
            <Text variant="caption" color={openCount > 0 ? 'destructive' : 'mutedForeground'}>
              {openCount > 0 ? `${openCount} open` : 'Nothing open'}
            </Text>
          ) : null}
        </View>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={128} radius={radius.lg} />
          ))}
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(m) => m.id}
          renderItem={({ item }: { item: LandlordMaintenance }) => (
            <RequestCard
              request={item}
              busy={busyId === item.id}
              onResolve={() =>
                Alert.alert('Mark resolved?', `"${item.issueTitle}" will be closed.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Resolve', onPress: () => resolve.mutate(item.id) },
                ])
              }
              onEscalate={() => escalate.mutate(item.id)}
              onAssign={() => setAssigning(item)}
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
              icon={<Wrench size={32} color={colors.mutedForeground} />}
              title="Nothing reported"
              description="Issues your tenants report appear here, newest first."
            />
          }
        />
      )}

      <AssignVendorSheet
        open={!!assigning}
        onClose={() => setAssigning(null)}
        request={assigning}
      />
    </View>
  );
}

function RequestCard({
  request: m,
  busy,
  onResolve,
  onEscalate,
  onAssign,
}: {
  request: LandlordMaintenance;
  busy: boolean;
  onResolve: () => void;
  onEscalate: () => void;
  onAssign: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  const actionable = OPEN.includes(m.status);

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {m.issueTitle}
          </Text>
          <Badge label={m.priority} tone={PRIORITY_TONE[m.priority]} />
          <Badge
            label={MAINTENANCE_STATUS_LABEL[m.status]}
            tone={MAINTENANCE_STATUS_TONE[m.status]}
          />
        </View>

        <Text variant="callout" color="mutedForeground" numberOfLines={2}>
          {m.description}
        </Text>

        <Text variant="caption" color="mutedForeground">
          {m.propertyName}
          {m.unitName ? ` · ${m.unitName}` : ''} · {m.tenantName} · {relativeTime(m.createdAt)}
        </Text>

        {actionable ? (
          <Pressable
            onPress={onAssign}
            accessibilityRole="button"
            accessibilityLabel={
              m.vendorName
                ? `Change vendor for ${m.issueTitle}`
                : `Assign a vendor to ${m.issueTitle}`
            }
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <HardHat size={13} color={colors.primary} />
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              {m.vendorName ? `Vendor: ${m.vendorName}` : 'Assign a vendor'}
            </Text>
          </Pressable>
        ) : m.vendorName ? (
          <Text variant="caption" color="mutedForeground">
            Vendor: {m.vendorName}
          </Text>
        ) : null}

        {actionable ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
            <Pressable
              onPress={onEscalate}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Escalate ${m.issueTitle}`}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <TriangleAlert size={14} color={colors.warning} />
              <Text variant="caption" style={{ fontWeight: '600', color: colors.warning }}>
                Escalate
              </Text>
            </Pressable>

            <Pressable
              onPress={onResolve}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Resolve ${m.issueTitle}`}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.primary,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <CircleCheck size={14} color={colors.primaryForeground} />
              <Text
                variant="caption"
                style={{ color: colors.primaryForeground, fontWeight: '600' }}
              >
                Resolve
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
