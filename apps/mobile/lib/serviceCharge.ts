import type { ServiceChargeBudgetStatus, ServiceChargeCollection } from '@sureground/shared';
import type { BadgeTone } from '@sureground/ui-native';

export const STATUS_TONE: Record<ServiceChargeBudgetStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  CLOSED: 'info',
  VOIDED: 'danger',
};

export const COLLECTION_TONE: Record<ServiceChargeCollection, BadgeTone> = {
  PAID: 'success',
  PART_PAID: 'warning',
  UNPAID: 'neutral',
  REMOVED: 'neutral',
  NOT_BILLED: 'info',
  VOIDED: 'danger',
};

/** A `YYYY-MM-DD` day as "1 Jan 2027", read at midday so no time zone moves it to another day. */
export function formatDay(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
