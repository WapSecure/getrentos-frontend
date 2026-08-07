'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { DiscoverFilters } from '@/components/renter/discover/DiscoverFilters';
import { DiscoverSearchBar } from '@/components/renter/discover/DiscoverSearchBar';
import { DiscoverPropertyGrid } from '@/components/renter/discover/DiscoverPropertyGrid';
import { DiscoverMapView } from '@/components/renter/discover/DiscoverMapView';
import { DiscoverCompareDrawer } from '@/components/renter/discover/DiscoverCompareDrawer';
import { DiscoverAIRecommendations } from '@/components/renter/discover/DiscoverAIRecommendations';
import { DiscoverAIPricePredictor } from '@/components/renter/discover/DiscoverAIPricePredictor';
import { DiscoverAINeighborhoodInsights } from '@/components/renter/discover/DiscoverAINeighborhoodInsights';
import { DiscoverAIApplicationAssistant } from '@/components/renter/discover/DiscoverAIApplicationAssistant';
import { RecentlyViewed } from '@/components/renter/discover/features/RecentlyViewed';
import { DocumentChecklist } from '@/components/renter/discover/features/DocumentChecklist';
import { SavedSearchAlert } from '@/components/renter/discover/features/SavedSearchAlert';
import { Toast, ToastVariant } from '@/components/ui/Toast';
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';
import { Property } from '@/types/renter';

export default function DiscoverPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    verifiedOnly: false,
  });

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem('renter_saved_properties');
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedProperties(JSON.parse(saved));
    }
  }, []);

  const showToast = (message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProperty = (propertyId: string) => {
    const currentSaved = localStorage.getItem('renter_saved_properties');
    let savedIds: string[] = currentSaved ? JSON.parse(currentSaved) : [];

    if (savedIds.includes(propertyId)) {
      savedIds = savedIds.filter((id) => id !== propertyId);
      showToast('Property removed from saved', 'info');
    } else {
      savedIds.push(propertyId);
      showToast('Property saved successfully!', 'success');
    }

    localStorage.setItem('renter_saved_properties', JSON.stringify(savedIds));
    setSavedProperties(savedIds);
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

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Discover Properties
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Find your perfect home from thousands of verified listings
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <DiscoverSearchBar onSearch={(query) => console.log('Search:', query)} />
                  </div>
                  <SavedSearchAlert
                    currentFilters={filters}
                    onSave={(name, filters) => console.log('Saved:', name, filters)}
                  />
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
                          ? 'bg-[#c4a747] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                          ? 'bg-[#c4a747] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                  <DiscoverMapView />
                )}
              </div>

              <div className="space-y-6">
                <RecentlyViewed />
                <DiscoverAIRecommendations />
                <DiscoverAIPricePredictor />
                <DiscoverAINeighborhoodInsights />
                <DiscoverAIApplicationAssistant />
                <DocumentChecklist />
              </div>
            </div>
          </div>
        </main>
      </div>

      <DiscoverCompareDrawer
        isOpen={showCompareDrawer}
        onClose={() => setShowCompareDrawer(false)}
        properties={compareList}
        onRemove={(propertyId) => setCompareList(compareList.filter((p) => p.id !== propertyId))}
      />
    </div>
  );
}
