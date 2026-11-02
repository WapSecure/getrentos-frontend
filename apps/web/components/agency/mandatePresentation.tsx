import { Badge } from '@getrentos/ui';
import { MANDATE_STATUS_LABELS, type MandateStatus } from '@/services/mandateService';

/**
 * How a mandate's status is coloured, in one place.
 *
 * Shared because the list and the detail page must agree: a mandate that looks
 * "ended" on one screen and "active" on the other is worse than either being
 * wrong, since it teaches people not to trust either.
 */
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

/**
 * A scope's granted capability. Struck through when the scope exists on the
 * agreement but grants nothing enforceable yet — FINANCE is the case that made
 * this necessary.
 */
export function CapabilityChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        on
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground line-through'
      }`}
    >
      {label}
    </span>
  );
}

/**
 * A date and time, for the moments that matter to the minute — a signature, a
 * termination, the start of a notice clock. `formatDay` drops the time, which is
 * right for a period and wrong for an event.
 */
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
  });
}
