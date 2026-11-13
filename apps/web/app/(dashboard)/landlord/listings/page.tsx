'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from '@sureground/icons';
import { ListingCard } from '@/components/landlord/listings/ListingCard';
import {
  CREATE_LISTING_DRAFT_KEY,
  CreateListingModal,
} from '@/components/landlord/listings/CreateListingModal';
import { ListingPreviewModal } from '@/components/landlord/listings/ListingPreviewModal';
import { EditListingFeesDialog } from '@/components/landlord/listings/EditListingFeesDialog';
import { EditCommercialDetailsDialog } from '@/components/landlord/listings/EditCommercialDetailsDialog';
import {
  Button,
  EmptyState,
  PageErrorState,
  Skeleton,
  ToggleChip,
  useOptimisticMutation,
  useToast,
  clearSessionDraft,
  hasSessionDraft,
  PageHeader,
} from '@sureground/ui';
import { landlordService } from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { IdentityNudge } from '@/components/shared/verification/IdentityNudge';
import type { Listing, ListingStatus } from '@/types/landlord';
import { LandlordLettingsNav } from '@/components/shared/navigation/WorkflowNavs';

const statusFilters: { value: 'all' | ListingStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
];

export default function LandlordListingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | ListingStatus>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(() =>
    hasSessionDraft(CREATE_LISTING_DRAFT_KEY)
  );
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);
  const [feesListing, setFeesListing] = useState<Listing | null>(null);
  const [commercialListing, setCommercialListing] = useState<Listing | null>(null);
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
        serviceCharge,
        agencyFee,
        legalFee,
        amenities,
        availabilityDate,
        allowPets,
        furnished,
        shortLetEnabled,
        commercial,
      } = data;
      return unwrap(
        landlordService.publishListing({
          unitId,
          listingTitle,
          askingRent,
          rentPeriod,
          allowsMonthlyPayment,
          securityDeposit,
          serviceCharge,
          agencyFee,
          legalFee,
          amenities,
          availabilityDate,
          allowPets,
          furnished,
          shortLetEnabled,
          ...(commercial ? { commercial } : {}),
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: landlordKeys.listings() });
      queryClient.invalidateQueries({ queryKey: landlordKeys.vacantUnits });
      clearSessionDraft(CREATE_LISTING_DRAFT_KEY);
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
      <PageHeader
        eyebrow="Portfolio"
        title="Listings"
        description={
          <>
            {isLoadingListings || (listingsFailed && listings.length === 0) ? (
              <Skeleton className="inline-block h-4 w-64 max-w-full align-middle" />
            ) : (
              <>
                {publishedCount} active listing{publishedCount === 1 ? '' : 's'} •{' '}
                {vacantUnits.length} vacant unit{vacantUnits.length === 1 ? '' : 's'} unlisted
              </>
            )}
          </>
        }
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Publish listing
          </Button>
        }
      />
      <LandlordLettingsNav />

      <IdentityNudge
        verificationHref={ROUTES.LANDLORD_VERIFICATION}
        unlocks="publish listings"
        className="mb-6"
      />

      <div
        className="mb-6 flex gap-2 overflow-x-auto"
        role="group"
        aria-label="Filter listings by status"
      >
        {statusFilters.map((option) => (
          <ToggleChip
            key={option.value}
            size="sm"
            pressed={filter === option.value}
            onPressedChange={() => setFilter(option.value)}
          >
            {option.label}
          </ToggleChip>
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
              onEditFees={setFeesListing}
              onEditCommercial={setCommercialListing}
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
      <EditListingFeesDialog listing={feesListing} onClose={() => setFeesListing(null)} />
      <EditCommercialDetailsDialog
        listing={commercialListing}
        onClose={() => setCommercialListing(null)}
      />
    </>
  );
}
