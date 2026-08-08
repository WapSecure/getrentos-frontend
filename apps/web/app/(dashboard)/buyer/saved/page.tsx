'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { BuyerPropertyListing } from '@/types/buyer';

const SAVED_PROPERTIES_KEY = 'buyer_saved_properties';

const mockListings: BuyerPropertyListing[] = [
  {
    id: 'listing_001',
    title: 'Luxury 3-Bed Apartment with Ocean Views',
    propertyType: 'Apartment',
    askingPrice: 148_000_000,
    address: '3 Bar Beach Way',
    city: 'Victoria Island',
    state: 'Lagos',
    bedrooms: 3,
    bathrooms: 3,
    propertySize: 210,
    features: ['Swimming Pool', 'Gym', 'Parking', '24/7 Security', 'Waterfront View'],
    description: 'A stunning waterfront apartment with panoramic ocean views and premium finishes.',
    ownerName: 'Adaeze Okafor',
    ownerVerified: true,
    listedDate: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'listing_002',
    title: 'Spacious 4-Bed Duplex in Lekki',
    propertyType: 'Duplex',
    askingPrice: 95_000_000,
    address: '18 Chevron Drive',
    city: 'Lekki',
    state: 'Lagos',
    bedrooms: 4,
    bathrooms: 4,
    propertySize: 320,
    features: ['Parking', '24/7 Security', 'Garden', 'Furnished'],
    description: 'Family-friendly duplex in a secure, gated Lekki estate.',
    ownerName: 'Adaeze Okafor',
    ownerVerified: true,
    listedDate: '2026-05-12T00:00:00.000Z',
  },
  {
    id: 'listing_003',
    title: 'Modern 2-Bed Waterfront Duplex',
    propertyType: 'Duplex',
    askingPrice: 71_500_000,
    address: '7 Freedom Way',
    city: 'Lekki',
    state: 'Lagos',
    bedrooms: 2,
    bathrooms: 2,
    propertySize: 180,
    features: ['Waterfront View', 'Balcony', 'Parking'],
    description: 'A cozy waterfront duplex, perfect for a small family or investment.',
    ownerName: 'Segun Alabi',
    ownerVerified: true,
    listedDate: '2026-07-02T00:00:00.000Z',
  },
  {
    id: 'listing_004',
    title: 'Elegant Bungalow in Ikoyi',
    propertyType: 'Bungalow',
    askingPrice: 210_000_000,
    address: '11 Bourdillon Road',
    city: 'Ikoyi',
    state: 'Lagos',
    bedrooms: 5,
    bathrooms: 5,
    propertySize: 460,
    features: ['Swimming Pool', 'Boys Quarters', 'Garden', 'Solar Power', '24/7 Security'],
    description: 'A heritage bungalow on one of Ikoyi’s most prestigious streets.',
    ownerName: 'Chioma Adaobi',
    ownerVerified: false,
    listedDate: '2026-04-20T00:00:00.000Z',
  },
];

export default function BuyerSavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'buyer') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      const storedSaved = localStorage.getItem(SAVED_PROPERTIES_KEY);
      setSavedIds(storedSaved ? JSON.parse(storedSaved) : ['listing_001', 'listing_003']);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const toggleSave = (propertyId: string) => {
    setSavedIds((prev) => {
      const next = prev.filter((id) => id !== propertyId);
      localStorage.setItem(SAVED_PROPERTIES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const savedListings = mockListings.filter((l) => savedIds.includes(l.id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Properties</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {savedListings.length} propert{savedListings.length === 1 ? 'y' : 'ies'} in your
                shortlist
              </p>
            </div>

            {savedListings.length === 0 ? (
              <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#c4a747]/10 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-[#c4a747]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  No saved properties yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Tap the heart icon on any property to save it here for later.
                </p>
                <Button href="/buyer/discover" variant="primary" className="mt-6">
                  Discover Properties
                </Button>
              </div>
            ) : (
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
            )}
          </div>
        </main>
      </div>

      <PropertyDetailModal
        listing={activeListing}
        isSaved
        onClose={() => setActiveListing(null)}
        onToggleSave={() => activeListing && toggleSave(activeListing.id)}
        onRequestViewing={() =>
          activeListing && router.push(`/buyer/viewings?property=${activeListing.id}`)
        }
        onMakeOffer={() =>
          activeListing && router.push(`/buyer/offers?property=${activeListing.id}`)
        }
        onMessageOwner={() =>
          activeListing && router.push(`/buyer/messages?property=${activeListing.id}`)
        }
      />
    </div>
  );
}
