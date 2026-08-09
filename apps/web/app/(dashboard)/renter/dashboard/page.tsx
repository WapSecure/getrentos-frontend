'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { RenterDashboardHeader } from '@/components/renter/dashboard/RenterDashboardHeader';
import { RenterStatsCards } from '@/components/renter/dashboard/RenterStatsCards';
import { RenterApplicationsList } from '@/components/renter/dashboard/RenterApplicationsList';
import { RenterTrustScoreCard } from '@/components/renter/dashboard/RenterTrustScoreCard';
import { RenterRecommendedProperties } from '@/components/renter/dashboard/RenterRecommendedProperties';
import { RenterUpcomingPayments } from '@/components/renter/dashboard/RenterUpcomingPayments';
import { RenterRecentActivity } from '@/components/renter/dashboard/RenterRecentActivity';
import { RenterHomeManagement } from '@/components/renter/dashboard/RenterHomeManagement';
import { RenterMoveInChecklist } from '@/components/renter/dashboard/RenterMoveInChecklist';
import { RenterLeaseRenewal } from '@/components/renter/dashboard/RenterLeaseRenewal';
import { RenterRoommates } from '@/components/renter/dashboard/RenterRoommates';
import { RenterReviews } from '@/components/renter/dashboard/RenterReviews';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

export default function RenterDashboardPage() {
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

        if (parsedUser.role && parsedUser.role !== 'renter') {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <div className="min-h-screen bg-background">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-10 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
              <RenterHomeManagement />
              <RenterMoveInChecklist />
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <RenterLeaseRenewal />
              <RenterRoommates />
            </div>

            <div className="mb-6">
              <RenterRecommendedProperties />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RenterUpcomingPayments />
              <RenterRecentActivity />
              <RenterReviews />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
