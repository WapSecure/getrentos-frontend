'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Megaphone } from 'lucide-react';
import { RealtorListingCard } from '@/components/realtor/listings/RealtorListingCard';
import { RealtorListingPreviewModal } from '@/components/realtor/listings/RealtorListingPreviewModal';
import { CreateListingModal } from '@/components/realtor/listings/CreateListingModal';
import { Button } from '@getrentos/ui';
import type { RealtorClient, RealtorListing, RealtorListingStatus } from '@/types/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import {
  mapRealtorClient,
  mapRealtorListing,
  realtorService,
  type RealtorClientApi,
} from '@/services/realtorService';
import type {
  CreateRealtorListingInput,
  RealtorClientProperty,
} from '@/components/realtor/listings/CreateListingModal';

type StatusFilter = 'all' | RealtorListingStatus;

export default function RealtorListingsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<RealtorListing | null>(null);
  const queryClient = useQueryClient();
  const { data: listings = [], isLoading } = useQuery({
    queryKey: realtorKeys.listings,
    queryFn: async () => (await unwrap(realtorService.listListings())).map(mapRealtorListing),
  });
  const { data: clientRelationships = [] } = useQuery({
    queryKey: realtorKeys.clients,
    queryFn: () => unwrap(realtorService.listClients()),
  });
  const clients = clientRelationships.map(mapRealtorClient);
  const clientProperties: RealtorClientProperty[] = clientRelationships.flatMap(
    (client: RealtorClientApi) =>
      client.status === 'ACTIVE'
        ? client.properties.map(({ property }) => ({
            id: property.id,
            clientId: client.id,
            title: property.title,
          }))
        : []
  );
  const createListing = useMutation({
    mutationFn: (listing: CreateRealtorListingInput) =>
      unwrap(
        realtorService.createListing({
          propertyId: listing.propertyId,
          listingTitle: listing.title,
          listingType: listing.category === 'sale' ? 'SALE' : 'RENT',
          price: listing.price,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.listings });
      setIsCreateModalOpen(false);
    },
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleCreate = (data: CreateRealtorListingInput) => createListing.mutate(data);

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
          <LegacyInput
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

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center text-sm text-muted-foreground">
          Loading listings…
        </div>
      ) : filteredListings.length === 0 ? (
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
            <RealtorListingCard
              key={listing.id}
              listing={listing}
              delay={index * 0.05}
              onClick={() => setPreviewListing(listing)}
            />
          ))}
        </div>
      )}

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        clients={clients}
        properties={clientProperties}
        onSubmit={handleCreate}
      />

      <RealtorListingPreviewModal
        listing={previewListing}
        onClose={() => setPreviewListing(null)}
      />
    </>
  );
}
