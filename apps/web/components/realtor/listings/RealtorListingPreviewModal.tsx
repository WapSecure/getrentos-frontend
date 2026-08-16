'use client';

import {
  Megaphone,
  MapPin,
  BedDouble,
  Bath,
  User,
  FileEdit,
  ShieldAlert,
  Pause,
  XCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorListingStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
  pending_approval: {
    label: 'Pending Approval',
    icon: ShieldAlert,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  published: {
    label: 'Published',
    icon: Megaphone,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

interface RealtorListingPreviewModalProps {
  listing: RealtorListing | null;
  onClose: () => void;
}

export const RealtorListingPreviewModal = ({
  listing,
  onClose,
}: RealtorListingPreviewModalProps) => {
  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {listing && (
          <>
            <div className="relative h-40 bg-linear-to-br from-secondary to-muted">
              <div className="absolute inset-0 flex items-center justify-center">
                <Megaphone className="w-12 h-12 text-muted-foreground" />
              </div>
              <div
                className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig[listing.status].className}`}
              >
                {statusConfig[listing.status].label}
              </div>
              <div className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary bg-accent">
                {listing.category === 'sale' ? 'For Sale' : 'For Rent'}
              </div>
            </div>

            <div className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Listing preview
              </p>
              <DialogTitle className="text-lg font-semibold text-foreground">
                {listing.title}
              </DialogTitle>
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {listing.city}, {listing.state}
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
