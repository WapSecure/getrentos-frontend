'use client';

import {
  CalendarClock,
  Coins,
  Handshake,
  Lock,
  Megaphone,
  UserPlus,
  Users,
} from '@sureground/icons';
import { StatGroup } from '@sureground/ui';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';

interface RealtorStatsCardsProps {
  activeClients: number;
  activeListings: number;
  activeLeads: number;
  upcomingViewings: number;
  pendingOffers: number;
  /** null when the realtor isn't on Pro: commissions are a Pro feature. */
  commissionYtd: number | null;
}

export const RealtorStatsCards = ({
  activeClients,
  activeListings,
  activeLeads,
  upcomingViewings,
  pendingOffers,
  commissionYtd,
}: RealtorStatsCardsProps) => (
  <div className="mb-8 space-y-4">
    <StatGroup
      title="Business"
      items={[
        {
          label: 'Commission YTD',
          icon: Coins,
          value:
            commissionYtd === null ? (
              <span className="inline-flex items-center text-muted-foreground">
                <Lock className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Locked on Free</span>
              </span>
            ) : (
              formatCurrency(commissionYtd, { compact: true })
            ),
          subtitle: commissionYtd === null ? 'Upgrade to Pro to see it' : 'Year to date',
          href: commissionYtd === null ? ROUTES.REALTOR_BILLING : ROUTES.REALTOR_COMMISSIONS,
        },
        {
          label: 'Active clients',
          icon: Users,
          value: activeClients,
          subtitle: 'Owners & landlords',
          href: ROUTES.REALTOR_CLIENTS,
        },
        {
          label: 'Active listings',
          icon: Megaphone,
          value: activeListings,
          subtitle: 'Published on your behalf',
          href: ROUTES.REALTOR_LISTINGS,
        },
      ]}
    />
    <StatGroup
      title="Pipeline"
      items={[
        {
          label: 'Active leads',
          icon: UserPlus,
          value: activeLeads,
          subtitle: 'In your pipeline',
          href: ROUTES.REALTOR_LEADS,
        },
        {
          label: 'Upcoming viewings',
          icon: CalendarClock,
          value: upcomingViewings,
          subtitle: 'Scheduled tours',
          href: ROUTES.REALTOR_VIEWINGS,
        },
        {
          label: 'Pending offers',
          icon: Handshake,
          value: pendingOffers,
          subtitle: 'Awaiting response',
          href: ROUTES.REALTOR_OFFERS,
        },
      ]}
    />
  </div>
);
