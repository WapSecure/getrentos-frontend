'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/navigation/AdminNavbar';
import { AdminSidebar } from '@/components/admin/dashboard/AdminSidebar';
import { AdminDashboardHeader } from '@/components/admin/dashboard/AdminDashboardHeader';
import { AdminStatsCards } from '@/components/admin/dashboard/AdminStatsCards';
import { PlatformGrowthChart } from '@/components/admin/dashboard/PlatformGrowthChart';
import { AdminActivityFeed } from '@/components/admin/dashboard/AdminActivityFeed';
import { AdminQuickActions } from '@/components/admin/dashboard/AdminQuickActions';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const mockStats = {
  totalUsers: 1920,
  pendingVerifications: 7,
  openDisputes: 3,
  fraudAlerts: 2,
  activeEscrowTransactions: 14,
  platformGmv: 1_840_000_000,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();

      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser.role && parsedUser.role !== 'admin') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <AdminNavbar user={user} />

      <div className="flex">
        <AdminSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AdminDashboardHeader greeting={greeting} firstName={firstName} />

            <AdminStatsCards {...mockStats} />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PlatformGrowthChart />
                <AdminActivityFeed />
              </div>
              <div>
                <AdminQuickActions />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
