'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  DoorOpen,
  MoreVertical,
  Building2,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@getrentos/ui';
import { verificationBadges } from '@/lib/statusBadge';
import { formatCurrency } from '@/lib/format';
import type { Property } from '@/types/landlord';

const propertyTypeLabels: Record<Property['type'], string> = {
  apartment: 'Apartment',
  duplex: 'Duplex',
  condo: 'Condo',
  commercial: 'Commercial',
  shared_apartment: 'Shared Apartment',
};

const verificationConfig = verificationBadges;
interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  onVerify?: () => void;
  delay?: number;
}

export const PropertyCard = ({
  property,
  onClick,
  onEdit,
  onToggleArchive,
  onDelete,
  onVerify,
  delay = 0,
}: PropertyCardProps) => {
  const verification = verificationConfig[property.verificationStatus];
  const vacantUnits = property.totalUnits - property.occupiedUnits;
  const occupancyPct =
    property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0;
  // Cover images are presigned MinIO URLs, so they can expire or fail to load
  // (e.g. a long-open tab): fall back to the placeholder rather than a broken
  // image icon.
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(property.coverImage) && !coverFailed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-40 bg-muted">
        {showCover ? (
          // Signed storage URLs are not in next.config's remotePatterns, so
          // next/image cannot optimise these; the same escape hatch is used by
          // ListingCard and ListingPreviewModal.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverImage}
            alt={property.name}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerify?.();
          }}
          className="absolute top-3 left-3 rounded-full hover:opacity-80 transition-opacity"
          title={verification.label}
        >
          <Badge
            variant={verification.variant}
            icon={verification.icon ? <verification.icon className="w-3 h-3" /> : undefined}
          >
            {verification.label}
          </Badge>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black/70 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onEdit?.()}>
              <Pencil className="w-4 h-4" />
              Edit Property
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleArchive?.()}>
              {property.archived ? (
                <ArchiveRestore className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              {property.archived ? 'Unarchive Property' : 'Archive Property'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete?.()} className="text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {property.archived && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-black/60 text-white">
            Archived
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{property.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">
            {propertyTypeLabels[property.type]}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {property.city}, {property.state}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <DoorOpen className="w-4 h-4 text-muted-foreground/60" />
            {property.occupiedUnits}/{property.totalUnits} occupied
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(property.annualRentRoll, { compact: true })}/yr
          </p>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        {vacantUnits > 0 && (
          <p className="text-xs text-muted-foreground/60 mt-1.5">
            {vacantUnits} unit{vacantUnits === 1 ? '' : 's'} vacant
          </p>
        )}
      </div>
    </motion.div>
  );
};
