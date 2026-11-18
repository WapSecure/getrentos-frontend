import type { PlanTier } from '@/types/admin';

export const planLabel = (tier: PlanTier) =>
  tier === 'ENTERPRISE' ? 'Enterprise' : tier === 'PRO' ? 'Pro' : 'Free';

const LAGOS_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' });

export const todayInLagos = () => LAGOS_DAY.format(new Date());

// The last moment of the chosen day in Lagos, so choosing today still counts as a future end date.
export const endOfLagosDay = (day: string) => new Date(`${day}T23:59:59+01:00`).toISOString();

export const lagosDayOf = (iso: string) => LAGOS_DAY.format(new Date(iso));
