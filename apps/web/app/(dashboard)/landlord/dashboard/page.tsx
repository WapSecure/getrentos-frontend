'use client';

import { useLandlordUser } from '../layout';
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { LandlordDashboardHeader } from '@/components/landlord/dashboard/LandlordDashboardHeader';
import { LandlordStatsCards } from '@/components/landlord/dashboard/LandlordStatsCards';
import { LandlordRevenueChart } from '@/components/landlord/dashboard/LandlordRevenueChart';
import { LandlordActivityFeed } from '@/components/landlord/dashboard/LandlordActivityFeed';
import { LandlordQuickActions } from '@/components/landlord/dashboard/LandlordQuickActions';
import { Button } from '@/components/ui/Button';
import type { Property } from '@/types/landlord';

const mockProperties: Property[] = [
  {
    id: 'prop_001',
    name: 'Sunrise Apartments',
    type: 'apartment',
    address: '14 Adeola Odeku Street',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '/images/properties/sunrise-apartments.jpg',
    verificationStatus: 'verified',
    totalUnits: 8,
    occupiedUnits: 6,
    monthlyRevenue: 2_850_000,
    createdAt: '2024-11-02T00:00:00.000Z',
  },
  {
    id: 'prop_002',
    name: 'Palm Court Residences',
    type: 'duplex',
    address: '22 Admiralty Way',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '/images/properties/palm-court.jpg',
    verificationStatus: 'verified',
    totalUnits: 4,
    occupiedUnits: 3,
    monthlyRevenue: 1_620_000,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'prop_003',
    name: 'Modern Downtown Loft',
    type: 'shared_apartment',
    address: '5 Ikeja GRA',
    city: 'Ikeja',
    state: 'Lagos',
    country: 'Nigeria',
    coverImage: '/images/properties/downtown-loft.jpg',
    verificationStatus: 'pending',
    totalUnits: 3,
    occupiedUnits: 1,
    monthlyRevenue: 450_000,
    createdAt: '2025-04-20T00:00:00.000Z',
  },
];

export default function LandlordDashboardPage() {
  const user = useLandlordUser();
  const [properties, setProperties] = useState<Property[]>(mockProperties);

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 18) greeting = 'Good afternoon';
  if (currentHour >= 18) greeting = 'Good evening';

  const totalUnits = properties.reduce((sum, p) => sum + p.totalUnits, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupiedUnits, 0);
  const vacantUnits = totalUnits - occupiedUnits;
  const monthlyRevenue = properties.reduce((sum, p) => sum + p.monthlyRevenue, 0);
  const outstandingPayments = 380_000;
  const activeMaintenanceRequests = 2;

  return (
    <>
      <LandlordDashboardHeader greeting={greeting} firstName={firstName} />

      {properties.length === 0 ? (
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
            totalProperties={properties.length}
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
