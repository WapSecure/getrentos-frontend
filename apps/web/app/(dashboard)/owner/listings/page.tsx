'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Megaphone } from 'lucide-react';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { SaleListingCard } from '@/components/owner/listings/SaleListingCard';
import { CreateSaleListingModal } from '@/components/owner/listings/CreateSaleListingModal';
import { ManageListingModal } from '@/components/owner/listings/ManageListingModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { OwnerProperty, SaleListing, SaleListingStatus } from '@/types/owner';

const mockOwnerProperties: OwnerProperty[] = [
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
];

const mockListings: SaleListing[] = [
  {
    id: 'listing_001',
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    listingTitle: 'Luxury 3-Bed Apartment with Ocean Views',
    propertyType: 'Apartment',
    askingPrice: 148_000_000,
    description: 'A stunning waterfront apartment with panoramic ocean views and premium finishes.',
    propertySize: 210,
    bedrooms: 3,
    bathrooms: 3,
    features: ['Swimming Pool', 'Gym', 'Parking', '24/7 Security', 'Waterfront View'],
    status: 'published',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'listing_002',
    propertyId: 'oprop_002',
    propertyName: 'Palm Court Villa',
    listingTitle: 'Spacious 4-Bed Duplex in Lekki',
    propertyType: 'Duplex',
    askingPrice: 95_000_000,
    description: 'Family-friendly duplex in a secure, gated Lekki estate.',
    propertySize: 320,
    bedrooms: 4,
    bathrooms: 4,
    features: ['Parking', '24/7 Security', 'Garden', 'Furnished'],
    status: 'paused',
    createdAt: '2026-05-12T00:00:00.000Z',
  },
];

type StatusFilter = 'all' | SaleListingStatus;

export default function OwnerListingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [listings, setListings] = useState<SaleListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageListing, setManageListing] = useState<SaleListing | null>(null);

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
      setProperties(mockOwnerProperties);
      setListings(mockListings);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleCreate = (data: Omit<SaleListing, 'id' | 'createdAt'>) => {
    const newListing: SaleListing = {
      ...data,
      id: `listing_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev]);
  };

  const handleChangeStatus = (listingId: string, status: SaleListingStatus) => {
    setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status } : l)));
  };

  const verifiedProperties = properties.filter((p) => p.verificationStatus === 'verified');

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <OwnerNavbar user={user} />

      <div className="flex">
        <OwnerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sale Listings</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {listings.length} listing{listings.length === 1 ? '' : 's'} across your portfolio
                </p>
              </div>
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                New Listing
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or property..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                />
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit overflow-x-auto">
                {filterOptions.map((option) => (
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
            </div>

            {filteredListings.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Megaphone className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {listings.length === 0
                    ? 'No sale listings yet'
                    : 'No listings match your filters'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {listings.length === 0
                    ? 'Create a sale listing for one of your verified properties to start reaching buyers.'
                    : 'Try adjusting your search or filter.'}
                </p>
                {listings.length === 0 && (
                  <Button
                    variant="primary"
                    className="mt-6"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create Your First Listing
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((listing, index) => (
                  <SaleListingCard
                    key={listing.id}
                    listing={listing}
                    delay={index * 0.05}
                    onClick={() => setManageListing(listing)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateSaleListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        verifiedProperties={verifiedProperties}
        onCreate={handleCreate}
      />

      <ManageListingModal
        listing={manageListing}
        onClose={() => setManageListing(null)}
        onChangeStatus={handleChangeStatus}
      />
    </div>
  );
}
