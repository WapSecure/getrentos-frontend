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
import { useRenterUser } from '../layout';

export default function RenterDashboardPage() {
  const user = useRenterUser();
  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting: 'morning' | 'afternoon' | 'evening' = 'morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'afternoon';
  if (currentHour >= 18) greeting = 'evening';

  return (
    <div className="space-y-7">
      <RenterDashboardHeader greeting={greeting} firstName={firstName} />

      <RenterStatsCards />

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <RenterApplicationsList />
          <RenterRecentActivity />
        </div>
        <div className="xl:col-span-4">
          <RenterTrustScoreCard />
        </div>
      </div>

      <RenterRecommendedProperties />

      <div className="grid auto-rows-min items-start gap-6 lg:grid-cols-2">
        <RenterUpcomingPayments />
        <RenterLeaseRenewal />
        <RenterRoommates />
        <RenterReviews />
      </div>
    </div>
  );
}
