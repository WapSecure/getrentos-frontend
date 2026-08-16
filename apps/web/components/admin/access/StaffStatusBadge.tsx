'use client';

import { Ban, CheckCircle2, Clock, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import type { AdminStaffStatus } from '@/types/admin';

const statusConfig: Record<
  AdminStaffStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: 'Active', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  suspended: { label: 'Suspended', variant: 'warning', icon: ShieldAlert },
  banned: { label: 'Banned', variant: 'danger', icon: Ban },
};

/** Renders an internal staff account status badge (backend enums are uppercase). */
export const StaffStatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status.toLowerCase() as AdminStaffStatus] ?? statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} icon={<Icon className="h-3 w-3" />}>
      {config.label}
    </Badge>
  );
};
