'use client';

import { StatGroup } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

interface BuyerStatsCardsProps {
  savedProperties: number;
  upcomingViewings: number;
  activeOffers: number;
  activeTransactions: number;
  documentsUploaded: number;
  completedPurchases: number;
}

export const BuyerStatsCards = (props: BuyerStatsCardsProps) => (
  <div className="mb-8 space-y-4">
    <StatGroup
      title="Your search"
      items={[
        {
          label: 'Saved properties',
          value: props.savedProperties,
          subtitle: 'In your shortlist',
          href: ROUTES.BUYER_SAVED,
        },
        {
          label: 'Upcoming viewings',
          value: props.upcomingViewings,
          subtitle: 'Scheduled tours',
          href: ROUTES.BUYER_VIEWINGS,
        },
      ]}
    />
    <StatGroup
      title="Purchases"
      items={[
        {
          label: 'Active offers',
          value: props.activeOffers,
          subtitle: 'Awaiting a response',
          href: ROUTES.BUYER_OFFERS,
        },
        {
          label: 'Active purchases',
          value: props.activeTransactions,
          subtitle: 'Protected transactions',
          href: ROUTES.BUYER_TRANSACTIONS,
        },
        {
          label: 'Completed',
          value: props.completedPurchases,
          subtitle: 'Lifetime',
          href: ROUTES.BUYER_TRANSACTIONS,
        },
        {
          label: 'Documents',
          value: props.documentsUploaded,
          subtitle: 'Uploaded to your vault',
          href: ROUTES.BUYER_DOCUMENTS,
        },
      ]}
    />
  </div>
);
