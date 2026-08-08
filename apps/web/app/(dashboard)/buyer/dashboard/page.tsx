'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { BuyerDashboardHeader } from '@/components/buyer/dashboard/BuyerDashboardHeader';
import { BuyerStatsCards } from '@/components/buyer/dashboard/BuyerStatsCards';
import { BuyerActivityFeed } from '@/components/buyer/dashboard/BuyerActivityFeed';
import { BuyerQuickActions } from '@/components/buyer/dashboard/BuyerQuickActions';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

const mockStats = {
  savedProperties: 4,
  upcomingViewings: 2,
  activeOffers: 1,
  activeTransactions: 1,
  documentsUploaded: 3,
  completedPurchases: 0,
};

export default function BuyerDashboardPage() {
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

        if (parsedUser.role && parsedUser.role !== 'buyer') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const hasActivity =
    mockStats.savedProperties > 0 || mockStats.activeOffers > 0 || mockStats.activeTransactions > 0;

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
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <BuyerDashboardHeader greeting={greeting} firstName={firstName} />

            {!hasActivity ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Start your property search
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Browse verified for-sale properties, save your favorites, and track offers all in
                  one place.
                </p>
                <Button href="/buyer/discover" variant="primary" className="mt-6">
                  Discover Properties
                </Button>
              </div>
            ) : (
              <>
                <BuyerStatsCards {...mockStats} />

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <BuyerActivityFeed />
                  </div>
                  <div>
                    <BuyerQuickActions />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
