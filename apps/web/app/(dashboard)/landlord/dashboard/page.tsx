'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { LandlordDashboardHeader } from '@/components/landlord/dashboard/LandlordDashboardHeader';
import { LandlordStatsCards } from '@/components/landlord/dashboard/LandlordStatsCards';
import { LandlordRevenueChart } from '@/components/landlord/dashboard/LandlordRevenueChart';
import { LandlordActivityFeed } from '@/components/landlord/dashboard/LandlordActivityFeed';
import { LandlordQuickActions } from '@/components/landlord/dashboard/LandlordQuickActions';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
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
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();

      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }

      setProperties(mockProperties);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <LandlordDashboardHeader greeting={greeting} firstName={firstName} />

            {properties.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No properties yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Add your first property to start managing units, tenants, and rent collection in
                  one place.
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
          </div>
        </main>
      </div>
    </div>
  );
}
