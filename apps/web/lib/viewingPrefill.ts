// Empty when the requested slot has passed, so the landlord picks a fresh time instead of fixing a stale one.
export function preferredSlotValue(
  preferredAt: string | undefined,
  now: number = Date.now()
): string {
  if (!preferredAt) return '';
  const at = new Date(preferredAt);
  if (Number.isNaN(at.getTime()) || at.getTime() <= now) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
