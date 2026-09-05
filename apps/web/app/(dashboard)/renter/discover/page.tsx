'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DiscoverFilters } from '@/components/renter/discover/DiscoverFilters';
import { DiscoverSearchBar } from '@/components/renter/discover/DiscoverSearchBar';
import { DiscoverPropertyGrid } from '@/components/renter/discover/DiscoverPropertyGrid';
import { DiscoverMapView } from '@/components/renter/discover/DiscoverMapView';
import { DiscoverCompareDrawer } from '@/components/renter/discover/DiscoverCompareDrawer';
import { DiscoverRecommendations } from '@/components/renter/discover/DiscoverRecommendations';
import { DiscoverApplicationAssistant } from '@/components/renter/discover/DiscoverApplicationAssistant';
import { RecentlyViewed } from '@/components/renter/discover/features/RecentlyViewed';
import { DocumentChecklist } from '@/components/renter/discover/features/DocumentChecklist';
import { SavedSearchAlert } from '@/components/renter/discover/features/SavedSearchAlert';
import { PageErrorState, PageLoadingState, Toast, ToastVariant } from '@getrentos/ui';
import { Property } from '@/types/renter';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryFromUrl = searchParams.get('q')?.trim() ?? '';
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    verifiedOnly: false,
  });
  const filters = { ...filterOptions, search: queryFromUrl };

  const savedListingsQuery = useQuery({
    queryKey: renterKeys.savedListings,
    queryFn: () => unwrap(renterService.listSavedListings({ page: 1, pageSize: 100 })),
  });
  const savedListingsData = savedListingsQuery.data;
  const savedListings = savedListingsData?.items ?? [];
  const savedProperties = savedListings.map((p) => p.id);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const saveMutation = useMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.saveListing(propertyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
      showToast('Property saved successfully!', 'success');
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) => unwrap(renterService.unsaveListing(propertyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.savedListings });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
      showToast('Property removed from saved', 'info');
    },
  });

  const handleSaveProperty = (propertyId: string) => {
    if (savedProperties.includes(propertyId)) {
      unsaveMutation.mutate(propertyId);
    } else {
      saveMutation.mutate(propertyId);
    }
  };

  const handleCompare = (property: Property) => {
    if (compareList.some((p) => p.id === property.id)) {
      setCompareList(compareList.filter((p) => p.id !== property.id));
    } else if (compareList.length < 4) {
      setCompareList([...compareList, property]);
    }
    if (compareList.length > 0) {
      setShowCompareDrawer(true);
    }
  };

  const handleApplyFilters = (newFilters: Omit<typeof filters, 'search'>) => {
    setFilterOptions((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSearch = (query: string) => {
    const normalizedQuery = query.trim();
    router.replace(
      normalizedQuery
        ? `${ROUTES.RENTER_DISCOVER}?q=${encodeURIComponent(normalizedQuery)}`
        : ROUTES.RENTER_DISCOVER
    );
  };

  if (savedListingsQuery.isLoading) return <PageLoadingState />;
  if (savedListingsQuery.isError) {
    return (
      <PageErrorState
        title="Property discovery is unavailable"
        description="We could not load your saved-property state safely. Please retry before browsing."
        onRetry={() => void savedListingsQuery.refetch()}
        isRetrying={savedListingsQuery.isFetching}
      />
    );
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Discover Properties</h1>
        <p className="text-muted-foreground mt-1">
          Find your perfect home from thousands of verified listings
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <DiscoverSearchBar onSearch={handleSearch} />
            </div>
            <SavedSearchAlert currentFilters={filters} onApplyFilters={handleApplyFilters} />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <DiscoverFilters onApplyFilters={handleApplyFilters} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <DiscoverPropertyGrid
              filters={filters}
              savedProperties={savedProperties}
              onSave={handleSaveProperty}
              onCompare={handleCompare}
            />
          ) : (
            <DiscoverMapView filters={filters} />
          )}
        </div>

        <div className="space-y-6">
          <RecentlyViewed />
          <DiscoverRecommendations />
          <DiscoverApplicationAssistant />
          <DocumentChecklist />
        </div>
      </div>

      <DiscoverCompareDrawer
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        properties={compareList}
        onRemove={(propertyId) => setCompareList(compareList.filter((p) => p.id !== propertyId))}
      />
    </>
  );
}
