'use client';

import { ClipboardList } from '@sureground/icons';
import { Button } from '@sureground/ui';
import { DashboardHeader } from '@/components/shared/dashboard/DashboardHeader';
import { ROUTES } from '@/lib/constants/auth';

interface AgentDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const AgentDashboardHeader = ({ greeting, firstName }: AgentDashboardHeaderProps) => (
  <DashboardHeader
    title={`${greeting}, ${firstName}`}
    description="Review today's assigned visits, inspections, and work in progress."
    action={
      <Button href={ROUTES.AGENT_TASKS} variant="primary" size="lg" icon={<ClipboardList />}>
        View tasks
      </Button>
    }
  />
);
