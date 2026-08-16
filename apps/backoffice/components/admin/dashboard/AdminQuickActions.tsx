'use client';

import { ShieldCheck, Gavel, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@getrentos/shared';

const actions = [
  { label: 'Review Verifications', href: ROUTES.ADMIN_VERIFICATIONS, icon: ShieldCheck },
  { label: 'View Disputes', href: ROUTES.ADMIN_DISPUTES, icon: Gavel },
  { label: 'Fraud Alerts', href: ROUTES.ADMIN_FRAUD, icon: AlertTriangle },
  { label: 'Manage Users', href: ROUTES.ADMIN_USERS, icon: Users },
];

export const AdminQuickActions = () => {
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
