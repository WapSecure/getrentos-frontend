'use client';

import { useState } from 'react';
import {
  Megaphone,
  MapPin,
  PawPrint,
  Sofa,
  CalendarClock,
  Play,
  Pause,
  Eye,
  Zap,
} from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { listingStatusBadges } from '@/lib/statusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Listing } from '@/types/landlord';

const statusConfig = listingStatusBadges;

interface ListingCardProps {
  listing: Listing;
  onTogglePause: (id: string) => void;
  onPreview: (listing: Listing) => void;
  isUpdating?: boolean;
}

export const ListingCard = ({
  listing,
  onTogglePause,
  onPreview,
  isUpdating = false,
}: ListingCardProps) => {
  const status = statusConfig[listing.status];
  // Signed URLs expire and can fail, so fall back to the placeholder rather
  // than showing a broken image.
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(listing.coverImage) && !coverFailed;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-sm">
      <div className="relative h-32 bg-muted">
        {showCover ? (
          // Signed MinIO URLs, so plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.coverImage}
            alt={listing.listingTitle}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/60" />
          </div>
        )}
        {listing.videoTourUrl && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Play className="w-3 h-3" /> Video tour
          </span>
        )}
        <span className="absolute top-3 left-3">
          <Badge
            variant={status.variant}
            icon={status.icon ? <status.icon className="w-3 h-3" /> : undefined}
          >
            {status.label}
          </Badge>
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.listingTitle}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {listing.propertyName} • {listing.unitName}
        </p>

        <p className="text-lg font-bold text-primary mt-3">
          {formatCurrency(listing.askingRent, { compact: true })}
          <span className="text-xs text-muted-foreground font-normal">
            {listing.rentPeriod === 'month' ? '/mo' : '/yr'}
          </span>
        </p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.furnished && (
            <Badge variant="neutral" icon={<Sofa className="w-3 h-3" />}>
              Furnished
            </Badge>
          )}
          {listing.allowPets && (
            <Badge variant="neutral" icon={<PawPrint className="w-3 h-3" />}>
              Pets OK
            </Badge>
          )}
          {listing.shortLetEnabled && <Badge variant="neutral">Short-let</Badge>}
          {listing.allowsMonthlyPayment && (
            <Badge variant="info" icon={<Zap className="w-3 h-3" />}>
              Flex enabled
            </Badge>
          )}
        </div>

        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
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
              isLoading={isUpdating}
            >
              {listing.status === 'paused' ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              {isUpdating ? 'Updating…' : listing.status === 'paused' ? 'Resume' : 'Pause'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};
