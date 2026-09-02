'use client';

import { ClipboardCheck, UserCheck, ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Start Inspection', href: ROUTES.AGENT_INSPECTIONS, icon: ClipboardCheck },
  { label: 'Log Verification', href: ROUTES.AGENT_VERIFICATIONS, icon: UserCheck },
  { label: 'View Tasks', href: ROUTES.AGENT_TASKS, icon: ClipboardList },
  { label: 'Sync Center', href: ROUTES.AGENT_SYNC, icon: RefreshCw },
];

export const AgentQuickActions = () => {
  return (
    <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant="outline"
            rounded="lg"
            className="flex-col h-auto py-4 gap-2"
          >
            <action.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
