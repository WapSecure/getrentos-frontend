'use client';

import { formatLocation } from '@sureground/shared';
import { useState, type ReactNode } from 'react';
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
      <DialogContent size="xl" padded={false} showClose={false} className="lg:max-w-5xl">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Listing record */}
          <div className="min-w-0 lg:max-h-[88dvh] lg:overflow-y-auto lg:overscroll-contain">
            <div className="relative aspect-[16/9] max-h-80 w-full bg-muted">
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
              <div className="data-value absolute bottom-3 left-4 rounded-lg bg-primary px-3 py-1.5 text-lg font-semibold text-primary-foreground shadow-sm lg:hidden">
                {formatCurrency(listing.askingPrice)}
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
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
                <DialogTitle className="font-display text-2xl font-normal leading-tight tracking-[-0.01em] text-foreground sm:text-3xl">
                  {listing.title}
                </DialogTitle>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {formatLocation(listing.address, listing.city, listing.state)}
                </p>
                {listing.addressHidden && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    The exact address is shared once the property is verified.
                  </p>
                )}
              </div>

              {(listing.bedrooms !== undefined ||
                listing.bathrooms !== undefined ||
                listing.propertySize !== undefined) && (
                <dl className="grid grid-cols-3 gap-3">
                  {listing.bedrooms !== undefined && (
                    <Fact
                      icon={<BedDouble className="h-4 w-4 text-primary" aria-hidden="true" />}
                      label="Bedrooms"
                      value={String(listing.bedrooms)}
                    />
                  )}
                  {listing.bathrooms !== undefined && (
                    <Fact
                      icon={<Bath className="h-4 w-4 text-primary" aria-hidden="true" />}
                      label="Bathrooms"
                      value={String(listing.bathrooms)}
                    />
                  )}
                  {listing.propertySize !== undefined && (
                    <Fact
                      icon={<Ruler className="h-4 w-4 text-primary" aria-hidden="true" />}
                      label="Size"
                      value={`${listing.propertySize} sqm`}
                    />
                  )}
                </dl>
              )}

              <p className="max-w-prose text-sm leading-6 text-foreground/80 sm:text-base sm:leading-7">
                {listing.description}
              </p>

              {listing.videoTourUrl && (
                <div className="rounded-xl border border-border p-4 space-y-2">
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
                  <p className="text-sm font-semibold text-foreground mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-sm px-3 py-1 rounded-full bg-secondary text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <DiligenceChecklist listingId={listing.id} />
            </div>
          </div>

          {/* Price, seller and actions */}
          <aside className="flex flex-col gap-5 border-t border-border bg-secondary/40 p-5 sm:p-7 lg:max-h-[88dvh] lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-t-0">
            <div className="hidden lg:block">
              <p className="text-sm text-muted-foreground">Asking price</p>
              <p className="data-value mt-1 text-3xl font-semibold tracking-tight text-foreground">
                {formatCurrency(listing.askingPrice)}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Listed by</p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {listing.ownerName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Listed {formatDate(listing.listedDate)}
                </p>
              </div>
              {listing.ownerVerified && (
                <Badge variant="success" icon={<ShieldCheck className="w-3 h-3" />}>
                  Verified
                </Badge>
              )}
            </div>

            {openOffer && (
              <p className="text-sm text-muted-foreground" role="status">
                {openOffer.status === 'countered'
                  ? `Your offer of ${formatCurrency(openOffer.offerAmount)} has a counter waiting.`
                  : `You offered ${formatCurrency(openOffer.offerAmount)}. Waiting for the seller.`}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
              <Button
                variant="outline"
                icon={<MessageSquare className="w-4 h-4" />}
                onClick={onMessageOwner}
              >
                Message
              </Button>
              <Button
                variant="outline"
                icon={<CalendarClock className="w-4 h-4" />}
                onClick={onRequestViewing}
              >
                Request viewing
              </Button>
              <Button
                variant="primary"
                icon={<Handshake className="w-4 h-4" />}
                onClick={() =>
                  openOffer && onViewOffer ? onViewOffer(openOffer.id) : onMakeOffer()
                }
                disabled={!openOffer && listing?.acceptingOffers === false}
              >
                {openOffer
                  ? 'View your offer'
                  : listing?.acceptingOffers === false
                    ? 'Under offer'
                    : 'Make an offer'}
              </Button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Fact = ({ icon, label, value }: { icon: ReactNode; label: string; value: string }) => (
  <div className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-border/60">
    <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      {icon}
      {label}
    </dt>
    <dd className="data-value mt-1 text-sm font-semibold text-foreground sm:text-base">{value}</dd>
  </div>
);
