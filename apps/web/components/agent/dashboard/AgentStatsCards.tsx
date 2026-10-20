'use client';

import { StatCard } from '@getrentos/ui';
import { ClipboardList, CheckCircle2, RefreshCw, AlertTriangle, Star, Clock } from 'lucide-react';

interface AgentStatsCardsProps {
  todaysTasks: number;
  completedThisWeek: number;
  pendingSync: number;
  overdueTasks: number;
  avgRating: number;
  avgResponseTime: string;
}

export const AgentStatsCards = ({
  todaysTasks,
  completedThisWeek,
  pendingSync,
  overdueTasks,
  avgRating,
  avgResponseTime,
}: AgentStatsCardsProps) => {
  const stats = [
    {
      icon: ClipboardList,
      label: "Today's Tasks",
      value: todaysTasks,
      subtitle: 'Assigned to you',
      accent: 'primary',
      delay: 0,
    },
    {
      icon: CheckCircle2,
      label: 'Completed This Week',
      value: completedThisWeek,
      subtitle: 'Inspections & visits',
      accent: 'green',
      delay: 0.05,
    },
    {
      icon: RefreshCw,
      label: 'Pending Sync',
      value: pendingSync,
      subtitle: 'Awaiting upload',
      accent: 'blue',
      delay: 0.1,
    },
    {
      icon: AlertTriangle,
      label: 'Overdue',
      value: overdueTasks,
      subtitle: 'Needs attention',
      accent: 'red',
      delay: 0.15,
    },
    {
      icon: Star,
      label: 'Avg. Rating',
      value: avgRating.toFixed(1),
      subtitle: 'From clients',
      accent: 'emerald',
      delay: 0.2,
    },
    {
      icon: Clock,
      label: 'Avg. Response Time',
      value: avgResponseTime,
      subtitle: 'To new tasks',
      accent: 'orange',
      delay: 0.25,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
