'use client';

import { tierAtLeast, type PlanTier } from '@sureground/shared';
import { usePlanTier } from '@/hooks/usePlanTier';
import { useLandAvailability } from '@/hooks/useLandAvailability';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import type { NavFlag, NavPlan } from './types';

export const useViewerPlanLock = () => {
  const { tier } = usePlanTier();
  return (plan: NavPlan) => !tierAtLeast(tier, plan);
};

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
