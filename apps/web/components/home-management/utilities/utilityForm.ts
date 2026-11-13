import type { HomeManagementProperty } from '@/services/homeManagementService';

/** Today's date in Lagos, `YYYY-MM-DD`, for date pickers and supply logs. */
export function lagosToday(now: Date = new Date()): string {
  return new Date(now.getTime() + 60 * 60_000).toISOString().slice(0, 10);
}

/**
 * A picked day as an instant the server accepts: today means now (so it is never in the future),
 * an earlier day means midday in Lagos on that day.
 */
export function dayToInstant(day: string, now: Date = new Date()): string {
  if (!day || day >= lagosToday(now)) return now.toISOString();
  return new Date(`${day}T12:00:00+01:00`).toISOString();
}

export function propertyName(property: HomeManagementProperty): string {
  return property.title || property.name || 'Untitled property';
}

export function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/** A typed decimal, or undefined when the box is empty or not a positive number. */
export function optionalPositiveNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
