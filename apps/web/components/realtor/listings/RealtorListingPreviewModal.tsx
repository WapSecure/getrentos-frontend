'use client';

import { formatLocation } from '@sureground/shared';
import {
  Megaphone,
  MapPin,
  BedDouble,
  Bath,
  Building2,
  User,
  FileEdit,
  ShieldAlert,
  Pause,
  XCircle,
} from '@sureground/icons';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  type BadgeVariant,
} from '@sureground/ui';
import { isCommercialType } from '@/types/landlord';
import { formatCurrency } from '@/lib/format';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorListingStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  draft: { label: 'Draft', icon: FileEdit, variant: 'neutral' },
  pending_approval: { label: 'Pending approval', icon: ShieldAlert, variant: 'warning' },
  published: { label: 'Published', icon: Megaphone, variant: 'success' },
  paused: { label: 'Paused', icon: Pause, variant: 'warning' },
  closed: { label: 'Closed', icon: XCircle, variant: 'danger' },
};

interface RealtorListingPreviewModalProps {
  listing: RealtorListing | null;
  onClose: () => void;
  /** Commercial properties only: opens the commercial details editor. */
  onEditCommercial?: (listing: RealtorListing) => void;
}

export const RealtorListingPreviewModal = ({
  listing,
  onClose,
  onEditCommercial,
}: RealtorListingPreviewModalProps) => {
  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0">
        {listing && (
          <>
            <div className="relative h-40 bg-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <Megaphone className="w-12 h-12 text-muted-foreground" />
              </div>
              <Badge
                variant={statusConfig[listing.status].variant}
                className="absolute top-3 left-3"
              >
                {statusConfig[listing.status].label}
              </Badge>
              <div className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary bg-accent">
                {listing.category === 'sale' ? 'For sale' : 'For rent'}
              </div>
            </div>

            <div className="p-4">
              <p className="text-2xs uppercase tracking-wide text-muted-foreground mb-1">
                Listing preview
              </p>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {listing.title}
              </DialogTitle>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {formatLocation(listing.city, listing.state)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <User className="w-3 h-3" />
                Client: {listing.clientName}
              </p>

              <p className="text-2xl font-bold text-primary mt-3">
                {formatCurrency(listing.price, { compact: true })}
                <span className="text-sm text-muted-foreground font-normal">
                  {listing.category === 'rental' ? '/yr' : ''}
                </span>
              </p>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
                {listing.bedrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4" />
                    {listing.bedrooms} beds
                  </span>
                )}
                {listing.bathrooms !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4" />
                    {listing.bathrooms} baths
                  </span>
                )}
                <span className="capitalize">{listing.propertyType}</span>
              </div>
              {listing.status === 'draft' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Waiting for your client to publish it from their Listings page.
                </p>
              )}
              {onEditCommercial && isCommercialType(listing.propertyType) && (
                <Button
                  variant="outline"
                  fullWidth
                  className="mt-4"
                  onClick={() => onEditCommercial(listing)}
                  icon={<Building2 className="h-4 w-4" />}
                >
                  {listing.commercial ? 'Edit commercial details' : 'Add commercial details'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
