'use client';

import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AgentDashboardHeaderProps {
  greeting: string;
  firstName: string;
}

export const AgentDashboardHeader = ({ greeting, firstName }: AgentDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s on your schedule today.
        </p>
      </div>
      <Button href="/agent/tasks" variant="primary" className="gap-2">
        <ClipboardList className="w-4 h-4" />
        View Tasks
      </Button>
    </div>
  );
};
