'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AdminDashboardHeader } from '@/components/admin/dashboard/AdminDashboardHeader';
import { AdminStatsCards } from '@/components/admin/dashboard/AdminStatsCards';
import { AdminActivityFeed } from '@/components/admin/dashboard/AdminActivityFeed';
import { AdminQuickActions } from '@/components/admin/dashboard/AdminQuickActions';
import { adminService, type DashboardStats } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
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

const EMPTY_STATS: DashboardStats = {
  totalUsers: 0,
  pendingVerifications: 0,
  openDisputes: 0,
  fraudAlerts: 0,
  activeEscrowTransactions: 0,
  platformGmv: 0,
};

export default function AdminDashboardPage() {
  const user = useAdminUser();
  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: adminKeys.dashboardStats,
    queryFn: () => unwrap(adminService.getDashboardStats()),
  });

  return (
    <>
      <AdminDashboardHeader greeting={greeting} firstName={firstName} />

      <AdminStatsCards {...stats} />

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
