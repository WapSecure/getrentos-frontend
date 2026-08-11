'use client';

import { useLandlordUser } from '../layout';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { LandlordDashboardHeader } from '@/components/landlord/dashboard/LandlordDashboardHeader';
import { LandlordStatsCards } from '@/components/landlord/dashboard/LandlordStatsCards';
import { LandlordRevenueChart } from '@/components/landlord/dashboard/LandlordRevenueChart';
import { LandlordActivityFeed } from '@/components/landlord/dashboard/LandlordActivityFeed';
import { LandlordQuickActions } from '@/components/landlord/dashboard/LandlordQuickActions';
import { Button } from '@/components/ui/Button';
import { landlordService, type LandlordDashboardStats } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const EMPTY_STATS: LandlordDashboardStats = {
  totalProperties: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  monthlyRevenue: 0,
  outstandingPayments: 0,
  activeMaintenanceRequests: 0,
};

export default function LandlordDashboardPage() {
  const user = useLandlordUser();
  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: landlordKeys.dashboardStats,
    queryFn: () => unwrap(landlordService.getDashboardStats()),
  });

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const {
    totalProperties,
    occupiedUnits,
    vacantUnits,
    monthlyRevenue,
    outstandingPayments,
    activeMaintenanceRequests,
  } = stats;

  return (
    <>
      <LandlordDashboardHeader greeting={greeting} firstName={firstName} />

      {totalProperties === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No properties yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Add your first property to start managing units, tenants, and rent collection in one
            place.
          </p>
          <Button href="/landlord/properties" variant="primary" className="mt-6">
            Add Your First Property
          </Button>
        </div>
      ) : (
        <>
          <LandlordStatsCards
            totalProperties={totalProperties}
            occupiedUnits={occupiedUnits}
            vacantUnits={vacantUnits}
            monthlyRevenue={monthlyRevenue}
            outstandingPayments={outstandingPayments}
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
