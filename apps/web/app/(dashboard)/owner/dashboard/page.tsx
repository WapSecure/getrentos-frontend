'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { OwnerDashboardHeader } from '@/components/owner/dashboard/OwnerDashboardHeader';
import { OwnerStatsCards } from '@/components/owner/dashboard/OwnerStatsCards';
import { OwnerPortfolioChart } from '@/components/owner/dashboard/OwnerPortfolioChart';
import { OwnerActivityFeed } from '@/components/owner/dashboard/OwnerActivityFeed';
import { OwnerQuickActions } from '@/components/owner/dashboard/OwnerQuickActions';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { OwnerProperty } from '@/types/owner';

const mockProperties: OwnerProperty[] = [
  {
    id: 'oprop_001',
    name: 'Ocean View Towers',
    propertyType: 'Apartment',
    address: '3 Bar Beach Way',
    city: 'Victoria Island',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'verified',
    estimatedValue: 145_000_000,
    purchasePrice: 118_000_000,
    purchaseDate: '2022-03-10T00:00:00.000Z',
    hasActiveSaleListing: true,
    createdAt: '2022-03-10T00:00:00.000Z',
  },
  {
    id: 'oprop_002',
    name: 'Palm Court Villa',
    propertyType: 'Duplex',
    address: '18 Chevron Drive',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'verified',
    estimatedValue: 92_000_000,
    purchasePrice: 76_000_000,
    purchaseDate: '2021-09-01T00:00:00.000Z',
    hasActiveSaleListing: true,
    createdAt: '2021-09-01T00:00:00.000Z',
  },
  {
    id: 'oprop_003',
    name: 'Lekki Waterfront Duplex',
    propertyType: 'Duplex',
    address: '7 Freedom Way',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    ownerName: 'Adaeze Okafor',
    verificationStatus: 'pending_review',
    estimatedValue: 71_500_000,
    purchasePrice: 71_500_000,
    purchaseDate: '2025-06-15T00:00:00.000Z',
    hasActiveSaleListing: false,
    createdAt: '2025-06-15T00:00:00.000Z',
  },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);

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

        if (parsedUser.role && parsedUser.role !== 'owner') {
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

  const totalPortfolioValue = properties.reduce((sum, p) => sum + p.estimatedValue, 0);
  const activeSaleListings = properties.filter((p) => p.hasActiveSaleListing).length;
  const buyerInquiries = 5;
  const pendingOffers = 2;
  const completedSales = 3;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <OwnerNavbar user={user} />

      <div className="flex">
        <OwnerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <OwnerDashboardHeader greeting={greeting} firstName={firstName} />

            {properties.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No properties yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Add your first property to verify ownership, list it for sale, and track its
                  investment performance.
                </p>
                <Button href="/owner/properties" variant="primary" className="mt-6">
                  Add Your First Property
                </Button>
              </div>
            ) : (
              <>
                <OwnerStatsCards
                  totalProperties={properties.length}
                  activeSaleListings={activeSaleListings}
                  buyerInquiries={buyerInquiries}
                  pendingOffers={pendingOffers}
                  totalPortfolioValue={totalPortfolioValue}
                  completedSales={completedSales}
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
          </div>
        </main>
      </div>
    </div>
  );
}
