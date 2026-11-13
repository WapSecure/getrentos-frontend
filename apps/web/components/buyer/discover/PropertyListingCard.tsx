'use client';

import { formatLocation } from '@sureground/shared';
import { Heart, ShieldCheck } from '@sureground/icons';
import { Badge, ListingCard, ListingCardAction } from '@sureground/ui';
import type { BuyerPropertyListing } from '@/types/buyer';

interface PropertyListingCardProps {
  listing: BuyerPropertyListing;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
  eager?: boolean;
}

export const PropertyListingCard = ({
  listing,
  isSaved,
  onToggleSave,
  onViewDetails,
  eager,
}: PropertyListingCardProps) => (
  <ListingCard
    onOpen={onViewDetails}
    title={listing.title}
    location={formatLocation(listing.city, listing.state)}
    price={listing.askingPrice}
    priceCompact
    image={listing.image}
    imageAlt={listing.title}
    eager={eager}
    status={listing.acceptingOffers === false ? 'Under offer' : 'For sale'}
    badges={
      listing.ownerVerified ? (
        <Badge variant="success" icon={<ShieldCheck className="h-3 w-3" />}>
          Verified owner
        </Badge>
      ) : undefined
    }
    facts={{
      beds: listing.bedrooms,
      baths: listing.bathrooms,
      size: listing.propertySize,
      type: listing.propertyType,
    }}
    actions={
      <ListingCardAction
        label={isSaved ? 'Remove from saved' : 'Save property'}
        aria-pressed={isSaved}
        icon={<Heart fill={isSaved ? 'currentColor' : 'none'} />}
        onClick={onToggleSave}
      />
    }
  />
);
