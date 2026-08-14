'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { PropertyListingCard } from '@/components/buyer/discover/PropertyListingCard';
import { PropertyDetailModal } from '@/components/buyer/discover/PropertyDetailModal';
import { Button } from '@/components/ui/Button';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import type { BuyerPropertyListing } from '@/types/buyer';
import { ROUTES } from '@/lib/constants/auth';

export default function BuyerSavedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeListing, setActiveListing] = useState<BuyerPropertyListing | null>(null);

  const { data: savedListings = [], isLoading } = useQuery({
    queryKey: buyerKeys.saved,
    queryFn: () => unwrap(buyerService.listSaved()),
  });

  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => unwrap(buyerService.unsaveListing(listingId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.saved }),
  });

  const toggleSave = (propertyId: string) => {
    unsaveMutation.mutate(propertyId);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Saved Properties</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading
            ? 'Loading…'
            : `${savedListings.length} propert${savedListings.length === 1 ? 'y' : 'ies'} in your shortlist`}
        </p>
      </div>

      {!isLoading && savedListings.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No saved properties yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Tap the heart icon on any property to save it here for later.
          </p>
          <Button href={ROUTES.BUYER_DISCOVER} variant="primary" className="mt-6">
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
          activeListing && router.push(`${ROUTES.BUYER_VIEWINGS}?property=${activeListing.id}`)
        }
        onMakeOffer={() =>
          activeListing && router.push(`${ROUTES.BUYER_OFFERS}?property=${activeListing.id}`)
        }
        onMessageOwner={() =>
          activeListing && router.push(`${ROUTES.BUYER_MESSAGES}?property=${activeListing.id}`)
        }
      />
    </>
  );
}
