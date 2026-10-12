import { Badge, type BadgeVariant } from '@getrentos/ui';
import { humaniseEnum } from '@/lib/landDiligence';

const variants: Record<string, BadgeVariant> = {
  PENDING_DEPOSIT: 'neutral',
  ACTIVE: 'info',
  PAID_IN_FULL: 'success',
  COMPLETED: 'success',
  DEFAULTED: 'danger',
  REVOKED: 'danger',
  CANCELLED: 'warning',
};

export const LandPurchaseStatusBadge = ({ status }: { status: string }) => (
  <Badge variant={variants[status] ?? 'neutral'}>{humaniseEnum(status)}</Badge>
);

const lineVariants: Record<string, BadgeVariant> = {
  PENDING: 'neutral',
  PAID: 'success',
  OVERDUE: 'danger',
  WAIVED: 'info',
  CONFIRMED: 'success',
  DELIVERED: 'info',
  DISPUTED: 'danger',
  FAILED: 'danger',
};

/** Installment, payment and milestone statuses share one palette. */
export const LandLineStatusBadge = ({ status }: { status: string }) => (
  <Badge variant={lineVariants[status] ?? 'neutral'}>{humaniseEnum(status)}</Badge>
);
