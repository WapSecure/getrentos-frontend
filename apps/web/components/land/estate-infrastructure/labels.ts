import type {
  EstateChangeOrderKind,
  EstateCommitment,
  EstateCommitmentKind,
  EstateCommitmentStatus,
} from '@/types/landEstateInfrastructure';
import { ESTATE_COMMITMENT_KINDS } from '@/types/landEstateInfrastructure';

export const COMMITMENT_KIND_LABELS: Record<EstateCommitmentKind, string> = {
  ROADS: 'Roads',
  DRAINAGE: 'Drainage',
  POWER: 'Power supply',
  WATER: 'Water supply',
  PERIMETER_FENCE: 'Perimeter fence',
  GATEHOUSE: 'Gatehouse and security',
  STREET_LIGHTS: 'Street lights',
  OTHER: 'Other',
};

export const COMMITMENT_KIND_OPTIONS = ESTATE_COMMITMENT_KINDS.map((value) => ({
  value,
  label: COMMITMENT_KIND_LABELS[value],
}));

export const COMMITMENT_STATUS_LABELS: Record<EstateCommitmentStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In progress',
  DELIVERED: 'Delivered, awaiting check',
  VERIFIED: 'Verified by GetRentos',
  DISPUTED: 'Disputed',
};

export const CHANGE_KIND_LABELS: Record<EstateChangeOrderKind, string> = {
  DATE_CHANGE: 'New target date',
  SCOPE_CHANGE: 'Change in what is delivered',
  WITHDRAWAL: 'Withdrawn',
};

export const CHANGE_KIND_OPTIONS = (Object.keys(CHANGE_KIND_LABELS) as EstateChangeOrderKind[]).map(
  (value) => ({ value, label: CHANGE_KIND_LABELS[value] })
);

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

/** One colour per state; overdue and withdrawn win over the stored status. */
export const commitmentBadge = (
  commitment: Pick<EstateCommitment, 'status' | 'overdue' | 'withdrawn'>
): { label: string; variant: BadgeVariant } => {
  if (commitment.withdrawn) return { label: 'Withdrawn', variant: 'neutral' };
  if (commitment.overdue) return { label: 'Overdue', variant: 'danger' };
  const variant: Record<EstateCommitmentStatus, BadgeVariant> = {
    PLANNED: 'neutral',
    IN_PROGRESS: 'info',
    DELIVERED: 'warning',
    VERIFIED: 'success',
    DISPUTED: 'danger',
  };
  return {
    label: COMMITMENT_STATUS_LABELS[commitment.status],
    variant: variant[commitment.status],
  };
};
