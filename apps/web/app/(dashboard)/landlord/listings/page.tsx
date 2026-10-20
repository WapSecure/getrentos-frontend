'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { ListingCard } from '@/components/landlord/listings/ListingCard';
import { CreateListingModal } from '@/components/landlord/listings/CreateListingModal';
import { ListingPreviewModal } from '@/components/landlord/listings/ListingPreviewModal';
import {
  Button,
  EmptyState,
  PageErrorState,
  Skeleton,
  useOptimisticMutation,
  useToast,
} from '@getrentos/ui';
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
  const toast = useToast();

  const {
    data: listings = [],
    isPending: isLoadingListings,
    isError: listingsFailed,
    refetch: refetchListings,
  } = useQuery({
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
        askingRent,
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
          askingRent,
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
      setIsCreateModalOpen(false);
    },
  });

  const togglePauseMutation = useOptimisticMutation({
    mutationFn: (id: string) => unwrap(landlordService.toggleListingPause(id)),
    patches: () => [
      {
        queryKey: landlordKeys.listings(),
        update: (old, id) =>
          (old as Listing[]).map((l) =>
            l.id === id ? { ...l, status: l.status === 'paused' ? 'published' : 'paused' } : l
          ),
      },
    ],
    errorMessage: 'Could not update this listing.',
    onSuccess: (listing) =>
      toast.success(listing.status === 'paused' ? 'Listing paused.' : 'Listing is live again.'),
  });

  const handlePublish = (data: Omit<Listing, 'id' | 'status' | 'createdAt'>) =>
    publishMutation.mutate(data);

  const handleTogglePause = (id: string) => togglePauseMutation.mutate(id);

  const filteredListings = useMemo(
    () => listings.filter((l) => filter === 'all' || l.status === filter),
    [listings, filter]
  );

  const publishedCount = useMemo(
    () => listings.filter((l) => l.status === 'published').length,
    [listings]
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
          <p className="text-muted-foreground mt-1">
            {isLoadingListings || (listingsFailed && listings.length === 0) ? (
              'Loading your listings…'
            ) : (
              <>
                {publishedCount} active listing{publishedCount === 1 ? '' : 's'} •{' '}
                {vacantUnits.length} vacant unit{vacantUnits.length === 1 ? '' : 's'} unlisted
              </>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Publish Listing
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg max-w-full w-fit overflow-x-auto mb-6">
        {statusFilters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              filter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoadingListings ? (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          role="status"
          aria-busy="true"
          aria-label="Loading listings"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : listingsFailed && listings.length === 0 ? (
        <PageErrorState
          headingLevel="h2"
          title="We couldn't load your listings"
          description="This was a connection problem: nothing was lost. Try again."
          onRetry={() => void refetchListings()}
        />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
          description={
            filter === 'all'
              ? 'Publish a vacant unit to start receiving rental applications.'
              : 'Try another status or view all of your listings.'
          }
          action={
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => (filter === 'all' ? setIsCreateModalOpen(true) : setFilter('all'))}
            >
              {filter === 'all' ? 'Publish listing' : 'View all listings'}
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
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
        submitError={publishMutation.error}
        isSubmitting={publishMutation.isPending}
      />

      <ListingPreviewModal listing={previewListing} onClose={() => setPreviewListing(null)} />

    </>
  );
}
