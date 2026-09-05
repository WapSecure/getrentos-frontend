'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AdminDashboardHeader } from '@/components/admin/dashboard/AdminDashboardHeader';
import { AdminStatsCards } from '@/components/admin/dashboard/AdminStatsCards';
import { AdminActivityFeed } from '@/components/admin/dashboard/AdminActivityFeed';
import { AdminQuickActions } from '@/components/admin/dashboard/AdminQuickActions';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { PageErrorState } from '@getrentos/ui';
import { useAdminUser } from '../layout';

// recharts is heavy — load it only when this dashboard mounts.
const PlatformGrowthChart = dynamic(
  () =>
    import('@/components/admin/dashboard/PlatformGrowthChart').then((m) => m.PlatformGrowthChart),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-secondary/50" />,
  }
);

export default function AdminDashboardPage() {
  const user = useAdminUser();
  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const statsQuery = useQuery({
    queryKey: adminKeys.dashboardStats,
    queryFn: () => unwrap(adminService.getDashboardStats()),
  });

  return (
    <>
      <AdminDashboardHeader greeting={greeting} firstName={firstName} />

      {statsQuery.isLoading ? (
        <div
          className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-3 xl:grid-cols-6"
          aria-label="Loading platform statistics"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-secondary/50" />
          ))}
        </div>
      ) : statsQuery.isError || !statsQuery.data ? (
        <PageErrorState
          title="Platform statistics unavailable"
          description="The latest totals could not be loaded. Other dashboard sections may still be available."
          onRetry={() => statsQuery.refetch()}
          isRetrying={statsQuery.isFetching}
          className="mb-8 min-h-52"
        />
      ) : (
        <AdminStatsCards {...statsQuery.data} />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PlatformGrowthChart />
          <AdminActivityFeed />
        </div>
        <div>
          <AdminQuickActions />
        </div>
      </div>
    </>
  );
}
