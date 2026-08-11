'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { ListingCard } from '@/components/landlord/listings/ListingCard';
import { CreateListingModal } from '@/components/landlord/listings/CreateListingModal';
import { ListingPreviewModal } from '@/components/landlord/listings/ListingPreviewModal';
import { Button } from '@/components/ui/Button';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { Listing, ListingStatus } from '@/types/landlord';

const statusFilters: { value: 'all' | ListingStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
];

export default function LandlordListingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | ListingStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  const { data: listings = [] } = useQuery({
    queryKey: landlordKeys.listings(),
    queryFn: () => unwrap(landlordService.listListings()),
  });

  const { data: vacantUnits = [] } = useQuery({
    queryKey: landlordKeys.vacantUnits,
    queryFn: () => unwrap(landlordService.listVacantUnits()),
  });

  const publishMutation = useMutation({
    mutationFn: (data: Omit<Listing, 'id' | 'status' | 'createdAt'>) => {
      const {
        unitId,
        listingTitle,
        monthlyRent,
        rentPeriod,
        allowsMonthlyPayment,
        securityDeposit,
        amenities,
        availabilityDate,
        allowPets,
        furnished,
        shortLetEnabled,
      } = data;
      return unwrap(
        landlordService.publishListing({
          unitId,
          listingTitle,
          monthlyRent,
          rentPeriod,
          allowsMonthlyPayment,
          securityDeposit,
          amenities,
          availabilityDate,
          allowPets,
          furnished,
          shortLetEnabled,
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      queryClient.invalidateQueries({ queryKey: landlordKeys.vacantUnits });
    },
  });

  const togglePauseMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.toggleListingPause(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: landlordKeys.listings() }),
  });

  const handlePublish = (data: Omit<Listing, 'id' | 'status' | 'createdAt'>) =>
    publishMutation.mutate(data);

  const handleTogglePause = (id: string) => togglePauseMutation.mutate(id);

  const filteredListings = listings.filter((l) => filter === 'all' || l.status === filter);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
          <p className="text-muted-foreground mt-1">
            {listings.filter((l) => l.status === 'published').length} active listing
            {listings.filter((l) => l.status === 'published').length === 1 ? '' : 's'} •{' '}
            {vacantUnits.length} vacant unit{vacantUnits.length === 1 ? '' : 's'} unlisted
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Publish Listing
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit mb-6">
        {statusFilters.map((option) => (
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

      {filteredListings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No listings found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Publish a vacant unit to start receiving rental applications.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
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

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        vacantUnits={vacantUnits}
        onPublish={handlePublish}
      />

      <ListingPreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} />
    </>
  );
}
