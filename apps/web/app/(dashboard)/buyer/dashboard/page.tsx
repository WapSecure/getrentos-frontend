'use client';

import { useBuyerUser } from '../layout';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BuyerDashboardHeader } from '@/components/buyer/dashboard/BuyerDashboardHeader';
import { BuyerStatsCards } from '@/components/buyer/dashboard/BuyerStatsCards';
import { BuyerActivityFeed } from '@/components/buyer/dashboard/BuyerActivityFeed';
import { BuyerQuickActions } from '@/components/buyer/dashboard/BuyerQuickActions';
import { Button, EmptyState, ListSkeleton, StatGridSkeleton } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export default function BuyerDashboardPage() {
  const user = useBuyerUser();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: buyerKeys.dashboard,
    queryFn: () => unwrap(buyerService.getDashboard()),
  });

  const hasActivity =
    !isLoading &&
    dashboard != null &&
    (dashboard.savedListings > 0 ||
      dashboard.activeOffers > 0 ||
      dashboard.activeTransactions > 0 ||
      dashboard.upcomingViewings > 0 ||
      dashboard.documentsUploaded > 0 ||
      dashboard.completedPurchases > 0 ||
      dashboard.recentActivity.length > 0);

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <BuyerDashboardHeader greeting={greeting} firstName={firstName} />

      {isLoading ? (
        <div className="space-y-6">
          <StatGridSkeleton count={6} />
          <ListSkeleton rows={4} />
        </div>
      ) : !hasActivity ? (
        <EmptyState
          icon={Search}
          title="Start your property search"
          description="Browse verified for-sale properties, save your favorites, and track offers all in one place."
          action={
            <Button href={ROUTES.BUYER_DISCOVER} variant="primary">
              Discover Properties
            </Button>
          }
        />
      ) : (
        <>
          <BuyerStatsCards
            savedProperties={dashboard?.savedListings ?? 0}
            upcomingViewings={dashboard?.upcomingViewings ?? 0}
            activeOffers={dashboard?.activeOffers ?? 0}
            activeTransactions={dashboard?.activeTransactions ?? 0}
            documentsUploaded={dashboard?.documentsUploaded ?? 0}
            completedPurchases={dashboard?.completedPurchases ?? 0}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <BuyerActivityFeed activity={dashboard?.recentActivity ?? []} />
            </div>
            <div>
              <BuyerQuickActions />
            </div>
          </div>
        </>
      )}
    </>
  );
}
