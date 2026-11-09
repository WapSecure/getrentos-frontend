'use client';

import dynamic from 'next/dynamic';
import { useRealtorUser } from '../layout';
import { RealtorDashboardHeader } from '@/components/realtor/dashboard/RealtorDashboardHeader';
import { RealtorStatsCards } from '@/components/realtor/dashboard/RealtorStatsCards';
import { RealtorActivityFeed } from '@/components/realtor/dashboard/RealtorActivityFeed';
import { RealtorQuickActions } from '@/components/realtor/dashboard/RealtorQuickActions';
import { useQuery } from '@tanstack/react-query';
import { PageErrorState, Skeleton, StatGroupSkeleton } from '@sureground/ui';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';
import { unwrap } from '@/lib/apiHelpers';
import { usePlanTier } from '@/hooks/usePlanTier';
import { AttentionFeed } from '@/components/shared/attention/AttentionFeed';
import { IdentityNudge } from '@/components/shared/verification/IdentityNudge';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { ROUTES } from '@/lib/constants/auth';

const RealtorCommissionChart = dynamic(
  () =>
    import('@/components/realtor/dashboard/RealtorCommissionChart').then(
      (m) => m.RealtorCommissionChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  }
);

export default function RealtorDashboardPage() {
  const user = useRealtorUser();
  const { isPro } = usePlanTier();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: realtorKeys.dashboard,
    queryFn: () => unwrap(realtorService.getDashboard()),
  });
  // Commissions are PRO-only server-side; a Free realtor's fetch would 403.
  const { data: commissionSummary } = useQuery({
    queryKey: realtorKeys.commissions,
    queryFn: () => unwrap(realtorService.getCommissionsSummary()),
    enabled: isPro,
  });

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  return (
    <>
      <RealtorDashboardHeader greeting={greeting} firstName={firstName} />
      <IdentityNudge
        verificationHref={ROUTES.REALTOR_VERIFICATION}
        unlocks="list for clients and receive commissions"
        className="mb-6"
      />
      <IdentityNudge
        requirement="licence"
        verificationHref={ROUTES.REALTOR_VERIFICATION}
        unlocks="list and take on clients"
        className="mb-6"
      />
      <AttentionFeed persona="realtor" />

      {statsLoading ? (
        <StatGroupSkeleton groups={[3, 3]} className="mb-8" />
      ) : statsError && !stats ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your numbers"
          onRetry={() => void refetchStats()}
        />
      ) : (
        <RealtorStatsCards
          activeClients={stats?.activeClients ?? 0}
          activeListings={stats?.publishedListings ?? 0}
          activeLeads={stats?.activeLeads ?? 0}
          upcomingViewings={stats?.upcomingViewings ?? 0}
          pendingOffers={stats?.offerCount ?? 0}
          commissionYtd={isPro ? (commissionSummary?.totalEarned ?? 0) : null}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <ProFeatureGate
            title="Commission analytics is a Pro feature"
            description="Upgrade to Pro to track what you've earned from closed deals and see your monthly commission trend."
            upgradeHref="/realtor/billing"
          >
            <RealtorCommissionChart />
          </ProFeatureGate>
          <RealtorActivityFeed />
        </div>
        <aside className="xl:col-span-4" aria-label="Quick actions">
          <RealtorQuickActions />
        </aside>
      </div>
    </>
  );
}
