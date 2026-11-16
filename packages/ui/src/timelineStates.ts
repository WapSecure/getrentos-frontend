export type TimelineState = 'done' | 'current' | 'pending' | 'blocked' | 'skipped';

/** Only one step may carry aria-current="step": any later `current` shows as `pending`. */
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
