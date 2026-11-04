'use client';

import { ClipboardCheck, UserCheck, ClipboardList, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Start Inspection', href: ROUTES.AGENT_INSPECTIONS, icon: ClipboardCheck },
  { label: 'Log Verification', href: ROUTES.AGENT_VERIFICATIONS, icon: UserCheck },
  { label: 'View Tasks', href: ROUTES.AGENT_TASKS, icon: ClipboardList },
  { label: 'Sync Center', href: ROUTES.AGENT_SYNC, icon: RefreshCw },
];

export const AgentQuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 p-5 pt-4">
        {actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant="outline"
            className="h-auto flex-col gap-2 py-4"
          >
            <action.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-center text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
