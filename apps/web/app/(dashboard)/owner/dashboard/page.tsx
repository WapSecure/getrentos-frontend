'use client';

import { useOwnerUser } from '../layout';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { OwnerDashboardHeader } from '@/components/owner/dashboard/OwnerDashboardHeader';
import { OwnerStatsCards } from '@/components/owner/dashboard/OwnerStatsCards';
import { OwnerPortfolioChart } from '@/components/owner/dashboard/OwnerPortfolioChart';
import { OwnerActivityFeed } from '@/components/owner/dashboard/OwnerActivityFeed';
import { OwnerQuickActions } from '@/components/owner/dashboard/OwnerQuickActions';
import { Button } from '@/components/ui/Button';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export default function OwnerDashboardPage() {
  const user = useOwnerUser();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ownerKeys.dashboard,
    queryFn: () => unwrap(ownerService.getDashboard()),
  });

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const totalProperties = dashboard?.totalProperties ?? 0;

  return (
    <>
      <OwnerDashboardHeader greeting={greeting} firstName={firstName} />

      {!isLoading && totalProperties === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No properties yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add your first property to verify ownership, list it for sale, and track its investment
            performance.
          </p>
          <Button href={ROUTES.OWNER_PROPERTIES} variant="primary" className="mt-6">
            Add Your First Property
          </Button>
        </div>
      ) : (
        <>
          <OwnerStatsCards
            totalProperties={dashboard?.totalProperties ?? 0}
            activeSaleListings={dashboard?.activeListings ?? 0}
            buyerInquiries={
              dashboard?.recentActivity.filter((a) => a.type === 'offer' || a.type === 'viewing')
                .length ?? 0
            }
            pendingOffers={dashboard?.pendingOffers ?? 0}
            totalPortfolioValue={dashboard?.portfolioValue ?? 0}
            completedSales={0}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OwnerPortfolioChart />
              <OwnerActivityFeed />
            </div>
            <div>
              <OwnerQuickActions />
            </div>
          </div>
        </>
      )}
    </>
  );
}
