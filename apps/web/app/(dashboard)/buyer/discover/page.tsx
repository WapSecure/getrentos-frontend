'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Building2, ArrowUpDown } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import type { BuyerPropertyListing, ListingPropertyType } from '@/types/buyer';

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

type SortOrder = 'default' | 'price_asc' | 'price_desc';

export default function BuyerDiscoverPage() {
  const router = useRouter();
  const [listings, setListings] = useState<BuyerPropertyListing[]>(mockListings);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [searchParams]);
  const [typeFilter, setTypeFilter] = useState<'all' | ListingPropertyType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  useEffect(() => {
    const storedSaved = localStorage.getItem(SAVED_PROPERTIES_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedIds(storedSaved ? JSON.parse(storedSaved) : []);
  }, []);

  const toggleSave = (propertyId: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      localStorage.setItem(SAVED_PROPERTIES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filteredListings = listings
    .filter((l) => {
      const matchesSearch =
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || l.propertyType === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === 'price_asc') return a.askingPrice - b.askingPrice;
      if (sortOrder === 'price_desc') return b.askingPrice - a.askingPrice;
      return 0;
    });

  const typeFilters: { value: 'all' | ListingPropertyType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Duplex', label: 'Duplex' },
    { value: 'Bungalow', label: 'Bungalow' },
    { value: 'Terrace', label: 'Terrace' },
    { value: 'Land', label: 'Land' },
    { value: 'Commercial', label: 'Commercial' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Discover Properties</h1>
        <p className="text-muted-foreground mt-1">
          {filteredListings.length} propert{filteredListings.length === 1 ? 'y' : 'ies'} for sale
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or city..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() =>
            setSortOrder((s) =>
              s === 'default' ? 'price_asc' : s === 'price_asc' ? 'price_desc' : 'default'
            )
          }
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
            onClick={() => setTypeFilter(option.value)}
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

      {filteredListings.length === 0 ? (
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
          {filteredListings.map((listing, index) => (
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

      <PropertyDetailModal
        listing={activeListing}
        isSaved={activeListing ? savedIds.includes(activeListing.id) : false}
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
