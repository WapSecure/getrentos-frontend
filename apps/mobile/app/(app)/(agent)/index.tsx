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
import { Badge, Card, Screen, Skeleton, Text, useTheme } from '@getrentos/ui-native';
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
      <View style={{ gap: spacing.xxs }}>
        <Text variant="label" color="primary" uppercase>
          {greeting()}
        </Text>
        <Text variant="title">{firstName(profile?.legalName)}</Text>
      </View>

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

      <Card elevated padding="none">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {dashboard.isPending
            ? [0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    width: '50%',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.lg,
                  }}
                >
                  <Skeleton height={22} width={22} />
                </View>
              ))
            : metrics.map(({ label, value, Icon }, i) => (
                <View
                  key={label}
                  style={{
                    width: '50%',
                    alignItems: 'center',
                    gap: 6,
                    paddingVertical: spacing.lg,
                    borderLeftWidth: i % 2 === 1 ? 1 : 0,
                    borderTopWidth: i >= 2 ? 1 : 0,
                    borderColor: colors.border,
                  }}
                >
                  <Icon size={17} color={colors.mutedForeground} />
                  <Text variant="title" style={{ fontSize: 20, lineHeight: 24 }}>
                    {value}
                  </Text>
                  <Text variant="caption" color="mutedForeground">
                    {label}
                  </Text>
                </View>
              ))}
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text variant="heading">Upcoming tasks</Text>
          <Pressable
            onPress={() => router.push('/(app)/(agent)/tasks')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text variant="callout" color="primary" style={{ fontWeight: '600' }}>
              See all
            </Text>
            <ChevronRight size={15} color={colors.primary} />
          </Pressable>
        </View>

        {dashboard.isPending ? (
          <View style={{ gap: spacing.sm }}>
            <Skeleton height={80} radius={16} />
            <Skeleton height={80} radius={16} />
          </View>
        ) : !dashboard.data?.upcomingTasks.length ? (
          <Card elevated>
            <Text variant="callout" color="mutedForeground">
              Nothing due — you&apos;re all caught up.
            </Text>
          </Card>
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
