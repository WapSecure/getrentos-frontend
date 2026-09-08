'use client';

import { Badge } from '@getrentos/ui';
import { usePlanTier } from '@/hooks/usePlanTier';

/** Renders nothing while loading — avoids a flash of "Free" before the real tier resolves. */
export const PlanBadge = () => {
  const { tier, isLoading } = usePlanTier();
  if (isLoading) return null;

  return (
    <Badge variant={tier === 'PRO' ? 'info' : 'neutral'}>{tier === 'PRO' ? 'Pro' : 'Free'}</Badge>
  );
};
