'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  HelpCircle,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  type BadgeVariant,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { ReferenceCodeChip } from '@/components/shared/property/ReferenceCodeChip';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';

const verificationConfig: Record<
  OwnershipVerificationStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    variant: 'success',
  },
  pending_review: {
    label: 'Pending Review',
    icon: ShieldAlert,
    variant: 'warning',
  },
  needs_clarification: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    variant: 'warning',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    variant: 'danger',
  },
};

interface OwnerPropertyCardProps {
  property: OwnerProperty;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  delay?: number;
}

export const OwnerPropertyCard = ({
  property,
  onClick,
  onEdit,
  onDelete,
  delay = 0,
}: OwnerPropertyCardProps) => {
  const verification = verificationConfig[property.verificationStatus];
  const VerificationIcon = verification.icon;
  const purchasePrice = property.purchasePrice ?? 0;
  const appreciation =
    purchasePrice > 0 ? ((property.estimatedValue - purchasePrice) / purchasePrice) * 100 : 0;

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
          aria-label={`Open ${property.name}`}
          className="absolute inset-0 rounded-2xl focus:outline-none"
        />
      )}
      <div className="relative h-40 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-12 h-12 text-muted-foreground/60" />
        </div>
        <Badge
          variant={verification.variant}
          icon={<VerificationIcon className="w-3 h-3" />}
          className="absolute top-3 left-3"
        >
          {verification.label}
        </Badge>
        {property.hasActiveSaleListing && (
          <div className="absolute top-3 right-10 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary bg-accent">
            Listed
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`More actions for ${property.name}`}
              title="More actions"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 right-3 z-10 rounded-lg bg-card/90 p-1.5 backdrop-blur-sm transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreVertical className="w-4 h-4 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={() => onEdit?.()}>
              <Pencil className="w-4 h-4" />
              Edit Property
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDelete?.()} className="text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{property.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">
            {property.propertyType}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {property.city}, {property.state}
        </p>
        {property.referenceCode && (
          <div className="relative z-10 mt-2 w-fit">
            <ReferenceCodeChip code={property.referenceCode} />
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Estimated value</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(property.estimatedValue, { compact: true })}
            </p>
          </div>
          <p
            className={`text-sm font-semibold ${appreciation >= 0 ? 'text-success' : 'text-destructive'}`}
          >
            {appreciation >= 0 ? '+' : ''}
            {appreciation.toFixed(1)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};
