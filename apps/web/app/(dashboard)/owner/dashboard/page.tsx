'use client';

import dynamic from 'next/dynamic';
import { useOwnerUser } from '../layout';
import { Building2 } from '@sureground/icons';
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
  StatGroupSkeleton,
} from '@sureground/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { AttentionFeed } from '@/components/shared/attention/AttentionFeed';
import { IdentityNudge } from '@/components/shared/verification/IdentityNudge';
import { ROUTES } from '@/lib/constants/auth';

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

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
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
      <IdentityNudge
        verificationHref={ROUTES.OWNER_VERIFICATION}
        unlocks="publish sale listings and accept offers"
        className="mb-6"
      />
      <AttentionFeed persona="owner" />

      {isLoading ? (
        <div className="space-y-6">
          <StatGroupSkeleton groups={[3, 3]} />
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
              Add your first property
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

          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <OwnerPortfolioChart />
              <OwnerActivityFeed activity={dashboard?.recentActivity ?? []} />
            </div>
            <aside className="xl:col-span-4" aria-label="Quick actions">
              <OwnerQuickActions />
            </aside>
          </div>
        </>
      )}
    </>
  );
}
