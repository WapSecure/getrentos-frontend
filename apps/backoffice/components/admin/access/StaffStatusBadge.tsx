'use client';

import { Ban, CheckCircle2, Clock, ShieldAlert, type SgIcon } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import type { AdminStaffStatus } from '@/types/admin';

const statusConfig: Record<
  AdminStaffStatus,
  { label: string; variant: BadgeVariant; icon: SgIcon }
> = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  suspended: { label: 'Suspended', variant: 'warning', icon: ShieldAlert },
  banned: { label: 'Banned', variant: 'danger', icon: Ban },
};

export const StaffStatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status.toLowerCase() as AdminStaffStatus] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} icon={<Icon className="h-3 w-3" />}>
      {config.label}
    </Badge>
  );
};
