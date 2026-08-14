'use client';

import { useBuyerUser } from '../layout';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BuyerDashboardHeader } from '@/components/buyer/dashboard/BuyerDashboardHeader';
import { BuyerStatsCards } from '@/components/buyer/dashboard/BuyerStatsCards';
import { BuyerActivityFeed } from '@/components/buyer/dashboard/BuyerActivityFeed';
import { BuyerQuickActions } from '@/components/buyer/dashboard/BuyerQuickActions';
import { Button } from '@/components/ui/Button';
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
    (dashboard.savedListings > 0 || dashboard.activeOffers > 0 || dashboard.activeTransactions > 0);

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <BuyerDashboardHeader greeting={greeting} firstName={firstName} />

      {!isLoading && !hasActivity ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Start your property search</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Browse verified for-sale properties, save your favorites, and track offers all in one
            place.
          </p>
          <Button href={ROUTES.BUYER_DISCOVER} variant="primary" className="mt-6">
            Discover Properties
          </Button>
        </div>
      ) : (
        <>
          <BuyerStatsCards
            savedProperties={dashboard?.savedListings ?? 0}
            upcomingViewings={dashboard?.upcomingViewings ?? 0}
            activeOffers={dashboard?.activeOffers ?? 0}
            activeTransactions={dashboard?.activeTransactions ?? 0}
            documentsUploaded={0}
            completedPurchases={0}
          />

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
    </>
  );
}
