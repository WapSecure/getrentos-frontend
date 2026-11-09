// Mirrors the backend's shared/plans/plan-tier.util.ts. Compare by rank: `tier === 'PRO'` is false
// for an Enterprise subscriber.
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

// Cheapest first; order is the whole point.
export const PLAN_TIERS: readonly PlanTier[] = ['FREE', 'PRO', 'ENTERPRISE'];

export function tierAtLeast(tier: PlanTier, required: PlanTier): boolean {
  return PLAN_TIERS.indexOf(tier) >= PLAN_TIERS.indexOf(required);
}

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};
