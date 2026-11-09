'use client';

import { ClipboardList } from 'lucide-react';
import { Button, PageHeader } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

interface AgentDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const AgentDashboardHeader = ({ greeting, firstName }: AgentDashboardHeaderProps) => {
  return (
    <PageHeader
      title={`${greeting}, ${firstName}`}
      description="Review today's assigned visits, inspections, and work in progress."
      actions={
        <Button href={ROUTES.AGENT_TASKS} variant="primary" size="lg" icon={<ClipboardList />}>
          View tasks
        </Button>
      }
    />
  );
};
