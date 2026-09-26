import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
} from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { qk } from '@/lib/query/keys';
import {
  agentApi,
  AGENT_TASK_TYPE_LABEL,
  AGENT_TASK_STATUS_TONE,
  AGENT_TASK_STATUS_LABEL,
  type AgentTask,
} from '@/lib/api/agent';
import { useAuth } from '@/lib/auth/AuthProvider';
import { formatDate, firstName } from '@/lib/format';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AgentHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const dashboard = useQuery({ queryKey: qk.agent.dashboard, queryFn: agentApi.dashboard });

  const metrics = dashboard.data
    ? [
        { label: 'Properties', value: dashboard.data.assignedProperties, Icon: Building2 },
        { label: 'Assigned', value: dashboard.data.assignedTasks, Icon: ClipboardList },
        { label: 'In progress', value: dashboard.data.inProgressTasks, Icon: Clock },
        { label: 'Completed', value: dashboard.data.completedTasks, Icon: ClipboardCheck },
      ]
    : [];

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      <DashboardHeader
        eyebrow={greeting()}
        title={firstName(profile?.legalName)}
        subtitle="Field operations and property work"
      />

      {dashboard.data && dashboard.data.overdueTasks > 0 ? (
        <Pressable onPress={() => router.push('/(app)/(agent)/tasks')}>
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors.warningSubtle,
            }}
          >
            <AlertTriangle size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: colors.warning }}>
                {dashboard.data.overdueTasks} overdue{' '}
                {dashboard.data.overdueTasks === 1 ? 'task' : 'tasks'}
              </Text>
              <Text variant="caption" color="mutedForeground">
                Take a look before they pile up
              </Text>
            </View>
            <ChevronRight size={18} color={colors.warning} />
          </Card>
        </Pressable>
      ) : null}

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <View style={{ gap: spacing.md }}>
        <SectionHeader
          title="Upcoming tasks"
          description="Prioritized by deadline and status"
          actionLabel="See all"
          onAction={() => router.push('/(app)/(agent)/tasks')}
        />

        {dashboard.isPending ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={80} radius={16} />
            <Skeleton height={80} radius={16} />
          </View>
        ) : !dashboard.data?.upcomingTasks.length ? (
          <EmptyState
            icon={<ClipboardCheck size={30} color={colors.mutedForeground} />}
            title="You're all caught up"
            description="New field assignments will appear here when they are scheduled."
          />
        ) : (
          dashboard.data.upcomingTasks.map((task: AgentTask) => (
            <Pressable key={task.id} onPress={() => router.push(`/(app)/agent-task/${task.id}`)}>
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
          ))
        )}
      </View>
    </Screen>
  );
}
