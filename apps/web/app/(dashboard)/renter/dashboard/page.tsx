'use client';

import { RenterDashboardHeader } from '@/components/renter/dashboard/RenterDashboardHeader';
import { RenterStatsCards } from '@/components/renter/dashboard/RenterStatsCards';
import { RenterApplicationsList } from '@/components/renter/dashboard/RenterApplicationsList';
import { RenterTrustScoreCard } from '@/components/renter/dashboard/RenterTrustScoreCard';
import { RenterRecommendedProperties } from '@/components/renter/dashboard/RenterRecommendedProperties';
import { RenterUpcomingPayments } from '@/components/renter/dashboard/RenterUpcomingPayments';
import { RenterRecentActivity } from '@/components/renter/dashboard/RenterRecentActivity';
import { RenterMoveInChecklist } from '@/components/renter/dashboard/RenterMoveInChecklist';
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
    <>
      <RenterDashboardHeader greeting={greeting} firstName={firstName} />

      <RenterStatsCards />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <RenterApplicationsList />
        </div>
        <div>
          <RenterTrustScoreCard />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <RenterLeaseRenewal />
        <RenterMoveInChecklist />
      </div>

      <div className="mb-6">
        <RenterRecommendedProperties />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <RenterUpcomingPayments />
        <RenterRoommates />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RenterRecentActivity />
        <RenterReviews />
      </div>
    </>
  );
}
