'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SavedPropertiesHeader } from '@/components/renter/saved/SavedPropertiesHeader';
import { SavedPropertiesFilters } from '@/components/renter/saved/SavedPropertiesFilters';
import { SavedPropertiesGrid } from '@/components/renter/saved/SavedPropertiesGrid';
import { SavedSearchesList } from '@/components/renter/saved/SavedSearchesList';
import { WishlistManager } from '@/components/renter/saved/WishlistManager';
import { RecentlyViewed } from '@/components/renter/saved/RecentlyViewed';
import { SavedRecommendations } from '@/components/renter/saved/SavedRecommendations';
import { BulkActions } from '@/components/renter/saved/BulkActions';
import { ExportSavedProperties } from '@/components/renter/saved/ExportSavedProperties';
import { Pagination, Toast } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
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
  const [shareToast, setShareToast] = useState<string | null>(null);

  const savedListingParams = {
    page,
    pageSize: PAGE_SIZE,
    wishlistId: selectedWishlist === 'all' ? undefined : selectedWishlist,
    status: filterStatus === 'all' ? undefined : filterStatus,
    sortBy,
  };
  const { data } = useQuery({
    queryKey: [...renterKeys.savedListings, savedListingParams],
    queryFn: () => unwrap(renterService.listSavedListings(savedListingParams)),
  });
  const savedProperties = data?.items ?? [];
  const total = data?.total ?? 0;
  const { data: dashboardStats } = useQuery({
    queryKey: renterKeys.dashboardStats,
    queryFn: () => unwrap(renterService.getDashboardStats()),
  });
  const { data: wishlists = [] } = useQuery({
    queryKey: renterKeys.wishlists,
    queryFn: () => unwrap(renterService.listWishlists()),
  });
  const selectedProperties = Object.keys(selectedSavedListings);

  const invalidateSaved = () => {
    queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
    queryClient.invalidateQueries({ queryKey: renterKeys.wishlists });
    queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
  };

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.unsaveListing(propertyId)),
    onSuccess: (_, propertyId) => {
      invalidateSaved();
      setSelectedSavedListings((previous) => {
        const next = { ...previous };
        delete next[propertyId];
        return next;
      });
      if (savedProperties.length === 1 && page > 1) setPage((current) => current - 1);
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
  });

  const handleDeleteSelected = () => bulkUnsaveMutation.mutate(selectedProperties);

  const handleShareSelected = () => {
    setShareToast(
      `Share link copied for ${selectedProperties.length} propert${
        selectedProperties.length === 1 ? 'y' : 'ies'
      }`
    );
    window.setTimeout(() => setShareToast(null), 3000);
  };

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

      {shareToast && (
        <Toast message={shareToast} variant="success" onClose={() => setShareToast(null)} />
      )}

      <BulkActions
        selectedCount={selectedProperties.length}
        pageCount={savedProperties.length}
        wishlists={wishlists}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onDeleteSelected={handleDeleteSelected}
        onShareSelected={handleShareSelected}
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
