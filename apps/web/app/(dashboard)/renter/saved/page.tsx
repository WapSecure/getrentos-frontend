'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SavedPropertiesHeader } from '@/components/renter/saved/SavedPropertiesHeader';
import { SavedPropertiesFilters } from '@/components/renter/saved/SavedPropertiesFilters';
import { SavedPropertiesGrid } from '@/components/renter/saved/SavedPropertiesGrid';
import { SavedSearchesList } from '@/components/renter/saved/SavedSearchesList';
import { WishlistManager } from '@/components/renter/saved/WishlistManager';
import { RecentlyViewed } from '@/components/renter/saved/RecentlyViewed';
import { SavedAIRecommendations } from '@/components/renter/saved/SavedAIRecommendations';
import { BulkActions } from '@/components/renter/saved/BulkActions';
import { ExportSavedProperties } from '@/components/renter/saved/ExportSavedProperties';
import { Toast } from '@/components/ui/Toast';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface Wishlist {
  id: string;
  name: string;
  propertyIds: string[];
}

export default function SavedPage() {
  const queryClient = useQueryClient();
  const { data: savedProperties = [] } = useQuery({
    queryKey: renterKeys.savedListings,
    queryFn: () => unwrap(renterService.listSavedListings()),
  });
  const [wishlists, setWishlists] = useState<Wishlist[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('renter_wishlists');
    if (saved) return JSON.parse(saved);
    const defaultWishlists = [
      { id: '1', name: 'Dream Homes', propertyIds: [] },
      { id: '2', name: 'Budget Options', propertyIds: [] },
      { id: '3', name: 'To Visit', propertyIds: [] },
    ];
    localStorage.setItem('renter_wishlists', JSON.stringify(defaultWishlists));
    return defaultWishlists;
  });
  const [selectedWishlist, setSelectedWishlist] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'rating'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'viewed' | 'price-drop'>(
    'all'
  );

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const invalidateSaved = () => {
    queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
    queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
  };

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.unsaveListing(propertyId)),
    onSuccess: (_, propertyId) => {
      invalidateSaved();
      setSelectedProperties((prev) => prev.filter((id) => id !== propertyId));
    },
  });

  const handleRemoveProperty = (propertyId: string) => unsaveMutation.mutate(propertyId);

  const handleMoveToWishlist = (propertyId: string, wishlistId: string) => {
    const updatedWishlists = wishlists.map((w) => {
      if (w.id === wishlistId && !w.propertyIds.includes(propertyId)) {
        return { ...w, propertyIds: [...w.propertyIds, propertyId] };
      }
      return w;
    });
    setWishlists(updatedWishlists);
    localStorage.setItem('renter_wishlists', JSON.stringify(updatedWishlists));
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
      `Share link copied for ${selectedProperties.length} propert${selectedProperties.length === 1 ? 'y' : 'ies'}`
    );
    window.setTimeout(() => setShareToast(null), 3000);
  };

  const handleBulkMoveToWishlist = (wishlistId: string) => {
    const updatedWishlists = wishlists.map((w) =>
      w.id === wishlistId
        ? { ...w, propertyIds: Array.from(new Set([...w.propertyIds, ...selectedProperties])) }
        : w
    );
    setWishlists(updatedWishlists);
    localStorage.setItem('renter_wishlists', JSON.stringify(updatedWishlists));
    setSelectedProperties([]);
  };

  const handleSelectProperty = (propertyId: string) => {
    if (selectedProperties.includes(propertyId)) {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId));
    } else {
      setSelectedProperties([...selectedProperties, propertyId]);
    }
  };

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
            setWishlists={setWishlists}
            selectedWishlist={selectedWishlist}
            setSelectedWishlist={setSelectedWishlist}
          />
          <RecentlyViewed />
          <SavedSearchesList />
          <SavedAIRecommendations />
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
            properties={savedProperties}
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
