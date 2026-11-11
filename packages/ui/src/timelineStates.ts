export type TimelineState = 'done' | 'current' | 'pending' | 'blocked' | 'skipped';

/**
 * Keeps at most one `current` item, so only one step carries aria-current="step". Any later
 * `current` is shown as `pending`; `onExtra` is told how many were passed so callers can be warned.
 */
export function singleCurrent<T extends { state: TimelineState }>(
  items: readonly T[],
  onExtra?: (count: number) => void
): T[] {
  const first = items.findIndex((item) => item.state === 'current');
  const count = items.filter((item) => item.state === 'current').length;
  if (count <= 1) return [...items];
  onExtra?.(count);
  return items.map((item, index) =>
    item.state === 'current' && index !== first ? { ...item, state: 'pending' } : item
  );
}
