'use client';

import { useState } from 'react';
import { Plus, Search, Megaphone } from 'lucide-react';
import { RealtorListingCard } from '@/components/realtor/listings/RealtorListingCard';
import { CreateListingModal } from '@/components/realtor/listings/CreateListingModal';
import { Button } from '@/components/ui/Button';
import type { RealtorClient, RealtorListing, RealtorListingStatus } from '@/types/realtor';

const mockClients: RealtorClient[] = [
  {
    id: 'client_001',
    clientName: 'Adaeze Okafor',
    role: 'owner',
    email: 'adaeze@example.com',
    phone: '',
    status: 'active',
    propertiesRepresented: 3,
    joinedDate: '2025-11-10T00:00:00.000Z',
  },
  {
    id: 'client_002',
    clientName: 'Emeka Chukwu',
    role: 'landlord',
    email: 'emeka@example.com',
    phone: '',
    status: 'active',
    propertiesRepresented: 5,
    joinedDate: '2025-09-02T00:00:00.000Z',
  },
];

const mockListings: RealtorListing[] = [
  {
    id: 'listing_001',
    clientId: 'client_001',
    clientName: 'Adaeze Okafor',
    title: 'Luxury 3-Bed Apartment with Ocean Views',
    category: 'sale',
    propertyType: 'Apartment',
    price: 148_000_000,
    city: 'Victoria Island',
    state: 'Lagos',
    bedrooms: 3,
    bathrooms: 3,
    status: 'published',
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'listing_002',
    clientId: 'client_002',
    clientName: 'Emeka Chukwu',
    title: 'Modern 2-Bed Flat, Ikeja GRA',
    category: 'rental',
    propertyType: 'Apartment',
    price: 3_200_000,
    city: 'Ikeja',
    state: 'Lagos',
    bedrooms: 2,
    bathrooms: 2,
    status: 'published',
    createdAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 'listing_003',
    clientId: 'client_001',
    clientName: 'Adaeze Okafor',
    title: 'Spacious 4-Bed Duplex in Lekki',
    category: 'sale',
    propertyType: 'Duplex',
    price: 95_000_000,
    city: 'Lekki',
    state: 'Lagos',
    bedrooms: 4,
    bathrooms: 4,
    status: 'pending_approval',
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

type StatusFilter = 'all' | RealtorListingStatus;

export default function RealtorListingsPage() {
  const [clients, setClients] = useState<RealtorClient[]>(mockClients);
  const [listings, setListings] = useState<RealtorListing[]>(mockListings);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreate = (data: Omit<RealtorListing, 'id' | 'createdAt'>) => {
    const newListing: RealtorListing = {
      ...data,
      id: `listing_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev]);
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || l.status === filter;
    return matchesSearch && matchesFilter;
  });

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'published', label: 'Published' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
          <p className="text-muted-foreground mt-1">
            {listings.length} listing{listings.length === 1 ? '' : 's'} across your clients
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Listing
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or client..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                filter === option.value
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {listings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {listings.length === 0
              ? 'Add a listing on behalf of one of your clients to get started.'
              : 'Try adjusting your search or filter.'}
          </p>
          {listings.length === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              Add Your First Listing
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing, index) => (
            <RealtorListingCard key={listing.id} listing={listing} delay={index * 0.05} />
          ))}
        </div>
      )}

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clients={clients}
        onSubmit={handleCreate}
      />
    </>
  );
}
