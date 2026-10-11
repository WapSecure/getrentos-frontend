import { tierAtLeast } from '@getrentos/shared';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';

/**
 * The selected estate's plan, for gating estate features.
 *
 * An estate feature is paid for by the estate owner's subscription, which is
 * what the API checks. `usePlanTier()` reads the signed-in manager's own plan,
 * so it locked a manager out of features a paying estate had bought, and would
 * let one with a personal plan into features the estate had not.
 *
 * An unknown tier (the estate's plan could not be resolved) counts as allowed,
 * like `EstateFeatureGate`: the API still refuses with an accurate upsell, and
 * hiding a paid feature during an outage is the worse mistake.
 */
export function useEstatePlan() {
  const { estate, isLoading } = useSelectedEstate();
  const tier = estate?.planTier;
  return {
    tier,
    isPro: !tier || tierAtLeast(tier, 'PRO'),
    isEnterprise: !tier || tierAtLeast(tier, 'ENTERPRISE'),
    isLoading,
  };
}
