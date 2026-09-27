import { RefreshControl, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, CloudOff, RefreshCw } from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentSyncApi, type AgentSyncItem } from '@/lib/api/agentSync';
import { formatDate } from '@/lib/format';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';

const STATUS_ICON: Record<AgentSyncItem['syncStatus'], typeof CheckCircle> = {
  synced: CheckCircle,
  pending: RefreshCw,
  failed: CloudOff,
};

const STATUS_TONE: Record<AgentSyncItem['syncStatus'], 'success' | 'warning' | 'danger'> = {
  synced: 'success',
  pending: 'warning',
  failed: 'danger',
};

export default function AgentSync() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const query = useQuery({ queryKey: qk.agent.sync, queryFn: agentSyncApi.list });
  const items = query.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Offline readiness"
        title="Sync status"
        subtitle="Track field records waiting to upload"
        onBack={() => router.back()}
      />

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={60} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={34} color={colors.mutedForeground} />}
          title="Nothing to sync"
          description="Inspections and verifications you submit will show their sync status here."
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentSyncItem }) => {
            const StatusIcon = STATUS_ICON[item.syncStatus];
            return (
              <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                <Card elevated>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <StatusIcon size={16} color={colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text variant="callout" numberOfLines={1}>
                        {item.recordLabel}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {formatDate(item.capturedAt, 'short')}
                      </Text>
                    </View>
                    <Badge
                      label={item.syncStatus[0].toUpperCase() + item.syncStatus.slice(1)}
                      tone={STATUS_TONE[item.syncStatus]}
                    />
                  </View>
                </Card>
              </View>
            );
          }}
          contentContainerStyle={{
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
        />
      )}
    </View>
  );
}
