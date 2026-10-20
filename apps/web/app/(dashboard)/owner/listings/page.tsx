'use client';

import {
  PageErrorState,
  Pagination,
  Button,
  SearchInput,
  EmptyState,
  ListSkeleton,
  Skeleton,
} from '@getrentos/ui';
import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { SaleListingCard } from '@/components/owner/listings/SaleListingCard';
import { CreateSaleListingModal } from '@/components/owner/listings/CreateSaleListingModal';
import { ManageListingModal } from '@/components/owner/listings/ManageListingModal';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';
import type { SaleListing, SaleListingStatus } from '@/types/owner';

type StatusFilter = 'all' | SaleListingStatus;

const PAGE_SIZE = 10;

export default function OwnerListingsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [manageListing, setManageListing] = useState<SaleListing | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const listingsQuery = useQuery({
    queryKey: [
      ...ownerKeys.listings,
      {
        search: debouncedSearch,
        status: filter === 'all' ? undefined : filter,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listListings({
          search: debouncedSearch || undefined,
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data, isLoading } = listingsQuery;
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasActiveFilters = Boolean(debouncedSearch || filter !== 'all');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.listings });

  const createMutation = useMutation({
    mutationFn: (data: {
      propertyId: string;
      price: number;
      listingTitle?: string;
      amenities?: string[];
      intent: 'draft' | 'publish';
    }) => unwrap(ownerService.createListing(data)),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SaleListingStatus }) =>
      unwrap(
        ownerService.setListingStatus(id, status.toUpperCase() as 'PUBLISHED' | 'PAUSED' | 'CLOSED')
      ),
    onSuccess: invalidate,
  });

  // Awaited by the form, which then saves the photos and closes; a refusal
  // stays in the form (and in the notice below) instead of vanishing.
  const handleCreate = (data: Omit<SaleListing, 'id' | 'createdAt'>, publishNow: boolean) =>
    createMutation.mutateAsync({
      propertyId: data.propertyId,
      price: data.askingPrice,
      listingTitle: data.listingTitle,
      amenities: data.features,
      // Save Draft keeps it off the market; Publish puts it live, or in review.
      intent: publishNow ? 'publish' : 'draft',
    });

  const handleChangeStatus = (listingId: string, status: SaleListingStatus) => {
    statusMutation.mutate({ id: listingId, status });
  };

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'paused', label: 'Paused' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sale Listings</h1>
          <div className="text-muted-foreground mt-1">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              `${total} listing${total === 1 ? '' : 's'} across your portfolio`
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Listing
        </Button>
      </div>

      {/* Publishing a for-sale listing needs an identity-verified account (tier 2). */}
      {createMutation.error && (
        <div className="mb-6">
          <VerificationRequiredNotice
            error={createMutation.error}
            href={ROUTES.OWNER_LISTINGS}
            verificationHref={ROUTES.OWNER_VERIFICATION}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by title or property..."
          className="flex-1 max-w-sm"
        />
        <div className="flex gap-1 p-1 bg-secondary rounded-lg max-w-full w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={filter === option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
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
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} variant="cards" label="Loading listings" />
      ) : listingsQuery.isError && !data ? (
        <PageErrorState
          title="Sale listings are unavailable"
          description="We could not load your sale listings. Please try again."
          onRetry={() => void listingsQuery.refetch()}
          isRetrying={listingsQuery.isFetching}
        />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={hasActiveFilters ? 'No listings match your filters' : 'No sale listings yet'}
          description={
            hasActiveFilters
              ? 'Clear the current filters to return to your full portfolio.'
              : 'Create a sale listing for one of your verified properties to start reaching buyers.'
          }
          action={
            !hasActiveFilters ? (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              Create your first listing
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setDebouncedSearch('');
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <SaleListingCard
              key={listing.id}
              listing={listing}
              delay={index * 0.05}
              onClick={() => setManageListing(listing)}
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

      <CreateSaleListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      <ManageListingModal
        listing={manageListing}
        onClose={() => setManageListing(null)}
        onChangeStatus={handleChangeStatus}
      />
    </>
  );
}
