'use client';

import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Handshake,
  Megaphone,
  TrendingUp,
  UserPlus,
} from '@sureground/icons';
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
            icon: TrendingUp,
            value: visible ? formatCurrency(totalPortfolioValue, { compact: true }) : '••••••',
            subtitle: 'Current estimate',
            // Analytics is a Pro feature; on Free the figure would lead to an upgrade wall.
            href: isPro ? ROUTES.OWNER_ANALYTICS : undefined,
          },
          {
            label: 'Properties',
            icon: Building2,
            value: totalProperties,
            subtitle: 'Across your portfolio',
            href: ROUTES.OWNER_PROPERTIES,
          },
          {
            label: 'Completed sales',
            icon: CheckCircle2,
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
            icon: Megaphone,
            value: activeSaleListings,
            subtitle: 'Published for sale',
            href: ROUTES.OWNER_LISTINGS,
          },
          {
            label: 'Buyer leads',
            icon: UserPlus,
            value: buyerInquiries,
            subtitle: 'Viewings, offers and enquiries',
            href: ROUTES.OWNER_LEADS,
          },
          {
            label: 'Pending offers',
            icon: Handshake,
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
