'use client';

import { Megaphone, MapPin, PawPrint, Sofa, CalendarClock, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Listing } from '@/types/landlord';

interface ListingPreviewModalProps {
  listing: Listing | null;
  onClose: () => void;
}

export const ListingPreviewModal = ({ listing, onClose }: ListingPreviewModalProps) => {
  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {listing && (
          <>
            <div className="relative h-40 bg-linear-to-br from-secondary to-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-600" />
              </div>
            </div>

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
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
