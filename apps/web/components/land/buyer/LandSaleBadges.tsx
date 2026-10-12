import { Badge, type BadgeVariant } from '@getrentos/ui';
import {
  LAND_INSTALLMENT_STATUS_LABELS,
  LAND_MILESTONE_STATUS_LABELS,
  LAND_PURCHASE_STATUS_LABELS,
  LAND_RESERVATION_STATUS_LABELS,
  type LandInstallmentStatus,
  type LandMilestoneStatus,
  type LandPurchaseStatus,
  type LandReservationStatus,
} from '@/types/landBuyer';

const PURCHASE_VARIANT: Record<LandPurchaseStatus, BadgeVariant> = {
  PENDING_DEPOSIT: 'warning',
  ACTIVE: 'info',
  PAID_IN_FULL: 'success',
  COMPLETED: 'success',
  DEFAULTED: 'danger',
  REVOKED: 'danger',
  CANCELLED: 'neutral',
};

const RESERVATION_VARIANT: Record<LandReservationStatus, BadgeVariant> = {
  ACTIVE: 'warning',
  CONVERTED: 'success',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
};

const INSTALLMENT_VARIANT: Record<LandInstallmentStatus, BadgeVariant> = {
  PENDING: 'neutral',
  PAID: 'success',
  OVERDUE: 'danger',
  WAIVED: 'info',
};

const MILESTONE_VARIANT: Record<LandMilestoneStatus, BadgeVariant> = {
  PENDING: 'neutral',
  DELIVERED: 'warning',
  CONFIRMED: 'success',
  DISPUTED: 'danger',
  WAIVED: 'info',
};

export const PurchaseStatusBadge = ({ status }: { status: LandPurchaseStatus }) => (
  <Badge variant={PURCHASE_VARIANT[status]}>{LAND_PURCHASE_STATUS_LABELS[status]}</Badge>
);

export const ReservationStatusBadge = ({ status }: { status: LandReservationStatus }) => (
  <Badge variant={RESERVATION_VARIANT[status]}>{LAND_RESERVATION_STATUS_LABELS[status]}</Badge>
);

export const InstallmentStatusBadge = ({ status }: { status: LandInstallmentStatus }) => (
  <Badge variant={INSTALLMENT_VARIANT[status]}>{LAND_INSTALLMENT_STATUS_LABELS[status]}</Badge>
);

export const MilestoneStatusBadge = ({ status }: { status: LandMilestoneStatus }) => (
  <Badge variant={MILESTONE_VARIANT[status]}>{LAND_MILESTONE_STATUS_LABELS[status]}</Badge>
);
