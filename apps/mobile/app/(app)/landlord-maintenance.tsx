import { useState } from 'react';
import { humaniseEnum } from '@sureground/shared';
import { Alert, Pressable, RefreshControl, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, HardHat, Sparkles, TriangleAlert, Wrench } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  QueryState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_TONE,
  PRIORITY_TONE,
  type LandlordMaintenance,
} from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { relativeTime } from '@/lib/format';
import { AssignVendorSheet } from '@/components/landlord/AssignVendorSheet';
import { TriageSheet } from '@/components/landlord/TriageSheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const OPEN = ['pending', 'acknowledged', 'in_progress'];

export default function LandlordMaintenanceScreen() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<LandlordMaintenance | null>(null);
  const [triaging, setTriaging] = useState<LandlordMaintenance | null>(null);

  const query = useQuery({
    queryKey: qk.landlord.maintenance(),
    queryFn: () => landlordApi.maintenance(),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['landlord', 'maintenance'] });
    qc.invalidateQueries({ queryKey: qk.landlord.dashboardStats });
  };

  const fail = (e: unknown, fallback: string) => toast.show(errorMessage(e, fallback), 'error');

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
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <DetailHeader
          eyebrow="Operations"
          title="Maintenance"
          subtitle={
            query.data
              ? openCount > 0
                ? `${openCount} open request${openCount === 1 ? '' : 's'}`
                : 'Nothing open'
              : 'Track repairs and vendor work'
          }
          onBack={() => goBack()}
        />
      </View>

      <QueryState
        query={query}
        skeleton={
          <View style={{ gap: spacing.sm }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={128} radius={radius.md} />
            ))}
          </View>
        }
        style={{ paddingHorizontal: spacing.xl }}
      >
        <FlashList
          data={items}
          keyExtractor={(m) => m.id}
          renderItem={({ item }: { item: LandlordMaintenance }) => (
            <RequestCard
              request={item}
              busy={busyId === item.id}
              pending={resolve.isPending ? 'resolve' : escalate.isPending ? 'escalate' : null}
              onResolve={() =>
                Alert.alert('Mark resolved?', `"${item.issueTitle}" will be closed.`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Resolve', onPress: () => resolve.mutate(item.id) },
                ])
              }
              onEscalate={() => escalate.mutate(item.id)}
              onAssign={() => setAssigning(item)}
              onTriage={() => setTriaging(item)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
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
      </QueryState>

      <AssignVendorSheet
        open={!!assigning}
        onClose={() => setAssigning(null)}
        request={assigning}
      />
      <TriageSheet request={triaging} onClose={() => setTriaging(null)} onApplied={invalidate} />
    </View>
  );
}

function RequestCard({
  request: m,
  busy,
  pending,
  onResolve,
  onEscalate,
  onAssign,
  onTriage,
}: {
  request: LandlordMaintenance;
  busy: boolean;
  pending: 'resolve' | 'escalate' | null;
  onResolve: () => void;
  onEscalate: () => void;
  onAssign: () => void;
  onTriage: () => void;
}) {
  const { colors, spacing } = useTheme();
  const actionable = OPEN.includes(m.status);

  return (
    <Card padding={spacing.lg} style={{ marginBottom: spacing.sm }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {m.issueTitle}
          </Text>
          <Badge label={humaniseEnum(m.priority)} tone={PRIORITY_TONE[m.priority]} />
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
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={
              m.vendorName
                ? `Change vendor for ${m.issueTitle}`
                : `Assign a vendor to ${m.issueTitle}`
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              opacity: busy ? 0.5 : 1,
            }}
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

        {m.workOrderScope ? (
          <Text variant="caption">
            <Text variant="caption" style={{ fontWeight: '600' }}>
              Agreed scope:{' '}
            </Text>
            {m.workOrderScope}
          </Text>
        ) : null}

        {actionable ? (
          <Button
            label="Auto-triage"
            variant="outline"
            size="sm"
            onPress={onTriage}
            disabled={busy}
            accessibilityLabel={`Auto-triage ${m.issueTitle}`}
            icon={<Sparkles size={14} color={colors.primary} />}
          />
        ) : null}

        {actionable ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
            <Button
              label="Escalate"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={onEscalate}
              disabled={busy}
              loading={busy && pending === 'escalate'}
              accessibilityLabel={`Escalate ${m.issueTitle}`}
              icon={<TriangleAlert size={14} color={colors.warning} />}
              style={{ flex: 1 }}
            />
            <Button
              label="Resolve"
              size="sm"
              fullWidth={false}
              onPress={onResolve}
              disabled={busy}
              loading={busy && pending === 'resolve'}
              accessibilityLabel={`Resolve ${m.issueTitle}`}
              icon={<CircleCheck size={14} color={colors.primaryForeground} />}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
