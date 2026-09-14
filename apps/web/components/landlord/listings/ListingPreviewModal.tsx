'use client';

import { useState } from 'react';
import { Megaphone, MapPin, PawPrint, Sofa, CalendarClock, Check, Zap, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Listing } from '@/types/landlord';

interface ListingPreviewModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export const ListingPreviewModal = ({ listing, onClose }: ListingPreviewModalProps) => (
  <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      {/* Keyed so the photo/video viewer starts fresh for each listing. */}
      {listing && <ListingPreview key={listing.id} listing={listing} />}
    </DialogContent>
  </Dialog>
);

const ListingPreview = ({ listing }: { listing: Listing }) => {
  const gallery = listing.galleryImages?.length
    ? listing.galleryImages
    : listing.coverImage
      ? [listing.coverImage]
      : [];
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [showVideo, setShowVideo] = useState(false);

  const currentImage = gallery[active];

  return (
    <>
      <div className="relative h-52 bg-linear-to-br from-secondary to-muted">
        {showVideo && listing.videoTourUrl ? (
          <video
            className="absolute inset-0 h-full w-full bg-black object-contain"
            src={listing.videoTourUrl}
            controls
            autoPlay
            playsInline
          />
        ) : currentImage && !failed[active] ? (
          // Signed MinIO URLs, so plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage}
            alt={`${listing.listingTitle} — photo ${active + 1}`}
            onError={() => setFailed((prev) => ({ ...prev, [active]: true }))}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
        )}

        {listing.videoTourUrl && (
          <button
            type="button"
            onClick={() => setShowVideo((v) => !v)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/80"
          >
            <Play className="w-3.5 h-3.5" />
            {showVideo ? 'Show photos' : 'Play video tour'}
          </button>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3">
          {gallery.map((url, index) => (
            <button
              key={`${url.slice(-24)}-${index}`}
              type="button"
              onClick={() => {
                setActive(index);
                setShowVideo(false);
              }}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active && !showVideo}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === active && !showVideo ? 'border-primary' : 'border-transparent'
              }`}
            >
              {failed[index] ? (
                <span className="flex h-full w-full items-center justify-center bg-secondary">
                  <Megaphone className="h-4 w-4 text-gray-400" />
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  onError={() => setFailed((prev) => ({ ...prev, [index]: true }))}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          Renter-facing preview
        </p>
        <DialogTitle className="text-lg font-semibold text-foreground">
          {listing.listingTitle}
        </DialogTitle>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.propertyName} • {listing.unitName}
        </p>

        <p className="text-2xl font-bold text-primary mt-3">
          {formatCurrency(listing.monthlyRent, { compact: true })}
          <span className="text-sm text-muted-foreground font-normal">
            {listing.rentPeriod === 'month' ? '/mo' : '/yr'}
          </span>
        </p>
        {listing.securityDeposit !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Security deposit: {formatCurrency(listing.securityDeposit, { compact: true })}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.furnished && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              <Sofa className="w-3 h-3" /> Furnished
            </span>
          )}
          {listing.allowPets && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              <PawPrint className="w-3 h-3" /> Pets OK
            </span>
          )}
          {listing.shortLetEnabled && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
              Short-let
            </span>
          )}
          {listing.allowsMonthlyPayment && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent text-primary">
              <Zap className="w-3 h-3" /> Flex enabled
            </span>
          )}
        </div>

        {listing.amenities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-foreground mb-2">Amenities</p>
            <div className="grid grid-cols-2 gap-1.5">
              {listing.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Check className="w-3 h-3 text-primary shrink-0" />
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
          <CalendarClock className="w-3 h-3" />
          Available {formatDate(listing.availabilityDate)}
        </p>
      </div>
    </>
  );
};
