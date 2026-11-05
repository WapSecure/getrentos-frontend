'use client';

import { StatCard } from '@getrentos/ui';
import { Activity, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';

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
  const stats = [
    {
      icon: ClipboardList,
      label: 'Assigned',
      value: todaysTasks,
      subtitle: 'Not started, not yet due',
      accent: 'primary',
      compact: true,
    },
    {
      icon: CheckCircle2,
      label: 'Completed this week',
      value: completedThisWeek,
      subtitle: 'Inspections & visits',
      accent: 'green',
      compact: true,
    },
    {
      icon: Activity,
      label: 'In progress',
      value: inProgress,
      subtitle: 'Currently underway',
      accent: 'blue',
      compact: true,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      value: overdueTasks,
      subtitle: 'Needs attention',
      accent: 'red',
      compact: true,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
