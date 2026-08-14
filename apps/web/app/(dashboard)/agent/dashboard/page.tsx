'use client';

import { useAgentUser } from '../layout';
import { AgentDashboardHeader } from '@/components/agent/dashboard/AgentDashboardHeader';
import { AgentStatsCards } from '@/components/agent/dashboard/AgentStatsCards';
import { AgentTaskList } from '@/components/agent/dashboard/AgentTaskList';
import { AgentQuickActions } from '@/components/agent/dashboard/AgentQuickActions';
import { useQuery } from '@tanstack/react-query';
import { agentService, mapAgentTask } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

export default function AgentDashboardPage() {
  const user = useAgentUser();
  const { data: dashboard } = useQuery({
    queryKey: agentKeys.dashboard,
    queryFn: () => unwrap(agentService.getDashboard()),
  });

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <AgentDashboardHeader greeting={greeting} firstName={firstName} />

      <AgentStatsCards
        todaysTasks={dashboard?.assignedTasks ?? 0}
        completedThisWeek={dashboard?.completedTasks ?? 0}
        pendingSync={dashboard?.inProgressTasks ?? 0}
        overdueTasks={dashboard?.overdueTasks ?? 0}
        avgRating={0}
        avgResponseTime="—"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AgentTaskList tasks={(dashboard?.upcomingTasks ?? []).map(mapAgentTask)} />
        </div>
        <div>
          <AgentQuickActions />
        </div>
      </div>
    </>
  );
}
