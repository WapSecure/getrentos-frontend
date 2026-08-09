'use client';

import { useEffect, useState } from 'react';
import { AdminDashboardHeader } from '@/components/admin/dashboard/AdminDashboardHeader';
import { AdminStatsCards } from '@/components/admin/dashboard/AdminStatsCards';
import { PlatformGrowthChart } from '@/components/admin/dashboard/PlatformGrowthChart';
import { AdminActivityFeed } from '@/components/admin/dashboard/AdminActivityFeed';
import { AdminQuickActions } from '@/components/admin/dashboard/AdminQuickActions';
import { adminService, type DashboardStats } from '@/services/adminService';
import { useAdminUser } from '../layout';

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

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  useEffect(() => {
    adminService.getDashboardStats().then((response) => {
      if (response.success && response.data) {
        setStats(response.data);
      }
    });
  }, []);

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
