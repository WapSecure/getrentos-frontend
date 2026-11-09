'use client';

import { ShieldCheck, Gavel, AlertTriangle, Users } from '@sureground/icons';
import { Button, Card, CardHeader, CardTitle } from '@sureground/ui';
import { ROUTES } from '@sureground/shared';
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
    label: 'Review verifications',
    href: ROUTES.ADMIN_VERIFICATIONS,
    icon: ShieldCheck,
    permission: 'verifications.review',
  },
  {
    label: 'View disputes',
    href: ROUTES.ADMIN_DISPUTES,
    icon: Gavel,
    permission: 'disputes.review',
  },
  {
    label: 'Fraud alerts',
    href: ROUTES.ADMIN_FRAUD,
    icon: AlertTriangle,
    permission: 'fraud.review',
  },
  { label: 'Manage users', href: ROUTES.ADMIN_USERS, icon: Users, permission: 'users.view' },
];

export const AdminQuickActions = () => {
  const user = useAdminUser();
  const available = actions.filter((action) => hasAdminPermission(user?.roles, action.permission));
  if (available.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 p-5 pt-4">
        {available.map((action) => (
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
