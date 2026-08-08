'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RealtorNavbar } from '@/components/realtor/navigation/RealtorNavbar';
import { RealtorSidebar } from '@/components/realtor/dashboard/RealtorSidebar';
import { RealtorDashboardHeader } from '@/components/realtor/dashboard/RealtorDashboardHeader';
import { RealtorStatsCards } from '@/components/realtor/dashboard/RealtorStatsCards';
import { RealtorCommissionChart } from '@/components/realtor/dashboard/RealtorCommissionChart';
import { RealtorActivityFeed } from '@/components/realtor/dashboard/RealtorActivityFeed';
import { RealtorQuickActions } from '@/components/realtor/dashboard/RealtorQuickActions';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const mockStats = {
  activeClients: 5,
  activeListings: 7,
  activeLeads: 9,
  upcomingViewings: 3,
  pendingOffers: 2,
  commissionYtd: 8_230_000,
};

export default function RealtorDashboardPage() {
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

        if (parsedUser.role && parsedUser.role !== 'realtor') {
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
      <RealtorNavbar user={user} />

      <div className="flex">
        <RealtorSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </main>
      </div>
    </div>
  );
}
