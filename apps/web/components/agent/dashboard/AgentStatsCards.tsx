'use client';

import { SegmentedBar, StatGroup } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

interface AgentStatsCardsProps {
  todaysTasks: number;
  completedThisWeek: number;
  inProgress: number;
  overdueTasks: number;
}

export const AgentStatsCards = ({
  todaysTasks,
  completedThisWeek,
  inProgress,
  overdueTasks,
}: AgentStatsCardsProps) => {
  // The server counts these three by exclusive status (overdue includes assigned tasks past due), so they add up to the open tasks.
  const openTasks = todaysTasks + inProgress + overdueTasks;

  return (
    <StatGroup
      title="Tasks"
      items={[
        {
          label: 'Assigned',
          value: todaysTasks,
          subtitle: 'Not started, not yet due',
          href: ROUTES.AGENT_TASKS,
        },
        {
          label: 'In progress',
          value: inProgress,
          subtitle: 'Currently underway',
          href: ROUTES.AGENT_TASKS,
        },
        {
          label: 'Overdue',
          value: overdueTasks,
          subtitle: 'Needs attention',
          attention: overdueTasks > 0,
          href: ROUTES.AGENT_TASKS,
        },
        {
          label: 'Completed',
          value: completedThisWeek,
          subtitle: 'Last 7 days',
          href: ROUTES.AGENT_TASKS,
        },
      ]}
      footer={
        openTasks > 0 ? (
          <SegmentedBar
            label="Open tasks by status"
            segments={[
              { label: 'Assigned', value: todaysTasks, tone: 'primary' },
              { label: 'In progress', value: inProgress, tone: 'warning' },
              { label: 'Overdue', value: overdueTasks, tone: 'danger' },
            ]}
          />
        ) : undefined
      }
    />
  );
};
