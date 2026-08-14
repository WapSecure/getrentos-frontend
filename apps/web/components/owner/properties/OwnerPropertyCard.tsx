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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { formatCurrency } from '@/lib/format';
import type { OwnerProperty, OwnershipVerificationStatus } from '@/types/owner';

const verificationConfig: Record<
  OwnershipVerificationStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  pending_review: {
    label: 'Pending Review',
    icon: ShieldAlert,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  needs_clarification: {
    label: 'Needs Clarification',
    icon: HelpCircle,
    className: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
  rejected: {
    label: 'Rejected',
    icon: ShieldX,
    className: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
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
        {property.hasActiveSaleListing && (
          <div className="absolute top-3 right-10 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-primary bg-accent">
            Listed
          </div>
        )}
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
            <DropdownMenuItem onSelect={() => onDelete?.()} className="text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground truncate">{property.name}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">
            {property.propertyType}
          </span>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          {property.city}, {property.state}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-gray-400">Estimated value</p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(property.estimatedValue, { compact: true })}
            </p>
          </div>
          <p
            className={`text-sm font-semibold ${appreciation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {appreciation >= 0 ? '+' : ''}
            {appreciation.toFixed(1)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
};
