'use client';

import { useBuyerUser } from '../layout';
import { Search } from 'lucide-react';
import { BuyerDashboardHeader } from '@/components/buyer/dashboard/BuyerDashboardHeader';
import { BuyerStatsCards } from '@/components/buyer/dashboard/BuyerStatsCards';
import { BuyerActivityFeed } from '@/components/buyer/dashboard/BuyerActivityFeed';
import { BuyerQuickActions } from '@/components/buyer/dashboard/BuyerQuickActions';
import { Button } from '@/components/ui/Button';

const mockStats = {
  savedProperties: 4,
  upcomingViewings: 2,
  activeOffers: 1,
  activeTransactions: 1,
  documentsUploaded: 3,
  completedPurchases: 0,
};

export default function BuyerDashboardPage() {
  const user = useBuyerUser();

  const hasActivity =
    mockStats.savedProperties > 0 || mockStats.activeOffers > 0 || mockStats.activeTransactions > 0;

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <BuyerDashboardHeader greeting={greeting} firstName={firstName} />

      {!hasActivity ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Start your property search</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Browse verified for-sale properties, save your favorites, and track offers all in one
            place.
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
    </>
  );
}
