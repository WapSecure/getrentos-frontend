/**
 * The subscription ladder, in one place on the client.
 *
 * Mirrors the backend's `shared/plans/plan-tier.util.ts`. It exists because the
 * client kept answering "does this user have Pro?" with `tier === 'PRO'`, which
 * is false for an ENTERPRISE subscriber — so an enterprise customer saw their
 * own Pro features as locked. The backend learned this lesson first ("the ladder
 * is a ladder"); this is the same ladder, in the same order.
 */
export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

/** Cheapest first. Order is the whole point — never compare by name. */
export const PLAN_TIERS: readonly PlanTier[] = ['FREE', 'PRO', 'ENTERPRISE'];

/** True when `tier` reaches `required` on the ladder above. */
export function tierAtLeast(tier: PlanTier, required: PlanTier): boolean {
  return PLAN_TIERS.indexOf(tier) >= PLAN_TIERS.indexOf(required);
}

/** How each tier is written for a person. One spelling, so no screen says "Pro" and another "PRO". */
export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};
