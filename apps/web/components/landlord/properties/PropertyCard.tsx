'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  DoorOpen,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  MoreVertical,
  Building2,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { formatCurrency } from '@/lib/format';
import type { Property } from '@/types/landlord';

const propertyTypeLabels: Record<Property['type'], string> = {
  apartment: 'Apartment',
  duplex: 'Duplex',
  condo: 'Condo',
  commercial: 'Commercial',
  shared_apartment: 'Shared Apartment',
};

const verificationConfig: Record<
  Property['verificationStatus'],
  { label: string; icon: React.ElementType; className: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending: {
    label: 'Pending Review',
    icon: ShieldAlert,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  unverified: {
    label: 'Unverified',
    icon: ShieldAlert,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
};

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  onEdit?: () => void;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  delay?: number;
}

export const PropertyCard = ({
  property,
  onClick,
  onEdit,
  onToggleArchive,
  onDelete,
  delay = 0,
}: PropertyCardProps) => {
  const verification = verificationConfig[property.verificationStatus];
  const VerificationIcon = verification.icon;
  const vacantUnits = property.totalUnits - property.occupiedUnits;
  const occupancyPct =
    property.totalUnits > 0 ? Math.round((property.occupiedUnits / property.totalUnits) * 100) : 0;

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
          <Building2 className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>
        <div
          className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${verification.className}`}
        >
          <VerificationIcon className="w-3 h-3" />
          {verification.label}
        </div>
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
            <DoorOpen className="w-4 h-4 text-gray-400" />
            {property.occupiedUnits}/{property.totalUnits} occupied
          </div>
          <p className="text-sm font-semibold text-primary">
            {formatCurrency(property.monthlyRevenue, { compact: true })}/mo
          </p>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        {vacantUnits > 0 && (
          <p className="text-xs text-gray-400 mt-1.5">
            {vacantUnits} unit{vacantUnits === 1 ? '' : 's'} vacant
          </p>
        )}
      </div>
    </motion.div>
  );
};
