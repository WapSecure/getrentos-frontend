'use client';

import { useState } from 'react';
import {
  X,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ShieldCheck,
  Heart,
  CalendarClock,
  Handshake,
  MessageSquare,
  PlayCircle,
} from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerPropertyListing } from '@/types/buyer';

interface PropertyDetailModalProps {
  listing: BuyerPropertyListing | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onRequestViewing: () => void;
  onMakeOffer: () => void;
  onMessageOwner: () => void;
}

export const PropertyDetailModal = ({
  listing,
  isSaved,
  onClose,
  onToggleSave,
  onRequestViewing,
  onMakeOffer,
  onMessageOwner,
}: PropertyDetailModalProps) => {
  const [watching, setWatching] = useState(false);
  if (!listing) return null;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        padded={false}
        showClose={false}
        className="flex flex-col overflow-hidden sm:max-w-lg"
      >
        <div className="relative h-48 bg-muted shrink-0">
          {listing.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage URL
            <img
              src={listing.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">🏠</span>
            </div>
          )}
          <IconButton
            label="Close"
            size="sm"
            icon={<X />}
            onClick={onClose}
            className="absolute top-3 right-3 bg-card/90 text-foreground backdrop-blur-sm hover:bg-card"
          />
          <IconButton
            label={isSaved ? 'Remove from saved' : 'Save property'}
            aria-pressed={isSaved}
            size="sm"
            icon={
              <Heart
                className={isSaved ? 'text-destructive fill-destructive' : 'text-foreground'}
              />
            }
            onClick={onToggleSave}
            className="absolute top-3 right-14 bg-card/90 backdrop-blur-sm hover:bg-card"
          />
          <div className="absolute bottom-3 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-lg font-bold">
            {formatCurrency(listing.askingPrice)}
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {listing.title}
            </DialogTitle>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {[listing.address, listing.city, listing.state].filter(Boolean).join(', ')}
            </p>
            {listing.addressHidden && (
              <p className="mt-1 text-xs text-muted-foreground">
                The exact address is shared once the property is verified.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {listing.bedrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-muted-foreground" />
                {listing.bedrooms} beds
              </span>
            )}
            {listing.bathrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-muted-foreground" />
                {listing.bathrooms} baths
              </span>
            )}
            {listing.propertySize !== undefined && (
              <span className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                {listing.propertySize} sqm
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{listing.description}</p>

          {listing.videoTourUrl && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              {watching ? (
                <video
                  src={listing.videoTourUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full rounded-md bg-black"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setWatching(true)}
                  className="flex w-full items-center gap-2 text-left text-sm font-medium text-foreground"
                >
                  <PlayCircle className="w-5 h-5 text-primary" />
                  Watch the video tour
                </button>
              )}
              {listing.videoTourFilmedOnSite && (
                <p className="flex items-center gap-1 text-xs font-medium text-success">
                  <MapPin className="w-3 h-3" aria-hidden />
                  Filmed on site in the GetRentos app
                </p>
              )}
            </div>
          )}

          {listing.features.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Features</p>
              <div className="flex flex-wrap gap-2">
                {listing.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Listed by</p>
              <p className="text-sm font-medium text-foreground">{listing.ownerName}</p>
            </div>
            {listing.ownerVerified && (
              <Badge variant="success" icon={<ShieldCheck className="w-3 h-3" />}>
                Verified
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Listed {formatDate(listing.listedDate)}
          </p>
        </div>

        <div className="p-4 border-t border-border grid grid-cols-3 gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            onClick={onMessageOwner}
          >
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<CalendarClock className="w-3.5 h-3.5" />}
            onClick={onRequestViewing}
          >
            View
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Handshake className="w-3.5 h-3.5" />}
            onClick={onMakeOffer}
            disabled={listing?.acceptingOffers === false}
          >
            {listing?.acceptingOffers === false ? 'Under offer' : 'Offer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
