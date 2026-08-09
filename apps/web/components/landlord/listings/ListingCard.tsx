'use client';

import { motion } from 'framer-motion';
import { Megaphone, MapPin, PawPrint, Sofa, CalendarClock, Play, Pause, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Listing, ListingStatus } from '@/types/landlord';

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
  pending_verification: {
    label: 'Pending Verification',
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  published: {
    label: 'Published',
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  paused: {
    label: 'Paused',
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  closed: {
    label: 'Closed',
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

interface ListingCardProps {
  listing: Listing;
  delay?: number;
  onTogglePause: (id: string) => void;
  onPreview: (listing: Listing) => void;
}

export const ListingCard = ({ listing, delay = 0, onTogglePause, onPreview }: ListingCardProps) => {
  const status = statusConfig[listing.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <div className="relative h-32 bg-linear-to-br from-secondary to-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Megaphone className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        </div>
        <span
          className={`absolute top-3 left-3 inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.listingTitle}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.propertyName} • {listing.unitName}
        </p>

        <p className="text-lg font-bold text-primary mt-3">
          {formatCurrency(listing.monthlyRent, { compact: true })}
          <span className="text-xs text-gray-400 font-normal">/mo</span>
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.furnished && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <Sofa className="w-3 h-3" /> Furnished
            </span>
          )}
          {listing.allowPets && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              <PawPrint className="w-3 h-3" /> Pets OK
            </span>
          )}
          {listing.shortLetEnabled && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              Short-let
            </span>
          )}
        </div>

        <p className="flex items-center gap-1 text-xs text-gray-400 mt-3">
          <CalendarClock className="w-3 h-3" />
          Available {formatDate(listing.availabilityDate)}
        </p>

        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => onPreview(listing)}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </Button>
          {(listing.status === 'published' || listing.status === 'paused') && (
            <Button
              variant={listing.status === 'paused' ? 'primary' : 'outline'}
              size="sm"
              fullWidth
              className="gap-1.5"
              onClick={() => onTogglePause(listing.id)}
            >
              {listing.status === 'paused' ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              {listing.status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
