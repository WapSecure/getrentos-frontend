'use client';

import dynamic from 'next/dynamic';
import { useOwnerUser } from '../layout';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { OwnerDashboardHeader } from '@/components/owner/dashboard/OwnerDashboardHeader';
import { OwnerStatsCards } from '@/components/owner/dashboard/OwnerStatsCards';
import { OwnerActivityFeed } from '@/components/owner/dashboard/OwnerActivityFeed';
import { OwnerQuickActions } from '@/components/owner/dashboard/OwnerQuickActions';
import {
  Button,
  EmptyState,
  CardSkeleton,
  PageErrorState,
  Skeleton,
  StatGridSkeleton,
} from '@getrentos/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

// recharts is heavy: load it only when this dashboard mounts.
const OwnerPortfolioChart = dynamic(
  () =>
    import('@/components/owner/dashboard/OwnerPortfolioChart').then((m) => m.OwnerPortfolioChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  }
);

export default function OwnerDashboardPage() {
  const user = useOwnerUser();

  const { data: dashboard, isLoading, isError, refetch, isFetching } = useQuery({
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

      {isLoading ? (
        <div className="space-y-6">
          <StatGridSkeleton count={6} className="lg:grid-cols-3 xl:grid-cols-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <CardSkeleton lines={4} />
          </div>
        </div>
      ) : isError && !dashboard ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your dashboard"
          onRetry={() => void refetch()}
          isRetrying={isFetching}
        />
      ) : totalProperties === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to verify ownership, list it for sale, and track its investment performance."
          action={
            <Button href={ROUTES.OWNER_PROPERTIES} variant="primary">
              Add Your First Property
            </Button>
          }
        />
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
            completedSales={dashboard?.completedSales ?? 0}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OwnerPortfolioChart />
              <OwnerActivityFeed activity={dashboard?.recentActivity ?? []} />
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
