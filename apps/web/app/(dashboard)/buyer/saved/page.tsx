'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import { Button } from '@/components/ui/Button';
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
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  useEffect(() => {
    const storedSaved = localStorage.getItem(SAVED_PROPERTIES_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedIds(storedSaved ? JSON.parse(storedSaved) : ['listing_001', 'listing_003']);
  }, []);

  const toggleSave = (propertyId: string) => {
    setSavedIds((prev) => {
      const next = prev.filter((id) => id !== propertyId);
      localStorage.setItem(SAVED_PROPERTIES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const savedListings = mockListings.filter((l) => savedIds.includes(l.id));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
        <p className="text-muted-foreground mt-1">
          {savedListings.length} propert{savedListings.length === 1 ? 'y' : 'ies'} in your shortlist
        </p>
      </div>

      {savedListings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No saved properties yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
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
    </>
  );
}
