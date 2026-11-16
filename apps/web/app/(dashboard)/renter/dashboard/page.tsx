'use client';

import { RenterDashboardHeader } from '@/components/renter/dashboard/RenterDashboardHeader';
import { RenterStatsCards } from '@/components/renter/dashboard/RenterStatsCards';
import { RenterApplicationsList } from '@/components/renter/dashboard/RenterApplicationsList';
import { RenterTrustScoreCard } from '@/components/renter/dashboard/RenterTrustScoreCard';
import { RenterRecommendedProperties } from '@/components/renter/dashboard/RenterRecommendedProperties';
import { RenterUpcomingPayments } from '@/components/renter/dashboard/RenterUpcomingPayments';
import { RenterRecentActivity } from '@/components/renter/dashboard/RenterRecentActivity';
import { RenterLeaseRenewal } from '@/components/renter/dashboard/RenterLeaseRenewal';
import { RenterRoommates } from '@/components/renter/dashboard/RenterRoommates';
import { RenterReviews } from '@/components/renter/dashboard/RenterReviews';
import { AttentionFeed } from '@/components/shared/attention/AttentionFeed';
import { GetStartedCard } from '@/components/shared/dashboard/GetStartedCard';
import { Search, ShieldCheck } from '@sureground/icons';
import { ROUTES } from '@/lib/constants/auth';
import { useRenterUser } from '../layout';

export default function RenterDashboardPage() {
  const user = useRenterUser();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? '';
  const currentHour = new Date().getHours();
  let greeting: 'morning' | 'afternoon' | 'evening' = 'morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'afternoon';
  if (currentHour >= 18) greeting = 'evening';

  return (
    <div className="space-y-7">
      <RenterDashboardHeader greeting={greeting} firstName={firstName} />
      <GetStartedCard
        id="renter"
        description="Two things that make renting through Sureground quicker."
        steps={[
          {
            title: 'Find a home',
            body: 'Search verified homes and book a viewing with the landlord.',
            icon: Search,
            href: ROUTES.RENTER_DISCOVER,
          },
          {
            title: 'Verify your ID',
            body: 'Your ID is checked before you pay or sign. Doing it now saves time later.',
            icon: ShieldCheck,
            href: ROUTES.RENTER_VERIFICATION,
          },
        ]}
      />
      <AttentionFeed persona="renter" />

      <RenterStatsCards />

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="min-w-0 space-y-6 xl:col-span-8">
          <RenterApplicationsList />
          <RenterRecentActivity />
        </div>
        <aside className="space-y-6 xl:col-span-4" aria-label="Payments and profile">
          <RenterUpcomingPayments />
          <RenterTrustScoreCard />
        </aside>
      </div>

      <RenterRecommendedProperties />

      <div className="grid auto-rows-min items-start gap-6 lg:grid-cols-2">
        <RenterLeaseRenewal />
        <RenterRoommates />
        <RenterReviews />
      </div>
    </div>
  );
}
