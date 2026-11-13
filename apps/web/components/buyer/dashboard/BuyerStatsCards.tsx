'use client';

import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Handshake,
  Heart,
  ShieldCheck,
} from '@sureground/icons';
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
          icon: Heart,
          value: props.savedProperties,
          subtitle: 'In your shortlist',
          href: ROUTES.BUYER_SAVED,
        },
        {
          label: 'Upcoming viewings',
          icon: CalendarClock,
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
          icon: Handshake,
          value: props.activeOffers,
          subtitle: 'Awaiting a response',
          href: ROUTES.BUYER_OFFERS,
        },
        {
          label: 'Active purchases',
          icon: ShieldCheck,
          value: props.activeTransactions,
          subtitle: 'Protected transactions',
          href: ROUTES.BUYER_TRANSACTIONS,
        },
        {
          label: 'Completed',
          icon: CheckCircle2,
          value: props.completedPurchases,
          subtitle: 'Lifetime',
          href: ROUTES.BUYER_TRANSACTIONS,
        },
        {
          label: 'Documents',
          icon: FileText,
          value: props.documentsUploaded,
          subtitle: 'Uploaded to your vault',
          href: ROUTES.BUYER_DOCUMENTS,
        },
      ]}
    />
  </div>
);
