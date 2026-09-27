import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList } from 'lucide-react-native';
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
import {
  agentApi,
  AGENT_TASK_STATUSES,
  AGENT_TASK_STATUS_LABEL,
  AGENT_TASK_STATUS_TONE,
  AGENT_TASK_TYPE_LABEL,
  type AgentTask,
  type AgentTaskStatus,
} from '@/lib/api/agent';
import { formatDate } from '@/lib/format';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

export default function AgentTasks() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<AgentTaskStatus | undefined>(undefined);

  const query = useQuery({
    queryKey: qk.agent.tasks(1, 50, status),
    queryFn: () => agentApi.tasks(1, 50, { status }),
  });
  const items = query.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: insets.top + spacing.lg,
          gap: spacing.md,
        }}
      >
        <DashboardHeader
          eyebrow="Field operations"
          title="Tasks"
          subtitle="Assignments organized by status and deadline"
        />
        <ScrollView
          horizontal
          accessibilityLabel="Filter tasks by status"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <Chip label="All" selected={!status} onPress={() => setStatus(undefined)} size="sm" />
          {AGENT_TASK_STATUSES.map((s) => (
            <Chip
              key={s}
              label={AGENT_TASK_STATUS_LABEL[s]}
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
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={90} radius={radius.lg} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={34} color={colors.mutedForeground} />}
          title="No tasks"
          description={
            status
              ? 'No tasks match this filter.'
              : 'Tasks your clients assign you will show up here.'
          }
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(task) => task.id}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing['3xl'],
          }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.mutedForeground}
            />
          }
          renderItem={({ item: task }: { item: AgentTask }) => (
            <Pressable
              onPress={() => router.push(`/(app)/agent-task/${task.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${task.title}, ${AGENT_TASK_STATUS_LABEL[task.status]}, due ${formatDate(task.dueAt, 'short')}`}
            >
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
                      {task.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground" numberOfLines={1}>
                      {AGENT_TASK_TYPE_LABEL[task.type]} · {task.property.title}
                    </Text>
                    <Text variant="caption" color="mutedForeground">
                      Due {formatDate(task.dueAt, 'short')}
                    </Text>
                  </View>
                  <Badge
                    label={AGENT_TASK_STATUS_LABEL[task.status]}
                    tone={AGENT_TASK_STATUS_TONE[task.status]}
                  />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
