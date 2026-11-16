'use client';

import { useAgentUser } from '../layout';
import { AgentDashboardHeader } from '@/components/agent/dashboard/AgentDashboardHeader';
import { AgentStatsCards } from '@/components/agent/dashboard/AgentStatsCards';
import { AgentTaskList } from '@/components/agent/dashboard/AgentTaskList';
import { TodaysRoute } from '@/components/agent/dashboard/TodaysRoute';
import { AgentQuickActions } from '@/components/agent/dashboard/AgentQuickActions';
import { useQuery } from '@tanstack/react-query';
import { agentService, mapAgentTask } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';
import { AttentionFeed } from '@/components/shared/attention/AttentionFeed';
import { GetStartedCard } from '@/components/shared/dashboard/GetStartedCard';
import { ClipboardList, ShieldCheck } from '@sureground/icons';
import { IdentityNudge } from '@/components/shared/verification/IdentityNudge';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { PageErrorState, StatGroupSkeleton } from '@sureground/ui';

export default function AgentDashboardPage() {
  const user = useAgentUser();
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: agentKeys.dashboard,
    queryFn: () => unwrap(agentService.getDashboard()),
  });

  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? '';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <div className="space-y-6">
      <AgentDashboardHeader greeting={greeting} firstName={firstName} />
      <IdentityNudge
        verificationHref={ROUTES.AGENT_VERIFICATION}
        unlocks="run verification visits and receive payouts"
        className="mb-6"
      />
      <GetStartedCard
        id="agent"
        description="How work reaches you as an agent."
        steps={[
          {
            title: 'Tasks come from owners',
            body: 'A landlord or owner adds you as their agent and assigns visits, inspections or repairs. Each one appears in Tasks with the property and what to do.',
            icon: ClipboardList,
            href: ROUTES.AGENT_TASKS,
          },
          {
            title: 'Verify your ID',
            body: 'You need a checked ID to run verification visits and receive payouts.',
            icon: ShieldCheck,
            href: ROUTES.AGENT_VERIFICATION,
          },
        ]}
      />
      <AttentionFeed persona="agent" />

      {dashboardLoading ? (
        <StatGroupSkeleton groups={[4]} />
      ) : dashboardError && !dashboard ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your tasks"
          onRetry={() => void refetchDashboard()}
        />
      ) : (
        <AgentStatsCards
          todaysTasks={dashboard?.assignedTasks ?? 0}
          completedThisWeek={dashboard?.completedThisWeek ?? 0}
          inProgress={dashboard?.inProgressTasks ?? 0}
          overdueTasks={dashboard?.overdueTasks ?? 0}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          <TodaysRoute />
          <AgentTaskList tasks={(dashboard?.upcomingTasks ?? []).map(mapAgentTask)} />
        </div>
        <aside className="min-w-0 xl:col-span-4">
          <AgentQuickActions />
        </aside>
      </div>
    </div>
  );
}
