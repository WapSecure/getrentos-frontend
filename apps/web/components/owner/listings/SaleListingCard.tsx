'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Megaphone,
  FileEdit,
  ShieldAlert,
  Pause,
  XCircle,
  BedDouble,
  Bath,
  Ruler,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { SaleListing, SaleListingStatus } from '@/types/owner';

const statusConfig: Record<
  SaleListingStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    variant: 'neutral',
  },
  pending_verification: {
    label: 'Pending Verification',
    icon: ShieldAlert,
    variant: 'warning',
  },
  published: {
    label: 'Published',
    icon: Megaphone,
    variant: 'success',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    variant: 'warning',
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    variant: 'danger',
  },
};

interface SaleListingCardProps {
  listing: SaleListing;
  onClick?: () => void;
  delay?: number;
}

export const SaleListingCard = ({ listing, onClick, delay = 0 }: SaleListingCardProps) => {
  const status = statusConfig[listing.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-ring"
    >
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          aria-label={listing.listingTitle}
          className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
        />
      )}
      <div className="relative h-40 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-muted-foreground/60" />
        </div>
        <Badge
          variant={status.variant}
          icon={<StatusIcon className="w-3 h-3" />}
          className="absolute top-3 left-3"
        >
          {status.label}
        </Badge>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.listingTitle}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.propertyName}
        </p>

        <p className="text-lg font-bold text-primary mt-3">
          {formatCurrency(listing.askingPrice, { compact: true })}
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
          {listing.propertySize !== undefined && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              {listing.propertySize} sqm
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
