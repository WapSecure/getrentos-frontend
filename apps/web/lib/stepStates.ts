import type { TimelineState } from '@sureground/ui';

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
