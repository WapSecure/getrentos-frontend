'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Megaphone } from 'lucide-react';
import { RealtorListingCard } from '@/components/realtor/listings/RealtorListingCard';
import { RealtorListingPreviewModal } from '@/components/realtor/listings/RealtorListingPreviewModal';
import { CreateListingModal } from '@/components/realtor/listings/CreateListingModal';
import { Button, Pagination, Toast, type ToastVariant } from '@getrentos/ui';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorListing, realtorService } from '@/services/realtorService';
import type { CreateRealtorListingInput } from '@/components/realtor/listings/CreateListingModal';

type StatusFilter = 'all' | RealtorListingStatus;

const PAGE_SIZE = 10;

export default function RealtorListingsPage() {
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
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
  const { data, isLoading } = useQuery({
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
  });
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
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
    onError: (error) =>
      setToast({
        message: error.message || 'Unable to create this listing. Please try again.',
        variant: 'error',
      }),
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or client..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setPage(1);
              }}
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
      ) : listings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            {total === 0 ? 'No listings yet' : 'No listings match your filters'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {total === 0
              ? 'Add a listing on behalf of one of your clients to get started.'
              : 'Try adjusting your search or filter.'}
          </p>
          {total === 0 && (
            <Button variant="primary" className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
              Add Your First Listing
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <RealtorListingCard
              key={listing.id}
              listing={listing}
              delay={index * 0.05}
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
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      <RealtorListingPreviewModal
        listing={previewListing}
        onClose={() => setPreviewListing(null)}
      />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
