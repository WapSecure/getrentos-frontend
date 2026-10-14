'use client';

import { LegacyInput } from '@getrentos/ui';
import { Pagination } from '@getrentos/ui';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Building2, ArrowUpDown } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerPropertyListing, ListingPropertyType } from '@/types/buyer';
import { ROUTES } from '@/lib/constants/auth';
import { PROPERTY_TYPE_OPTIONS, toApiPropertyType } from '@/lib/propertyTypes';
import { PageErrorState, PageLoadingState, Toast } from '@getrentos/ui';

type SortOrder = 'default' | 'price_asc' | 'price_desc';

export default function BuyerDiscoverPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  });
  const data = listingsQuery.data;
  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const savedQuery = useQuery({
    queryKey: [...buyerKeys.saved, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(buyerService.listSaved({ page: 1, pageSize: 100 })),
  });
  const savedIds = (savedQuery.data?.items ?? []).map((property) => property.id);

  const saveMutation = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.saveListing(listingId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.saved }),
    onError: () => setErrorMessage('The property could not be saved.'),
  });
  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.unsaveListing(listingId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.saved }),
    onError: () => setErrorMessage('The property could not be removed from your saved list.'),
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  const toggleSave = (propertyId: string) => {
    const isSaved = savedIds.includes(propertyId);
    if (isSaved) {
      unsaveMutation.mutate(propertyId);
    } else {
      saveMutation.mutate(propertyId);
    }
  };

  if (listingsQuery.isLoading || savedQuery.isLoading) return <PageLoadingState />;
  if (listingsQuery.isError || savedQuery.isError) {
    return (
      <PageErrorState
        title="Properties are unavailable"
        description="We could not load listings and your saved-property state safely."
        onRetry={() => {
          void listingsQuery.refetch();
          void savedQuery.refetch();
        }}
        isRetrying={listingsQuery.isFetching || savedQuery.isFetching}
      />
    );
  }

  const typeFilters: { value: 'all' | ListingPropertyType; label: string }[] = [
    { value: 'all', label: 'All' },
    ...PROPERTY_TYPE_OPTIONS.map(({ label }) => ({ value: label, label })),
  ];

  return (
    <>
      {errorMessage && (
        <Toast message={errorMessage} variant="error" onClose={() => setErrorMessage(null)} />
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Discover Properties</h1>
        <p className="text-muted-foreground mt-1">
          {total} propert{total === 1 ? 'y' : 'ies'} for sale
        </p>
      </div>

      {estateFromUrl && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm text-muted-foreground">
            Showing only properties marketed inside{' '}
            <span className="font-medium text-foreground">
              {estateFromUrl.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            .
          </p>
          <button
            type="button"
            onClick={() => router.replace('/buyer/discover')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show all properties
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or city..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => {
            setSortOrder((s) =>
              s === 'default' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'default'
            );
            setPage(1);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-fit"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortOrder === 'default'
            ? 'Sort by Price'
            : sortOrder === 'price_asc'
              ? 'Price: Low to High'
              : 'Price: High to Low'}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {typeFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              setTypeFilter(option.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              typeFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {listings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No properties match your search</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search or filter.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing, index) => (
            <PropertyListingCard
              key={listing.id}
              listing={listing}
              isSaved={savedIds.includes(listing.id)}
              onToggleSave={() => toggleSave(listing.id)}
              onViewDetails={() => setActiveListing(listing)}
              delay={index * 0.05}
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
          className="mt-8"
        />
      )}

      <PropertyDetailModal
        // A fresh modal per listing, so a playing tour never carries over.
        key={activeListing?.id ?? 'none'}
        listing={activeListing}
        isSaved={activeListing ? savedIds.includes(activeListing.id) : false}
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
