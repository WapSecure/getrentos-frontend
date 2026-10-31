'use client';

import { ShieldCheck, Gavel, AlertTriangle, Users } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@getrentos/shared';
import { useAdminUser } from '@/app/(dashboard)/admin/layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import type { AdminPermission } from '@/types/admin';

const actions: {
  label: string;
  href: string;
  icon: React.ElementType;
  permission: AdminPermission;
}[] = [
  {
    label: 'Review Verifications',
    href: ROUTES.ADMIN_VERIFICATIONS,
    icon: ShieldCheck,
    permission: 'verifications.review',
  },
  {
    label: 'View Disputes',
    href: ROUTES.ADMIN_DISPUTES,
    icon: Gavel,
    permission: 'disputes.review',
  },
  {
    label: 'Fraud Alerts',
    href: ROUTES.ADMIN_FRAUD,
    icon: AlertTriangle,
    permission: 'fraud.review',
  },
  { label: 'Manage Users', href: ROUTES.ADMIN_USERS, icon: Users, permission: 'users.view' },
];

/** Shortcuts into the queues — only the ones the signed-in role can work. */
export const AdminQuickActions = () => {
  const user = useAdminUser();
  const available = actions.filter((action) => hasAdminPermission(user?.roles, action.permission));
  if (available.length === 0) return null;
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {available.map((action) => (
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
