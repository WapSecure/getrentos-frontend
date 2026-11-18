'use client';

import { Badge } from '@sureground/ui';
import { PLAN_TIER_LABELS, type PlanTier } from '@sureground/shared';
import { usePlanTier } from '@/hooks/usePlanTier';

/** Renders nothing while loading: avoids a flash of "Free" before the real tier resolves. Pass `tier` to show someone else's plan, such as an estate's. */
export const PlanBadge = ({ tier: shown }: { tier?: PlanTier }) => {
  const own = usePlanTier();
  const tier = shown ?? own.tier;
  if (!shown && own.isLoading) return null;

  return <Badge variant={tier === 'FREE' ? 'neutral' : 'info'}>{PLAN_TIER_LABELS[tier]}</Badge>;
};
