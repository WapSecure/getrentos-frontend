'use client';

import { ClipboardCheck, UserCheck, ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const actions = [
  { label: 'Start Inspection', href: '/agent/inspections', icon: ClipboardCheck },
  { label: 'Log Verification', href: '/agent/verifications', icon: UserCheck },
  { label: 'View Tasks', href: '/agent/tasks', icon: ClipboardList },
  { label: 'Sync Center', href: '/agent/sync', icon: RefreshCw },
];

export const AgentQuickActions = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
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
