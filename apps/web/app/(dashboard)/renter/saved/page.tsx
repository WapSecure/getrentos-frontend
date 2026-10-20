'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SavedPropertiesHeader } from '@/components/renter/saved/SavedPropertiesHeader';
import { SavedPropertiesFilters } from '@/components/renter/saved/SavedPropertiesFilters';
import { SavedPropertiesGrid } from '@/components/renter/saved/SavedPropertiesGrid';
import { SavedSearchesList } from '@/components/renter/saved/SavedSearchesList';
import { WishlistManager } from '@/components/renter/saved/WishlistManager';
import { RecentlyViewed } from '@/components/renter/saved/RecentlyViewed';
import { SavedRecommendations } from '@/components/renter/saved/SavedRecommendations';
import { BulkActions } from '@/components/renter/saved/BulkActions';
import { ExportSavedProperties } from '@/components/renter/saved/ExportSavedProperties';
import {
  PageErrorState,
  PageLoadingState,
  Pagination,
  useOptimisticMutation,
  useToast,
} from '@getrentos/ui';
import { renterService, type SavedListingItem } from '@/services/renterService';
import { unwrap, type Paginated } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export default function SavedPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [selectedWishlist, setSelectedWishlist] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'trust-score'>(
    'recent'
  );
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'viewed'>('all');
  const [selectedSavedListings, setSelectedSavedListings] = useState<Record<string, string>>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const toast = useToast();

  const savedListingParams = {
    page,
    pageSize: PAGE_SIZE,
    wishlistId: selectedWishlist === 'all' ? undefined : selectedWishlist,
    status: filterStatus === 'all' ? undefined : filterStatus,
    sortBy,
  };
  const savedListingsQueryKey = [...renterKeys.savedListings, savedListingParams];
  const savedListingsQuery = useQuery({
    queryKey: savedListingsQueryKey,
    queryFn: () => unwrap(renterService.listSavedListings(savedListingParams)),
    placeholderData: keepPreviousData,
  });
  const data = savedListingsQuery.data;
  const savedProperties = data?.items ?? [];
  const total = data?.total ?? 0;
  const dashboardStatsQuery = useQuery({
    queryKey: renterKeys.dashboardStats,
    queryFn: () => unwrap(renterService.getDashboardStats()),
  });
  const wishlistsQuery = useQuery({
    queryKey: renterKeys.wishlists,
    queryFn: () => unwrap(renterService.listWishlists()),
  });
  const dashboardStats = dashboardStatsQuery.data;
  const wishlists = wishlistsQuery.data ?? [];
  const selectedProperties = Object.keys(selectedSavedListings);

  const invalidateSaved = () => {
    queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
    queryClient.invalidateQueries({ queryKey: renterKeys.wishlists });
    queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
  };

  const unsaveMutation = useOptimisticMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.unsaveListing(propertyId)),
    patches: (propertyId) => [
      {
        queryKey: savedListingsQueryKey,
        update: (old) => {
          const page = old as Paginated<SavedListingItem>;
          return {
            ...page,
            items: page.items.filter((item) => item.id !== propertyId),
            total: Math.max(0, page.total - 1),
          };
        },
      },
    ],
    invalidate: [renterKeys.savedListings, renterKeys.wishlists, renterKeys.dashboardStats],
    errorMessage: 'The property could not be removed from your saved list.',
    onSuccess: (_, propertyId) => {
      setSelectedSavedListings((previous) => {
        const next = { ...previous };
        delete next[propertyId];
        return next;
      });
      const pageNowEmpty = !savedProperties.some((property) => property.id !== propertyId);
      if (pageNowEmpty && page > 1) setPage((current) => current - 1);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      savedListingId,
      wishlistId,
    }: {
      savedListingId: string;
      wishlistId: string | null;
      propertyId: string;
    }) => unwrap(renterService.moveSavedListingToWishlist(savedListingId, wishlistId)),
    onSuccess: (_, { propertyId }) => {
      invalidateSaved();
      setSelectedSavedListings((previous) => {
        const next = { ...previous };
        delete next[propertyId];
        return next;
      });
    },
    onError: () => toast.error('The property could not be moved to that wishlist.'),
  });

  const handleRemoveProperty = (propertyId: string) => unsaveMutation.mutate(propertyId);

  const handleMoveToWishlist = (propertyId: string, wishlistId: string) => {
    const saved = savedProperties.find((p) => p.id === propertyId);
    if (saved)
      moveMutation.mutate({ savedListingId: saved.savedListingId, wishlistId, propertyId });
  };

  const handleSelectAll = () => {
    const pageIsFullySelected = savedProperties.every(
      (property) => selectedSavedListings[property.id]
    );
    setSelectedSavedListings((previous) => {
      const next = { ...previous };
      savedProperties.forEach((property) => {
        if (pageIsFullySelected) delete next[property.id];
        else next[property.id] = property.savedListingId;
      });
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedSavedListings({});
  };

  const bulkUnsaveMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => unwrap(renterService.unsaveListing(id)))),
    onSuccess: () => {
      invalidateSaved();
      setSelectedSavedListings({});
      if (
        savedProperties.length > 0 &&
        savedProperties.every((property) => selectedProperties.includes(property.id)) &&
        page > 1
      ) {
        setPage((current) => current - 1);
      }
    },
    onError: () => toast.error('The selected properties could not be removed.'),
  });

  const handleDeleteSelected = () => bulkUnsaveMutation.mutate(selectedProperties);

  const handleBulkMoveToWishlist = (wishlistId: string) => {
    Object.entries(selectedSavedListings).forEach(([propertyId, savedListingId]) =>
      moveMutation.mutate({ savedListingId, wishlistId, propertyId })
    );
  };

  const handleSelectProperty = (propertyId: string) => {
    const saved = savedProperties.find((property) => property.id === propertyId);
    if (!saved) return;
    setSelectedSavedListings((previous) => {
      const next = { ...previous };
      if (next[propertyId]) delete next[propertyId];
      else next[propertyId] = saved.savedListingId;
      return next;
    });
  };

  const savedQueries = [savedListingsQuery, dashboardStatsQuery, wishlistsQuery];
  if (savedQueries.some((query) => query.isLoading)) return <PageLoadingState />;
  if (savedQueries.some((query) => query.isError && !query.data)) {
    return (
      <PageErrorState
        title="Saved properties are unavailable"
        description="We could not load your saved homes and wishlists. Your saved items have not been changed."
        onRetry={() => savedQueries.forEach((query) => void query.refetch())}
        isRetrying={savedQueries.some((query) => query.isFetching)}
      />
    );
  }

  return (
    <>
      <SavedPropertiesHeader
        savedCount={dashboardStats?.savedPropertiesCount ?? total}
        wishlistCount={wishlists.length}
        onExport={() => setShowExportModal(true)}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <WishlistManager
            wishlists={wishlists}
            selectedWishlist={selectedWishlist}
            setSelectedWishlist={(wishlistId) => {
              setSelectedWishlist(wishlistId);
              setPage(1);
            }}
          />
          <RecentlyViewed />
          <SavedSearchesList />
          <SavedRecommendations />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <SavedPropertiesFilters
            viewMode={viewMode}
            setViewMode={setViewMode}
            sortBy={sortBy}
            setSortBy={(value) => {
              setSortBy(value);
              setPage(1);
            }}
            filterStatus={filterStatus}
            setFilterStatus={(value) => {
              setFilterStatus(value);
              setPage(1);
            }}
          />

          <SavedPropertiesGrid
            properties={savedProperties}
            total={total}
            isFiltered={selectedWishlist !== 'all' || filterStatus !== 'all'}
            viewMode={viewMode}
            sortBy={sortBy}
            filterStatus={filterStatus}
            onRemove={handleRemoveProperty}
            onMoveToWishlist={handleMoveToWishlist}
            wishlists={wishlists}
            selectedProperties={selectedProperties}
            onSelectProperty={handleSelectProperty}
          />
        </div>
      </div>

      <BulkActions
        selectedCount={selectedProperties.length}
        pageCount={savedProperties.length}
        wishlists={wishlists}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDeleteSelected={handleDeleteSelected}
        onMoveToWishlist={handleBulkMoveToWishlist}
      />

      <ExportSavedProperties
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        properties={savedProperties}
      />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
