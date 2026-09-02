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
    <div className="space-y-6">
      <RenterDashboardHeader greeting={greeting} firstName={firstName} />

      <RenterStatsCards />

      {/* Primary row: applications get the width, trust score rides alongside
          and drops beneath on narrower screens. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RenterApplicationsList />
        </div>
        <RenterTrustScoreCard />
      </div>

      {/* Full-width when it renders; collapses cleanly when it doesn't. */}
      <RenterRecommendedProperties />

      {/* Secondary widgets share one flowing grid. Several of these hide
          themselves when the renter has nothing to show (no lease, no
          roommates, etc.); as direct grid children they simply drop out and
          the remaining cards reflow — no stranded half-width cards, even gaps. */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-min items-start">
        <RenterUpcomingPayments />
        <RenterLeaseRenewal />
        <RenterMoveInChecklist />
        <RenterRoommates />
        <RenterRecentActivity />
        <RenterReviews />
      </div>
    </div>
  );
}
