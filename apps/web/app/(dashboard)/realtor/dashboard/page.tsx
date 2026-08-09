'use client';

import { useRealtorUser } from '../layout';
import { RealtorDashboardHeader } from '@/components/realtor/dashboard/RealtorDashboardHeader';
import { RealtorStatsCards } from '@/components/realtor/dashboard/RealtorStatsCards';
import { RealtorCommissionChart } from '@/components/realtor/dashboard/RealtorCommissionChart';
import { RealtorActivityFeed } from '@/components/realtor/dashboard/RealtorActivityFeed';
import { RealtorQuickActions } from '@/components/realtor/dashboard/RealtorQuickActions';

const mockStats = {
  activeClients: 5,
  activeListings: 7,
  activeLeads: 9,
  upcomingViewings: 3,
  pendingOffers: 2,
  commissionYtd: 8_230_000,
};

export default function RealtorDashboardPage() {
  const user = useRealtorUser();

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <RealtorDashboardHeader greeting={greeting} firstName={firstName} />

      <RealtorStatsCards {...mockStats} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RealtorCommissionChart />
          <RealtorActivityFeed />
        </div>
        <div>
          <RealtorQuickActions />
        </div>
      </div>
    </>
  );
}
