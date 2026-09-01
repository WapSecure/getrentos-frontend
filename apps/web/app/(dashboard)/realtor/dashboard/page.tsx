'use client';

import dynamic from 'next/dynamic';
import { useRealtorUser } from '../layout';
import { RealtorDashboardHeader } from '@/components/realtor/dashboard/RealtorDashboardHeader';
import { RealtorStatsCards } from '@/components/realtor/dashboard/RealtorStatsCards';
import { RealtorActivityFeed } from '@/components/realtor/dashboard/RealtorActivityFeed';
import { RealtorQuickActions } from '@/components/realtor/dashboard/RealtorQuickActions';
import { useQuery } from '@tanstack/react-query';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';

// recharts is heavy — load it only when this dashboard mounts.
const RealtorCommissionChart = dynamic(
  () =>
    import('@/components/realtor/dashboard/RealtorCommissionChart').then(
      (m) => m.RealtorCommissionChart
    ),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-secondary/50" />,
  }
);

export default function RealtorDashboardPage() {
  const user = useRealtorUser();
  const { data: stats } = useQuery({
    queryKey: realtorKeys.dashboard,
    queryFn: () => unwrap(realtorService.getDashboard()),
  });
  const { data: commissionSummary } = useQuery({
    queryKey: realtorKeys.commissions,
    queryFn: () => unwrap(realtorService.getCommissionsSummary()),
  });

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <RealtorDashboardHeader greeting={greeting} firstName={firstName} />

      <RealtorStatsCards
        activeClients={stats?.activeClients ?? 0}
        activeListings={stats?.publishedListings ?? 0}
        activeLeads={stats?.activeLeads ?? 0}
        upcomingViewings={stats?.upcomingViewings ?? 0}
        pendingOffers={stats?.offerCount ?? 0}
        commissionYtd={commissionSummary?.totalEarned ?? 0}
      />

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
