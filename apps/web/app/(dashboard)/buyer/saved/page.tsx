'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import {
  Button,
  Pagination,
  QueryState,
  Skeleton,
  useOptimisticMutation,
} from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerPropertyListing } from '@/types/buyer';
import { ROUTES } from '@/lib/constants/auth';

export default function BuyerSavedPage() {
  const router = useRouter();
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const savedKey = [...buyerKeys.saved, { page, pageSize: PAGE_SIZE }];
  const savedQuery = useQuery({
    queryKey: savedKey,
    queryFn: () => unwrap(buyerService.listSaved({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const { data: savedData, isLoading } = savedQuery;
  const savedListings = savedData?.items ?? [];
  const total = savedData?.total ?? 0;

  const unsaveMutation = useOptimisticMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.unsaveListing(listingId)),
    patches: () => [
      {
        queryKey: savedKey,
        update: (old, listingId) => {
          const current = old as { items: BuyerPropertyListing[]; total: number };
          const items = current.items.filter((item) => item.id !== listingId);
          return { ...current, items, total: current.total - (current.items.length - items.length) };
        },
      },
    ],
    invalidate: [buyerKeys.saved],
    errorMessage: 'The property could not be removed from your saved list.',
  });

  const toggleSave = (propertyId: string) => {
    unsaveMutation.mutate(propertyId);
    if (activeListing?.id === propertyId) setActiveListing(null);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? (
            <Skeleton className="inline-block h-4 w-48 align-middle" />
          ) : (
            `${total} propert${total === 1 ? 'y' : 'ies'} in your shortlist`
          )}
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={savedQuery.isError && !savedData}
        onRetry={() => void savedQuery.refetch()}
        isRetrying={savedQuery.isFetching}
        isEmpty={savedListings.length === 0}
        empty={{
          icon: Heart,
          title: 'No saved properties yet',
          description: 'Tap the heart icon on any property to save it here for later.',
          action: (
            <Button href={ROUTES.BUYER_DISCOVER} variant="primary">
              Discover Properties
            </Button>
          ),
        }}
        scope="page"
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedListings.map((listing, index) => (
            <PropertyListingCard
              key={listing.id}
              listing={listing}
              isSaved
              onToggleSave={() => toggleSave(listing.id)}
              onViewDetails={() => setActiveListing(listing)}
              delay={index * 0.05}
            />
          ))}
        </div>
      </QueryState>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}

      <PropertyDetailModal
        listing={activeListing}
        isSaved
        onClose={() => setActiveListing(null)}
        onToggleSave={() => activeListing && toggleSave(activeListing.id)}
        onRequestViewing={() =>
          activeListing && router.push(`${ROUTES.BUYER_VIEWINGS}?property=${activeListing.id}`)
        }
        onMakeOffer={() =>
          activeListing && router.push(`${ROUTES.BUYER_OFFERS}?property=${activeListing.id}`)
        }
        onMessageOwner={() =>
          activeListing && router.push(`${ROUTES.BUYER_MESSAGES}?property=${activeListing.id}`)
        }
      />
    </>
  );
}
