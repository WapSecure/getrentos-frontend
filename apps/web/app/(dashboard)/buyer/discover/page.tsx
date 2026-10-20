'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Building2, ArrowUpDown } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerPropertyListing, ListingPropertyType } from '@/types/buyer';
import { ROUTES } from '@/lib/constants/auth';
import { PROPERTY_TYPE_OPTIONS, toApiPropertyType } from '@/lib/propertyTypes';
import {
  Button,
  Pagination,
  QueryState,
  SearchInput,
  SegmentedControl,
  Skeleton,
  useOptimisticMutation,
} from '@getrentos/ui';

type SortOrder = 'default' | 'price_asc' | 'price_desc';

export default function BuyerDiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ListingPropertyType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  // Arriving from an estate microsite (`?estate=<slug>`). Kept in the query key so
  // switching estates refetches rather than serving the previous estate's page.
  const estateFromUrl = searchParams.get('estate')?.trim() ?? '';
  const PAGE_SIZE = 9;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const listingsQuery = useQuery({
    queryKey: [
      'buyer',
      'listings',
      {
        search: debouncedSearch,
        type: typeFilter,
        sort: sortOrder,
        estate: estateFromUrl,
        page,
        pageSize: PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        buyerService.discover({
          search: debouncedSearch || undefined,
          propertyType: typeFilter === 'all' ? undefined : toApiPropertyType(typeFilter),
          sort: sortOrder === 'default' ? undefined : sortOrder,
          estate: estateFromUrl || undefined,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const data = listingsQuery.data;
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const savedKey = [...buyerKeys.saved, { page: 1, pageSize: 100 }];
  const savedQuery = useQuery({
    queryKey: savedKey,
    queryFn: () => unwrap(buyerService.listSaved({ page: 1, pageSize: 100 })),
  });
  const savedIds = (savedQuery.data?.items ?? []).map((property) => property.id);

  const saveToggle = useOptimisticMutation({
    mutationFn: ({ listing, save }: { listing: BuyerPropertyListing; save: boolean }) =>
      unwrap(save ? buyerService.saveListing(listing.id) : buyerService.unsaveListing(listing.id)),
    patches: () => [
      {
        queryKey: savedKey,
        update: (old, { listing, save }) => {
          const page = old as { items: BuyerPropertyListing[]; total: number };
          const items = page.items.filter((item) => item.id !== listing.id);
          return save
            ? { ...page, items: [listing, ...items], total: page.total + 1 }
            : { ...page, items, total: items.length < page.items.length ? page.total - 1 : page.total };
        },
      },
    ],
    invalidate: [buyerKeys.saved],
    errorMessage: 'Your saved list did not update. Please try again.',
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  const toggleSave = (listing: BuyerPropertyListing) => {
    saveToggle.mutate({ listing, save: !savedIds.includes(listing.id) });
  };

  const typeFilters: { value: 'all' | ListingPropertyType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...PROPERTY_TYPE_OPTIONS.map(({ label }) => ({ value: label, label })),
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Discover Properties</h1>
        <p className="text-muted-foreground mt-1">
          {total} propert{total === 1 ? 'y' : 'ies'} for sale
        </p>
      </div>

      {estateFromUrl && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Showing only properties marketed inside{' '}
            <span className="font-medium text-foreground">
              {estateFromUrl.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            .
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.replace('/buyer/discover')}>
            Show all properties
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search by title or city..."
          label="Search properties"
          className="flex-1 max-w-sm"
        />
        <Button
          variant="outline"
          className="w-fit"
          icon={<ArrowUpDown className="w-3.5 h-3.5" />}
          onClick={() => {
            setSortOrder((s) =>
              s === 'default' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'default'
            );
            setPage(1);
          }}
        >
          {sortOrder === 'default'
            ? 'Sort by Price'
            : sortOrder === 'price_asc'
              ? 'Price: Low to High'
              : 'Price: High to Low'}
        </Button>
      </div>

      <SegmentedControl
        size="sm"
        aria-label="Filter by property type"
        value={typeFilter}
        onValueChange={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        segments={typeFilters}
        className="max-w-full overflow-x-auto mb-6"
      />

      <QueryState
        isLoading={listingsQuery.isLoading || savedQuery.isLoading}
        isError={(listingsQuery.isError && !data) || (savedQuery.isError && !savedQuery.data)}
        errorTitle="Properties are unavailable"
        errorDescription="We could not load listings and your saved-property state safely."
        onRetry={() => {
          void listingsQuery.refetch();
          void savedQuery.refetch();
        }}
        isRetrying={listingsQuery.isFetching || savedQuery.isFetching}
        isEmpty={listings.length === 0}
        empty={{
          icon: Building2,
          title: 'No properties match your search',
          description: 'Try adjusting your search or filter.',
        }}
        loading={
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        }
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <PropertyListingCard
              key={listing.id}
              listing={listing}
              isSaved={savedIds.includes(listing.id)}
              onToggleSave={() => toggleSave(listing)}
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
        // A fresh modal per listing, so a playing tour never carries over.
        key={activeListing?.id ?? 'none'}
        listing={activeListing}
        isSaved={activeListing ? savedIds.includes(activeListing.id) : false}
        onClose={() => setActiveListing(null)}
        onToggleSave={() => activeListing && toggleSave(activeListing)}
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
