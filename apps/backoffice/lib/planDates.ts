import type { PlanTier } from '@/types/admin';

export const planLabel = (tier: PlanTier) =>
  tier === 'ENTERPRISE' ? 'Enterprise' : tier === 'PRO' ? 'Pro' : 'Free';

const LAGOS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' });

export const todayInLagos = () => LAGOS_DAY.format(new Date());

// The last moment of the chosen day in Lagos, so choosing today still counts as a future end date.
export const endOfLagosDay = (day: string) => new Date(`${day}T23:59:59+01:00`).toISOString();

export const lagosDayOf = (iso: string) => LAGOS_DAY.format(new Date(iso));

export const MAX_STAFF_GRANT_MONTHS = 12;

const shiftDay = (day: string, { days = 0, months = 0 }: { days?: number; months?: number }) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const tomorrowInLagos = () => shiftDay(todayInLagos(), { days: 1 });

export const latestStaffGrantDay = () =>
  shiftDay(todayInLagos(), { months: MAX_STAFF_GRANT_MONTHS });

// Keeps a current end date when it is still grantable, else offers the longest allowed grant.
export const initialStaffGrantDay = (currentEnd?: string | null) => {
  const day = currentEnd ? lagosDayOf(currentEnd) : '';
  return day && isStaffGrantDayAllowed(day) ? day : latestStaffGrantDay();
};

export const isStaffGrantDayAllowed = (day: string) =>
  day !== '' && day >= tomorrowInLagos() && day <= latestStaffGrantDay();

export const MIN_GRANT_REASON = 3;
export const MAX_GRANT_REASON = 500;
