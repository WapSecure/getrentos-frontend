'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Megaphone } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { ListingCard } from '@/components/landlord/listings/ListingCard';
import { CreateListingModal } from '@/components/landlord/listings/CreateListingModal';
import { ListingPreviewModal } from '@/components/landlord/listings/ListingPreviewModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { Listing, ListingStatus, Unit } from '@/types/landlord';

const mockVacantUnits: Unit[] = [
  {
    id: 'unit_004',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 4A',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 320_000,
    occupancyStatus: 'vacant',
  },
  {
    id: 'unit_007',
    propertyId: 'prop_002',
    propertyName: 'Palm Court Residences',
    unitName: 'Unit 2A',
    bedrooms: 2,
    bathrooms: 2,
    monthlyRent: 460_000,
    occupancyStatus: 'vacant',
  },
  {
    id: 'unit_009',
    propertyId: 'prop_003',
    propertyName: 'Modern Downtown Loft',
    unitName: 'Unit B',
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 450_000,
    occupancyStatus: 'vacant',
  },
];

const mockListings: Listing[] = [
  {
    id: 'listing_001',
    unitId: 'unit_004',
    propertyId: 'prop_001',
    propertyName: 'Sunrise Apartments',
    unitName: 'Unit 4A',
    listingTitle: 'Bright 1-Bed Apartment in Victoria Island',
    monthlyRent: 320_000,
    securityDeposit: 320_000,
    amenities: ['Parking', 'Security', '24/7 Power'],
    availabilityDate: '2026-09-01',
    allowPets: false,
    furnished: true,
    shortLetEnabled: false,
    status: 'published',
    createdAt: '2026-07-20T00:00:00.000Z',
  },
];

const statusFilters: { value: 'all' | ListingStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
];

export default function LandlordListingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [vacantUnits, setVacantUnits] = useState<Unit[]>([]);
  const [filter, setFilter] = useState<'all' | ListingStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

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
      setListings(mockListings);
      setVacantUnits(mockVacantUnits.filter((u) => !mockListings.some((l) => l.unitId === u.id)));
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handlePublish = (data: Omit<Listing, 'id' | 'status' | 'createdAt'>) => {
    const newListing: Listing = {
      ...data,
      id: `listing_${Date.now()}`,
      status: 'published',
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev]);
    setVacantUnits((prev) => prev.filter((u) => u.id !== data.unitId));
  };

  const handleTogglePause = (id: string) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: l.status === 'paused' ? 'published' : 'paused' } : l
      )
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredListings = listings.filter((l) => filter === 'all' || l.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Listings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {listings.filter((l) => l.status === 'published').length} active listing
                  {listings.filter((l) => l.status === 'published').length === 1 ? '' : 's'} •{' '}
                  {vacantUnits.length} vacant unit{vacantUnits.length === 1 ? '' : 's'} unlisted
                </p>
              </div>
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Publish Listing
              </Button>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit mb-6">
              {statusFilters.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    filter === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {filteredListings.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No listings found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Publish a vacant unit to start receiving rental applications.
                </p>
                <Button
                  variant="primary"
                  className="mt-6"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Publish Listing
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    delay={index * 0.05}
                    onTogglePause={handleTogglePause}
                    onPreview={setPreviewListing}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        vacantUnits={vacantUnits}
        onPublish={handlePublish}
      />

      <ListingPreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} />
    </div>
  );
}
