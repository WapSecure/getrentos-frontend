'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
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
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';
import { Property } from '@/types/renter';

interface Wishlist {
  id: string;
  name: string;
  propertyIds: string[];
}

export default function SavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'rating'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'viewed' | 'price-drop'>(
    'all'
  );

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Load saved properties with mock data
  const loadSavedProperties = () => {
    const saved = localStorage.getItem('renter_saved_properties');
    let savedIds: string[] = [];

    if (saved) {
      savedIds = JSON.parse(saved);
    }

    // Mock properties data
    const mockProperties: Property[] = [
      {
        id: '1',
        title: 'Modern Downtown Loft',
        location: 'Ikeja, Lagos',
        price: 200000,
        period: 'month',
        bedrooms: 2,
        bathrooms: 2,
        size: 1200,
        rating: 4.8,
        verified: true,
        image: '',
        score: 92,
        hasVirtualTour: true,
        virtualTourUrl: '#',
        landlordResponseRate: 95,
        landlordRating: 4.9,
        landlordReviews: 156,
        landlordVerified: true,
      },
      {
        id: '2',
        title: 'Cozy Studio Apartment',
        location: 'Victoria Island, Lagos',
        price: 150000,
        period: 'month',
        bedrooms: 1,
        bathrooms: 1,
        size: 650,
        rating: 4.6,
        verified: true,
        image: '',
        score: 78,
        hasVirtualTour: false,
        landlordResponseRate: 88,
        landlordRating: 4.7,
        landlordReviews: 89,
        landlordVerified: true,
      },
      {
        id: '3',
        title: 'Luxury Beachfront Villa',
        location: 'Elegushi Beach, Lagos',
        price: 800000,
        period: 'month',
        bedrooms: 4,
        bathrooms: 3,
        size: 3200,
        rating: 4.9,
        verified: true,
        image: '',
        score: 96,
        hasVirtualTour: true,
        virtualTourUrl: '#',
        landlordResponseRate: 98,
        landlordRating: 5.0,
        landlordReviews: 234,
        landlordVerified: true,
      },
      {
        id: '4',
        title: 'Executive 3-Bed Apartment',
        location: 'Ikoyi, Lagos',
        price: 350000,
        period: 'month',
        bedrooms: 3,
        bathrooms: 2,
        size: 1800,
        rating: 4.7,
        verified: true,
        image: '',
        score: 85,
        hasVirtualTour: true,
        virtualTourUrl: '#',
        landlordResponseRate: 92,
        landlordRating: 4.8,
        landlordReviews: 112,
        landlordVerified: true,
      },
      {
        id: '5',
        title: 'Affordable 2-Bed Flat',
        location: 'Surulere, Lagos',
        price: 120000,
        period: 'month',
        bedrooms: 2,
        bathrooms: 1,
        size: 950,
        rating: 4.5,
        verified: false,
        image: '',
        score: 65,
        hasVirtualTour: false,
        landlordResponseRate: 75,
        landlordRating: 4.2,
        landlordReviews: 45,
        landlordVerified: false,
      },
      {
        id: '6',
        title: 'Penthouse with Ocean View',
        location: 'Lekki Phase 1, Lagos',
        price: 550000,
        period: 'month',
        bedrooms: 3,
        bathrooms: 2,
        size: 2200,
        rating: 4.9,
        verified: true,
        image: '',
        score: 94,
        hasVirtualTour: true,
        virtualTourUrl: '#',
        landlordResponseRate: 96,
        landlordRating: 4.9,
        landlordReviews: 178,
        landlordVerified: true,
      },
    ];

    // If no saved IDs, use first 3 as default saved
    if (savedIds.length === 0) {
      const defaultSaved = ['1', '2', '5'];
      localStorage.setItem('renter_saved_properties', JSON.stringify(defaultSaved));
      const filtered = mockProperties.filter((p) => defaultSaved.includes(p.id));
      setSavedProperties(filtered);
    } else {
      const filtered = mockProperties.filter((p) => savedIds.includes(p.id));
      setSavedProperties(filtered);
    }
  };

  const loadWishlists = () => {
    const saved = localStorage.getItem('renter_wishlists');
    if (saved) {
      setWishlists(JSON.parse(saved));
    } else {
      const defaultWishlists = [
        { id: '1', name: 'Dream Homes', propertyIds: [] },
        { id: '2', name: 'Budget Options', propertyIds: [] },
        { id: '3', name: 'To Visit', propertyIds: [] },
      ];
      setWishlists(defaultWishlists);
      localStorage.setItem('renter_wishlists', JSON.stringify(defaultWishlists));
    }
  };

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
      loadSavedProperties();
      loadWishlists();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleRemoveProperty = (propertyId: string) => {
    const updated = savedProperties.filter((p) => p.id !== propertyId);
    setSavedProperties(updated);
    const savedIds = updated.map((p) => p.id);
    localStorage.setItem('renter_saved_properties', JSON.stringify(savedIds));
    setSelectedProperties(selectedProperties.filter((id) => id !== propertyId));
  };

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

  const handleDeleteSelected = () => {
    const updated = savedProperties.filter((p) => !selectedProperties.includes(p.id));
    setSavedProperties(updated);
    const savedIds = updated.map((p) => p.id);
    localStorage.setItem('renter_saved_properties', JSON.stringify(savedIds));
    setSelectedProperties([]);
  };

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

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </main>
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
    </div>
  );
}
