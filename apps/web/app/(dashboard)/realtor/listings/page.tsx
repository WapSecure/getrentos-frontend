'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { RealtorListingCard } from '@/components/realtor/listings/RealtorListingCard';
import { RealtorListingPreviewModal } from '@/components/realtor/listings/RealtorListingPreviewModal';
import { CreateListingModal } from '@/components/realtor/listings/CreateListingModal';
import {
  Button,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Pagination,
  SearchInput,
  ToggleChip,
  useToast,
} from '@getrentos/ui';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';
import { unwrap, VerificationRequiredError } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorListing, realtorService } from '@/services/realtorService';
import type { CreateRealtorListingInput } from '@/components/realtor/listings/CreateListingModal';

type StatusFilter = 'all' | RealtorListingStatus;

const PAGE_SIZE = 10;

export default function RealtorListingsPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewListing, setPreviewListing] = useState<RealtorListing | null>(null);
  const queryClient = useQueryClient();
  const listingStatus =
    filter === 'all'
      ? undefined
      : filter === 'pending_approval'
        ? 'PENDING_VERIFICATION'
        : (filter.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED');
  const listingsQuery = useQuery({
    queryKey: [
      ...realtorKeys.listings,
      { page, pageSize: PAGE_SIZE, search: searchQuery.trim() || undefined, status: listingStatus },
    ],
    queryFn: async () => {
      const result = await unwrap(
        realtorService.listListings({
          page,
          pageSize: PAGE_SIZE,
          search: searchQuery.trim() || undefined,
          status: listingStatus,
        })
      );
      return { ...result, items: result.items.map(mapRealtorListing) };
    },
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = listingsQuery;
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters = Boolean(searchQuery.trim() || filter !== 'all');
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
      setPage(1);
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      // Verification/tier gates surface as an inline upsell inside the modal, not a toast.
      if (error instanceof VerificationRequiredError) return;
      toast.error(error.message || 'Unable to create this listing. Please try again.');
    },
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
      setPage(1);
    }
  }, [searchParams]);

  const handleCreate = (data: CreateRealtorListingInput) => createListing.mutate(data);

  const openCreateModal = () => {
    createListing.reset();
    setIsCreateModalOpen(true);
  };

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
            {total} listing{total === 1 ? '' : 's'} across your clients
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
          Add Listing
        </Button>
      </div>

      <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row">
        <SearchInput
          value={searchQuery}
          onValueChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search by title or client..."
          label="Search listings"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <div
          className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto pb-1 sm:w-auto"
          role="group"
          aria-label="Filter listings by status"
        >
          {filterOptions.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading listings" />
      ) : listingsQuery.isError && !data ? (
        <PageErrorState
          title="Listings are unavailable"
          description="We could not load the listings you manage. Please try again."
          onRetry={() => void listingsQuery.refetch()}
          isRetrying={listingsQuery.isFetching}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={hasActiveFilters ? 'No listings match your filters' : 'No listings yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to all managed listings.'
              : 'Add a listing on behalf of one of your clients to get started.'
          }
          action={
            !hasActiveFilters ? (
              <Button variant="primary" onClick={openCreateModal}>
                Add your first listing
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <RealtorListingCard
              key={listing.id}
              listing={listing}
              onClick={() => setPreviewListing(listing)}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}

      <CreateListingModal
        key={isCreateModalOpen ? 'open' : 'closed'}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        error={createListing.error}
        isSubmitting={createListing.isPending}
      />

      <RealtorListingPreviewModal
        listing={previewListing}
        onClose={() => setPreviewListing(null)}
      />
    </>
  );
}
