import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardCheck } from 'lucide-react-native';
import {
  Badge,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { agentApi, type AgentInspection } from '@/lib/api/agent';
import { formatDate } from '@/lib/format';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

const STATUSES = ['DRAFT', 'SUBMITTED'] as const;
type InspectionStatus = (typeof STATUSES)[number];

const TYPE_LABEL: Record<string, string> = {
  MOVE_IN: 'Move-in',
  MOVE_OUT: 'Move-out',
  PERIODIC: 'Periodic',
  OTHER: 'Other',
};

export default function AgentInspections() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<InspectionStatus | undefined>(undefined);

  const query = useQuery({
    queryKey: qk.agent.inspections(1, 50),
    queryFn: () => agentApi.inspections(1, 50),
  });

  const items = (query.data?.items ?? []).filter((i) => !status || i.status === status);

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
          eyebrow="Field operations"
          title="Inspections"
          subtitle="Draft and submitted property reports"
          onBack={() => router.back()}
        />
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <ScrollView
          accessibilityLabel="Filter inspections by status"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <Chip label="All" selected={!status} onPress={() => setStatus(undefined)} size="sm" />
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={s === 'DRAFT' ? 'Draft' : 'Submitted'}
              selected={status === s}
              onPress={() => setStatus(s)}
              size="sm"
            />
          ))}
        </ScrollView>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={110} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={34} color={colors.mutedForeground} />}
          title="No inspections"
          description={
            status
              ? 'No inspections match this filter.'
              : 'Inspections you submit will appear here.'
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: AgentInspection }) => (
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
              <Pressable onPress={() => router.push(`/(app)/agent-task/${item.taskId}`)}>
                <Card elevated>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {item.property?.title ?? 'Property'}
                      </Text>
                      <Text variant="caption" color="mutedForeground">
                        {TYPE_LABEL[item.type] ?? item.type} ·{' '}
                        {formatDate(item.scheduledAt, 'short')}
                      </Text>
                      {item.clientName ? (
                        <Text variant="caption" color="mutedForeground">
                          Client: {item.clientName}
                        </Text>
                      ) : null}
                      <Text variant="caption" color="mutedForeground">
                        {item.rooms.length} {item.rooms.length === 1 ? 'room' : 'rooms'} recorded
                      </Text>
                    </View>
                    <Badge
                      label={item.status === 'DRAFT' ? 'Draft' : 'Submitted'}
                      tone={item.status === 'DRAFT' ? 'warning' : 'success'}
                    />
                  </View>
                </Card>
              </Pressable>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
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
