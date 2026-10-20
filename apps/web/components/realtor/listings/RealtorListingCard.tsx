'use client';

import {
  MapPin,
  Megaphone,
  FileEdit,
  ShieldAlert,
  Pause,
  XCircle,
  BedDouble,
  Bath,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { RealtorListing, RealtorListingStatus } from '@/types/realtor';

const statusConfig: Record<
  RealtorListingStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  draft: { label: 'Draft', icon: FileEdit, variant: 'neutral' },
  pending_approval: { label: 'Pending Approval', icon: ShieldAlert, variant: 'warning' },
  published: { label: 'Published', icon: Megaphone, variant: 'success' },
  paused: { label: 'Paused', icon: Pause, variant: 'warning' },
  closed: { label: 'Closed', icon: XCircle, variant: 'danger' },
};

interface RealtorListingCardProps {
  listing: RealtorListing;
  onClick?: () => void;
}

export const RealtorListingCard = ({ listing, onClick }: RealtorListingCardProps) => {
  const status = statusConfig[listing.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-border bg-card text-left shadow-xs transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-40 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-muted-foreground" />
        </div>
        <Badge
          variant={status.variant}
          icon={<StatusIcon className="w-3 h-3" />}
          className="absolute top-3 left-3"
        >
          {status.label}
        </Badge>
        <div className="absolute top-3 right-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary bg-accent">
          {listing.category === 'sale' ? 'For Sale' : 'For Rent'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.city}, {listing.state}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Client: {listing.clientName}</p>

        <p className="text-lg font-bold text-primary mt-3">
          {formatCurrency(listing.price, { compact: true })}
          {listing.category === 'rental' ? '/yr' : ''}
        </p>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          {listing.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" />
              {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              {listing.bathrooms}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
