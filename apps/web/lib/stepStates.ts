import type { TimelineState } from '@sureground/ui';

/**
 * Reaching the last step means the process is finished, so every step is done. A stopped (`blocked`)
 * or unwound (`skipped`) process marks every step that way instead.
 */
export function stepStates(
  keys: readonly string[],
  current: string,
  stopped?: 'blocked' | 'skipped' | null
): TimelineState[] {
  if (stopped) return keys.map(() => stopped);
  const active = keys.indexOf(current);
  const finished = active === keys.length - 1;
  return keys.map((_, index) =>
    index < active || (finished && index === active)
      ? 'done'
      : index === active
        ? 'current'
        : 'pending'
  );
}

type MilestoneStatus = 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'DISPUTED' | 'WAIVED';

/**
 * Only one step is current: the earliest delivered one awaiting the buyer, else the first undelivered.
 * Other delivered steps show as pending; their badge still says they await confirmation.
 */
export function milestoneStates(statuses: readonly MilestoneStatus[]): TimelineState[] {
  const delivered = statuses.indexOf('DELIVERED');
  const current = delivered >= 0 ? delivered : statuses.indexOf('PENDING');
  return statuses.map((status, index) => {
    if (index === current) return 'current';
    if (status === 'CONFIRMED') return 'done';
    if (status === 'DISPUTED') return 'blocked';
    if (status === 'WAIVED') return 'skipped';
    return 'pending';
  });
}
