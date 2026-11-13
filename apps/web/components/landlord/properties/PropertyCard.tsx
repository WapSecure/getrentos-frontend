'use client';

import { formatLocation } from '@sureground/shared';
import { useState } from 'react';
import {
  MapPin,
  DoorOpen,
  MoreVertical,
  Building2,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from '@sureground/icons';
import {
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
} from '@sureground/ui';
import { propertyRentSummary, type PropertyRentSummary } from '@sureground/shared';
import { verificationBadges } from '@/lib/statusBadge';
import { formatCurrency } from '@/lib/format';
import { ReferenceCodeChip } from '@/components/shared/property/ReferenceCodeChip';
import type { Property } from '@/types/landlord';

const propertyTypeLabels: Record<Property['type'], string> = {
  apartment: 'Apartment',
  duplex: 'Duplex',
  condo: 'Condo',
  commercial: 'Commercial',
  shared_apartment: 'Shared apartment',
};

const verificationConfig = verificationBadges;

/** "₦3M/yr" once let; the asking rent while vacant; never "₦0/yr", which read as zero rent. */
function rentText(rent: PropertyRentSummary): string {
  if (rent.kind === 'none') return rent.label;
  const figure = `${formatCurrency(rent.amount, { compact: true })}/${rent.period === 'month' ? 'mo' : 'yr'}`;
  if (rent.kind === 'let') return figure;
  return rent.from ? `From ${figure}` : `Asking ${figure}`;
}

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
}: PropertyCardProps) => {
  const verification = verificationConfig[property.verificationStatus];
  const rent = propertyRentSummary(property);
  const vacantUnits = property.totalUnits - property.occupiedUnits;
  const occupancyPct =
    property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0;
  // Presigned URLs can expire in a long-open tab, so fall back to the placeholder.
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(property.coverImage) && !coverFailed;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-primary/30 hover:shadow-md">
      <div className={`relative bg-muted ${showCover ? 'aspect-[16/10]' : 'h-24'}`}>
        {showCover ? (
          // Signed storage URLs aren't in next.config's remotePatterns, so next/image can't optimise them.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.coverImage}
            alt={property.name}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" aria-hidden />
            No cover photo yet
          </div>
        )}
        <button
          type="button"
          aria-label={`Verification: ${verification.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onVerify?.();
          }}
          className="absolute top-3 left-3 z-10 rounded-full hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <IconButton
              label={`More actions for ${property.name}`}
              title="More actions"
              size="sm"
              icon={<MoreVertical />}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 z-10 bg-card text-foreground hover:bg-secondary"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onEdit?.()}>
              <Pencil className="w-4 h-4" />
              Edit property
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleArchive?.()}>
              {property.archived ? (
                <ArchiveRestore className="w-4 h-4" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
              {property.archived ? 'Unarchive property' : 'Archive property'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete?.()} className="text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {property.archived && (
          <span className="absolute bottom-3 left-3">
            <Badge variant="neutral">Archived</Badge>
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-semibold text-foreground">
            {onClick ? (
              <button
                type="button"
                onClick={onClick}
                className="text-left transition-colors group-hover:text-primary after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:ring-inset"
              >
                {property.name}
              </button>
            ) : (
              property.name
            )}
          </h3>
          <Badge variant="neutral" className="shrink-0">
            {propertyTypeLabels[property.type]}
          </Badge>
        </div>
        <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          {formatLocation(property.city, property.state)}
        </p>
        {property.referenceCode && (
          <div className="relative z-10 mt-3 w-fit">
            <ReferenceCodeChip code={property.referenceCode} />
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <DoorOpen className="w-4 h-4 text-primary/70" aria-hidden="true" />
            {property.occupiedUnits}/{property.totalUnits} occupied
          </div>
          <p
            className={
              rent.kind === 'none'
                ? 'text-sm text-muted-foreground'
                : 'data-value text-base font-semibold text-foreground'
            }
          >
            {rentText(rent)}
          </p>
        </div>

        <div
          className="mt-3 h-1.5 rounded-full bg-primary/10 overflow-hidden"
          role="progressbar"
          aria-label="Occupancy"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={occupancyPct}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        {vacantUnits > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {vacantUnits} unit{vacantUnits === 1 ? '' : 's'} vacant
          </p>
        )}
      </div>
    </div>
  );
};
