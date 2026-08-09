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
import { formatCurrency } from '@/lib/format';
import type { SaleListing, SaleListingStatus } from '@/types/owner';

const statusConfig: Record<
  SaleListingStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
  pending_verification: {
    label: 'Pending Verification',
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
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-40 bg-linear-to-br from-secondary to-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>
        <div
          className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </div>
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
