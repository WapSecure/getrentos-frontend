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
  ImageOff,
} from '@sureground/icons';
import { Badge, Button, Dialog, DialogContent, DialogTitle, IconButton } from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerPropertyListing } from '@/types/buyer';
import { DiligenceChecklist } from './DiligenceChecklist';

interface PropertyDetailModalProps {
  listing: BuyerPropertyListing | null;
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: () => void;
  onRequestViewing: () => void;
  onMakeOffer: () => void;
  onMessageOwner: () => void;
  openOffer?: { id: string; offerAmount: number; status: string } | null;
  onViewOffer?: (offerId: string) => void;
}

export const PropertyDetailModal = ({
  listing,
  isSaved,
  onClose,
  onToggleSave,
  onRequestViewing,
  onMakeOffer,
  onMessageOwner,
  openOffer = null,
  onViewOffer,
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
        <div className="relative aspect-[16/9] max-h-64 w-full shrink-0 bg-muted">
          {listing.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived storage URL
            <img
              src={listing.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <ImageOff className="h-6 w-6" aria-hidden="true" />
              <span className="text-xs">No photo yet</span>
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
          <div className="data-value absolute bottom-3 left-4 rounded-lg bg-primary px-3 py-1.5 text-lg font-semibold text-primary-foreground shadow-sm">
            {formatCurrency(listing.askingPrice)}
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={listing.acceptingOffers === false ? 'neutral' : 'primary'}>
                {listing.acceptingOffers === false ? 'Under offer' : 'For sale'}
              </Badge>
              {listing.ownerVerified && (
                <Badge variant="success" icon={<ShieldCheck className="h-3 w-3" />}>
                  Verified owner
                </Badge>
              )}
            </div>
            <DialogTitle className="font-display text-2xl font-normal leading-tight tracking-[-0.01em] text-foreground">
              {listing.title}
            </DialogTitle>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {[listing.address, listing.city, listing.state].filter(Boolean).join(', ')}
            </p>
            {listing.addressHidden && (
              <p className="mt-1 text-xs text-muted-foreground">
                The exact address is shared once the property is verified.
              </p>
            )}
          </div>

          {(listing.bedrooms !== undefined ||
            listing.bathrooms !== undefined ||
            listing.propertySize !== undefined) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground">
              {listing.bedrooms !== undefined && (
                <span className="flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-primary" aria-hidden="true" />
                  {listing.bedrooms} beds
                </span>
              )}
              {listing.bathrooms !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-primary" aria-hidden="true" />
                  {listing.bathrooms} baths
                </span>
              )}
              {listing.propertySize !== undefined && (
                <span className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-primary" aria-hidden="true" />
                  {listing.propertySize} sqm
                </span>
              )}
            </div>
          )}

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
                  Filmed on site in the Sureground app
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

          <DiligenceChecklist listingId={listing.id} />

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Listed by</p>
              <p className="text-sm font-medium text-foreground">{listing.ownerName}</p>
            </div>
            {listing.ownerVerified && (
              <Badge variant="success" icon={<ShieldCheck className="w-3 h-3" />}>
                Verified
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Listed {formatDate(listing.listedDate)}</p>
        </div>

        {openOffer && (
          <p className="px-4 pt-3 text-xs text-muted-foreground" role="status">
            {openOffer.status === 'countered'
              ? `Your offer of ${formatCurrency(openOffer.offerAmount)} has a counter waiting.`
              : `You offered ${formatCurrency(openOffer.offerAmount)}. Waiting for the seller.`}
          </p>
        )}
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
            Request viewing
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Handshake className="w-3.5 h-3.5" />}
            onClick={() => (openOffer && onViewOffer ? onViewOffer(openOffer.id) : onMakeOffer())}
            disabled={!openOffer && listing?.acceptingOffers === false}
          >
            {openOffer
              ? 'View your offer'
              : listing?.acceptingOffers === false
                ? 'Under offer'
                : 'Make an offer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
