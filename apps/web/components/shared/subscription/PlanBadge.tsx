'use client';

import { Badge } from '@sureground/ui';
import { PLAN_TIER_LABELS } from '@sureground/shared';
import { usePlanTier } from '@/hooks/usePlanTier';

/** Renders nothing while loading: avoids a flash of "Free" before the real tier resolves. */
export const PlanBadge = () => {
  const { tier, isLoading } = usePlanTier();
  if (isLoading) return null;

  return <Badge variant={tier === 'FREE' ? 'neutral' : 'info'}>{PLAN_TIER_LABELS[tier]}</Badge>;
};
