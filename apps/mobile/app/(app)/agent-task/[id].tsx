import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Calendar, ChevronLeft, User } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  agentApi,
  AGENT_TASK_STATUS_LABEL,
  AGENT_TASK_STATUS_TONE,
  AGENT_TASK_TYPE_LABEL,
  type AgentTaskStatus,
} from '@/lib/api/agent';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

export default function AgentTaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: qk.agent.tasks(1, 50), queryFn: () => agentApi.tasks(1, 50) });
  const task = query.data?.items.find((t) => t.id === id);

  const statusMutation = useMutation({
    mutationFn: (status: AgentTaskStatus) => agentApi.updateTaskStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'tasks'] });
      qc.invalidateQueries({ queryKey: qk.agent.dashboard });
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not update this task.', 'error'),
  });

  const confirmCancel = () => {
    Alert.alert('Cancel this task?', 'This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel task',
        style: 'destructive',
        onPress: () => statusMutation.mutate('CANCELLED'),
      },
    ]);
  };

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
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="title">Task</Text>
      </View>

      {query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Skeleton height={140} radius={16} />
        </View>
      ) : !task ? (
        <Text variant="body" color="mutedForeground" style={{ padding: spacing.xl }}>
          This task could not be found.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + spacing['3xl'],
            gap: spacing.lg,
          }}
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
                <Text variant="heading">{task.title}</Text>
                <Text variant="callout" color="mutedForeground">
                  {AGENT_TASK_TYPE_LABEL[task.type]}
                </Text>
              </View>
              <Badge
                label={AGENT_TASK_STATUS_LABEL[task.status]}
                tone={AGENT_TASK_STATUS_TONE[task.status]}
              />
            </View>

            {task.notes ? (
              <Text variant="body" color="mutedForeground" style={{ marginTop: spacing.md }}>
                {task.notes}
              </Text>
            ) : null}

            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Building2 size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  {task.property.title} · {task.property.address}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Calendar size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  Due {formatDate(task.dueAt, 'short')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <User size={15} color={colors.mutedForeground} />
                <Text variant="callout" color="mutedForeground">
                  Assigned by {task.assignedBy.legalName}
                </Text>
              </View>
            </View>
          </Card>

          {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' ? (
            <View style={{ gap: spacing.sm }}>
              {task.type === 'INSPECTION' ? (
                <Button
                  label="Submit inspection"
                  onPress={() => router.push(`/(app)/agent-inspection/${task.id}`)}
                />
              ) : task.type === 'VERIFICATION' ? (
                <Button
                  label="Submit verification"
                  onPress={() => router.push(`/(app)/agent-verification/${task.id}`)}
                />
              ) : (
                <>
                  {task.status === 'ASSIGNED' ? (
                    <Button
                      label="Start task"
                      loading={statusMutation.isPending}
                      onPress={() => statusMutation.mutate('IN_PROGRESS')}
                    />
                  ) : null}
                  {task.status === 'IN_PROGRESS' ? (
                    <Button
                      label="Mark complete"
                      loading={statusMutation.isPending}
                      onPress={() => statusMutation.mutate('COMPLETED')}
                    />
                  ) : null}
                </>
              )}
              <Button label="Cancel task" variant="ghost" onPress={confirmCancel} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
