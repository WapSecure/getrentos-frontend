'use client';

import dynamic from 'next/dynamic';
import { useLandlordUser } from '../layout';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { LandlordDashboardHeader } from '@/components/landlord/dashboard/LandlordDashboardHeader';
import { LandlordStatsCards } from '@/components/landlord/dashboard/LandlordStatsCards';
import { LandlordActivityFeed } from '@/components/landlord/dashboard/LandlordActivityFeed';
import { LandlordQuickActions } from '@/components/landlord/dashboard/LandlordQuickActions';
import {
  Button,
  CardSkeleton,
  EmptyState,
  PageErrorState,
  Skeleton,
  StatGridSkeleton,
} from '@getrentos/ui';
import { landlordService, type LandlordDashboardStats } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

// recharts is heavy (~400 KB): load it only when this dashboard mounts.
const LandlordRevenueChart = dynamic(
  () =>
    import('@/components/landlord/dashboard/LandlordRevenueChart').then(
      (m) => m.LandlordRevenueChart
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-xl" />,
  }
);

const EMPTY_STATS: LandlordDashboardStats = {
  totalProperties: 0,
  occupiedUnits: 0,
  reservedUnits: 0,
  vacantUnits: 0,
  annualRentRoll: 0,
  outstandingPayments: 0,
  outstandingAmount: 0,
  activeMaintenanceRequests: 0,
};

export default function LandlordDashboardPage() {
  const user = useLandlordUser();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: landlordKeys.dashboardStats,
    queryFn: () => unwrap(landlordService.getDashboardStats()),
  });
  const stats = data ?? EMPTY_STATS;

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const {
    totalProperties,
    occupiedUnits,
    reservedUnits,
    vacantUnits,
    annualRentRoll,
    outstandingPayments,
    outstandingAmount,
    activeMaintenanceRequests,
  } = stats;

  return (
    <>
      <LandlordDashboardHeader greeting={greeting} firstName={firstName} />

      {/* Defaulting the stats to zeros made this render "Add your first
          property" while the request was still in flight, so an established
          landlord was told their portfolio was empty on every load. */}
      {isLoading ? (
        <div className="space-y-6">
          <StatGridSkeleton count={4} />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <CardSkeleton lines={4} />
          </div>
        </div>
      ) : isError && !data ? (
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
          description="Add your first property to start managing units, tenants, and rent collection in one place."
          action={
            <Button href={ROUTES.LANDLORD_PROPERTIES} variant="primary">
              Add Your First Property
            </Button>
          }
        />
      ) : (
        <>
          <LandlordStatsCards
            totalProperties={totalProperties}
            occupiedUnits={occupiedUnits}
            reservedUnits={reservedUnits}
            vacantUnits={vacantUnits}
            annualRentRoll={annualRentRoll}
            outstandingPayments={outstandingPayments}
            outstandingAmount={outstandingAmount}
            activeMaintenanceRequests={activeMaintenanceRequests}
          />

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <LandlordRevenueChart />
              <LandlordActivityFeed />
            </div>
            <div>
              <LandlordQuickActions />
            </div>
          </div>
        </>
      )}
    </>
  );
}
