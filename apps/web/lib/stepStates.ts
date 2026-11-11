import type { TimelineState } from '@sureground/ui';

/**
 * Timeline states for an ordered process that is at step `current`. Steps before it are done;
 * reaching the last step means the process is finished, so every step is done. A process that
 * was stopped (`blocked`) or unwound (`skipped`) marks every step that way instead.
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
 * Land conveyance steps in sequence order. Only one is current: the earliest delivered step
 * awaiting the buyer's confirmation, otherwise the first not yet delivered. Other delivered
 * steps show as pending; their status badge still says they await confirmation.
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
