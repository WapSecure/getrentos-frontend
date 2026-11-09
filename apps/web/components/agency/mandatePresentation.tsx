import { Badge } from '@sureground/ui';
import { MANDATE_STATUS_LABELS, type MandateStatus } from '@/services/mandateService';

// Shared so the list and the detail page always colour a status the same way.
export const STATUS_VARIANT: Record<
  MandateStatus,
  'success' | 'warning' | 'danger' | 'neutral' | 'info'
> = {
  DRAFT: 'neutral',
  PENDING_OWNER: 'info',
  PENDING_OPS: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  TERMINATED: 'neutral',
  EXPIRED: 'neutral',
  REJECTED: 'danger',
};

export function MandateStatusBadge({ status }: { status: MandateStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{MANDATE_STATUS_LABELS[status]}</Badge>;
}

const CAPABILITY_MEANING: Record<string, string> = {
  list: 'Advertise and let the property',
  manage: 'Run the tenancy, repairs and inspections',
  money: "Collect and pay out the owner's money",
};

export function CapabilityChip({ on, label }: { on: boolean; label: string }) {
  const meaning = CAPABILITY_MEANING[label] ?? label;
  const description = `${meaning}: ${on ? 'allowed' : 'not allowed under this agreement'}`;
  return (
    <Badge
      variant={on ? 'success' : 'neutral'}
      title={description}
      aria-label={description}
      className={on ? undefined : 'line-through'}
    >
      {label}
    </Badge>
  );
}

export function formatMoment(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}
