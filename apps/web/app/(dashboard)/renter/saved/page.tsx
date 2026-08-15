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
import { Toast } from '@/components/ui/Toast';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export default function SavedPage() {
  const queryClient = useQueryClient();
  const { data: savedProperties = [] } = useQuery({
    queryKey: renterKeys.savedListings,
    queryFn: () => unwrap(renterService.listSavedListings()),
  });
  const { data: wishlists = [] } = useQuery({
    queryKey: renterKeys.wishlists,
    queryFn: () => unwrap(renterService.listWishlists()),
  });
  const [selectedWishlist, setSelectedWishlist] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'rating'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'viewed'>('all');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const invalidateSaved = () => {
    queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
    queryClient.invalidateQueries({ queryKey: renterKeys.wishlists });
    queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
  };

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.unsaveListing(propertyId)),
    onSuccess: (_, propertyId) => {
      invalidateSaved();
      setSelectedProperties((prev) => prev.filter((id) => id !== propertyId));
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      savedListingId,
      wishlistId,
    }: {
      savedListingId: string;
      wishlistId: string | null;
    }) => unwrap(renterService.moveSavedListingToWishlist(savedListingId, wishlistId)),
    onSuccess: () => {
      invalidateSaved();
      setSelectedProperties([]);
    },
  });

  const handleRemoveProperty = (propertyId: string) => unsaveMutation.mutate(propertyId);

  const handleMoveToWishlist = (propertyId: string, wishlistId: string) => {
    const saved = savedProperties.find((p) => p.id === propertyId);
    if (saved) moveMutation.mutate({ savedListingId: saved.savedListingId, wishlistId });
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === savedProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(savedProperties.map((p) => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedProperties([]);
  };

  const bulkUnsaveMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => unwrap(renterService.unsaveListing(id)))),
    onSuccess: () => {
      invalidateSaved();
      setSelectedProperties([]);
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
    savedProperties
      .filter((p) => selectedProperties.includes(p.id))
      .forEach((p) => moveMutation.mutate({ savedListingId: p.savedListingId, wishlistId }));
  };

  const handleSelectProperty = (propertyId: string) => {
    if (selectedProperties.includes(propertyId)) {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId));
    } else {
      setSelectedProperties([...selectedProperties, propertyId]);
    }
  };

  const visibleProperties =
    selectedWishlist === 'all'
      ? savedProperties
      : savedProperties.filter((p) => p.wishlistId === selectedWishlist);

  return (
    <>
      <SavedPropertiesHeader
        savedCount={savedProperties.length}
        wishlistCount={wishlists.length}
        onExport={() => setShowExportModal(true)}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <WishlistManager
            wishlists={wishlists}
            selectedWishlist={selectedWishlist}
            setSelectedWishlist={setSelectedWishlist}
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
            setSortBy={setSortBy}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          <SavedPropertiesGrid
            properties={visibleProperties}
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
        totalCount={savedProperties.length}
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
    </>
  );
}
