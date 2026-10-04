import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Users,
} from 'lucide-react-native';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SectionHeader,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import {
  AttentionCard,
  QuickActions,
  dashboardGreeting,
} from '@/components/dashboard/DashboardParts';
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

export default function AgentHome() {
  const { profile } = useAuth();
  const { colors, spacing } = useTheme();

  const dashboard = useQuery({ queryKey: qk.agent.dashboard, queryFn: agentApi.dashboard });

  const toTasks = () => router.push('/(app)/(agent)/tasks');

  const header = (
    <DashboardHeader
      eyebrow={dashboardGreeting()}
      title={firstName(profile?.legalName)}
      roleBadge="AG"
      subtitle="Your tasks, clients and field work"
    />
  );

  const metrics = dashboard.data
    ? [
        {
          label: 'Properties',
          value: dashboard.data.assignedProperties,
          Icon: Building2,
          onPress: () => router.push('/(app)/agent-properties'),
        },
        {
          label: 'Assigned',
          value: dashboard.data.assignedTasks,
          Icon: ClipboardList,
          onPress: toTasks,
        },
        {
          label: 'In progress',
          value: dashboard.data.inProgressTasks,
          Icon: Clock,
          onPress: toTasks,
        },
        {
          label: 'Completed',
          value: dashboard.data.completedTasks,
          Icon: ClipboardCheck,
          onPress: toTasks,
        },
      ]
    : [];

  if (dashboard.isError && !dashboard.data) {
    return (
      <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
        {header}
        <ErrorState
          title="We couldn't load your dashboard"
          description="Check your connection and try again. Your assigned work is safe."
          onRetry={() => dashboard.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshing={dashboard.isRefetching} onRefresh={() => dashboard.refetch()}>
      {header}

      {/* What needs you first: work past its deadline. */}
      {dashboard.data && dashboard.data.overdueTasks > 0 ? (
        <AttentionCard
          Icon={AlertTriangle}
          tone="warning"
          title={`${dashboard.data.overdueTasks} overdue ${dashboard.data.overdueTasks === 1 ? 'task' : 'tasks'}`}
          detail="Take a look before they pile up"
          onPress={toTasks}
        />
      ) : null}

      <MetricGrid metrics={metrics} loading={dashboard.isPending} />

      <QuickActions
        actions={[
          { label: 'My tasks', Icon: ClipboardList, onPress: toTasks },
          { label: 'Clients', Icon: Users, onPress: () => router.push('/(app)/(agent)/clients') },
          {
            label: 'Inspections',
            Icon: ClipboardCheck,
            onPress: () => router.push('/(app)/agent-inspections'),
          },
          {
            label: 'Verifications',
            Icon: BadgeCheck,
            onPress: () => router.push('/(app)/agent-verifications'),
          },
        ]}
      />

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
            <Pressable
              key={task.id}
              onPress={() => router.push(`/(app)/agent-task/${task.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${task.title}, ${AGENT_TASK_TYPE_LABEL[task.type]}, ${AGENT_TASK_STATUS_LABEL[task.status]}, due ${formatDate(task.dueAt, 'short')}`}
              accessibilityHint="Opens task details"
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
          ))
        )}
      </View>
    </Screen>
  );
}
