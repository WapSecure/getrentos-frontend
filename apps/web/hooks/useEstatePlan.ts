import { tierAtLeast } from '@sureground/shared';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';

// Estate features are paid by the estate owner's plan (what the API checks), not the manager's own; an unknown tier counts as allowed because the API still refuses with an accurate upsell.
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
