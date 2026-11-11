'use client';

import { tierAtLeast, type PlanTier } from '@sureground/shared';
import { usePlanTier } from '@/hooks/usePlanTier';
import { useLandAvailability } from '@/hooks/useLandAvailability';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import type { NavFlag, NavPlan } from './types';

/** Locks against the viewer's own plan; while it loads the viewer counts as Free. */
export const useViewerPlanLock = () => {
  const { tier } = usePlanTier();
  return (plan: NavPlan) => !tierAtLeast(tier, plan);
};

/** Locks against an estate's plan; an unknown plan locks nothing, since the page still refuses with the real upsell. */
export const estatePlanLock = (planTier: PlanTier | undefined) => (plan: NavPlan) =>
  Boolean(planTier && !tierAtLeast(planTier, plan));

export const useNavigationFlags = (): Record<NavFlag, boolean> => {
  const land = useLandAvailability();
  const diaspora = useDiasporaAvailability();
  return {
    landOwners: land.owners,
    landMarketplace: land.marketplace,
    diasporaInvest: diaspora.enabled,
  };
};
