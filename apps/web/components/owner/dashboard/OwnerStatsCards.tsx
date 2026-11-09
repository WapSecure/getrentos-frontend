'use client';

import { Eye, EyeOff } from '@sureground/icons';
import { IconButton, StatGroup } from '@sureground/ui';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';
import { usePlanTier } from '@/hooks/usePlanTier';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';

interface OwnerStatsCardsProps {
  totalProperties: number;
  activeSaleListings: number;
  buyerInquiries: number;
  pendingOffers: number;
  totalPortfolioValue: number;
  completedSales: number;
}

export const OwnerStatsCards = ({
  totalProperties,
  activeSaleListings,
  buyerInquiries,
  pendingOffers,
  totalPortfolioValue,
  completedSales,
}: OwnerStatsCardsProps) => {
  const { visible, toggle } = useMonetaryVisibility();
  const { isPro } = usePlanTier();

  return (
    <div className="mb-8 space-y-4">
      <StatGroup
        title="Portfolio"
        action={
          <IconButton
            label={visible ? 'Hide monetary values' : 'Show monetary values'}
            icon={visible ? <EyeOff /> : <Eye />}
            onClick={toggle}
            size="sm"
            variant="ghost"
          />
        }
        items={[
          {
            label: 'Portfolio value',
            value: visible ? formatCurrency(totalPortfolioValue, { compact: true }) : '••••••',
            subtitle: 'Current estimate',
            // Analytics is a Pro feature; on Free the figure would lead to an upgrade wall.
            href: isPro ? ROUTES.OWNER_ANALYTICS : undefined,
          },
          {
            label: 'Properties',
            value: totalProperties,
            subtitle: 'Across your portfolio',
            href: ROUTES.OWNER_PROPERTIES,
          },
          {
            label: 'Completed sales',
            value: completedSales,
            subtitle: 'Lifetime',
            href: ROUTES.OWNER_TRANSACTIONS,
          },
        ]}
      />
      <StatGroup
        title="Sales activity"
        items={[
          {
            label: 'Active listings',
            value: activeSaleListings,
            subtitle: 'Published for sale',
            href: ROUTES.OWNER_LISTINGS,
          },
          {
            label: 'Buyer enquiries',
            value: buyerInquiries,
            subtitle: 'Recent buyer activity',
            href: ROUTES.OWNER_LEADS,
          },
          {
            label: 'Pending offers',
            value: pendingOffers,
            subtitle: 'Awaiting a response',
            attention: pendingOffers > 0,
            href: ROUTES.OWNER_OFFERS,
          },
        ]}
      />
    </div>
  );
};
