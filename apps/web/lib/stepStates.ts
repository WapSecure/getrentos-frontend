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
