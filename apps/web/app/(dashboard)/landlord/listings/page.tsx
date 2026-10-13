'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { ListingCard } from '@/components/landlord/listings/ListingCard';
import { CreateListingModal } from '@/components/landlord/listings/CreateListingModal';
import { ListingPreviewModal } from '@/components/landlord/listings/ListingPreviewModal';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
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
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

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

  const togglePauseMutation = useMutation({
    mutationFn: (id: string) => unwrap(landlordService.toggleListingPause(id)),
    onMutate: (id) => setUpdatingListingId(id),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      setToast({
        message: listing.status === 'paused' ? 'Listing paused.' : 'Listing is live again.',
        variant: 'success',
      });
    },
    onError: (error: Error) =>
      setToast({
        message: error.message || 'Could not update this listing.',
        variant: 'error',
      }),
    onSettled: () => setUpdatingListingId(null),
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
            {isLoadingListings || listingsFailed ? (
              'Loading your listings…'
            ) : (
              <>
                {publishedCount} active listing{publishedCount === 1 ? '' : 's'} •{' '}
                {vacantUnits.length} vacant unit{vacantUnits.length === 1 ? '' : 's'} unlisted
              </>
            )}
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

      {isLoadingListings ? (
        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          aria-busy="true"
          aria-label="Loading listings"
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>
      ) : listingsFailed ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            We couldn&apos;t load your listings
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            This was a connection problem: nothing was lost. Try again.
          </p>
          <Button variant="primary" className="mt-6" onClick={() => refetchListings()}>
            Try again
          </Button>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {filter === 'all'
              ? 'Publish a vacant unit to start receiving rental applications.'
              : 'Try another status or view all of your listings.'}
          </p>
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            className="mt-6"
            onClick={() => (filter === 'all' ? setIsCreateModalOpen(true) : setFilter('all'))}
          >
            {filter === 'all' ? 'Publish listing' : 'View all listings'}
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onTogglePause={handleTogglePause}
              onPreview={setPreviewListing}
              isUpdating={updatingListingId === listing.id}
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

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
