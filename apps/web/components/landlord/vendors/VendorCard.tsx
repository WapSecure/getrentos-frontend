'use client';

import { motion } from 'framer-motion';
import { CalendarClock, Pencil, Phone, Power, Trash2 } from 'lucide-react';
import { Badge, IconButton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import type { Vendor } from '@/types/landlord';

export const formatVisit = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

interface VendorCardProps {
  vendor: Vendor;
  delay?: number;
  onOpen: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onToggleActive: (vendor: Vendor) => void;
  onRemove: (id: string) => void;
}

export const VendorCard = ({
  vendor,
  delay = 0,
  onOpen,
  onEdit,
  onToggleActive,
  onRemove,
}: VendorCardProps) => {
  const stats = [
    { label: 'Jobs done', value: String(vendor.jobsCompleted) },
    { label: 'Open', value: String(vendor.openJobs) },
    { label: 'Total spend', value: formatCurrency(vendor.totalSpend, { compact: true }) },
    {
      label: 'Avg per job',
      value:
        vendor.averageCost === null ? '—' : formatCurrency(vendor.averageCost, { compact: true }),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-card rounded-2xl border border-border p-4 ${vendor.isActive ? '' : 'opacity-70'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(vendor)}
          className="min-w-0 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="font-semibold text-foreground truncate hover:underline">{vendor.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vendor.serviceType}
            {!vendor.isActive && (
              <Badge variant="neutral" className="ml-2">
                Inactive
              </Badge>
            )}
          </p>
        </button>
        <div className="flex shrink-0 items-center">
          <IconButton
            label={`Edit ${vendor.name}`}
            title="Edit vendor"
            size="sm"
            icon={<Pencil />}
            onClick={() => onEdit(vendor)}
          />
          <IconButton
            label={`${vendor.isActive ? 'Deactivate' : 'Reactivate'} ${vendor.name}`}
            title={vendor.isActive ? 'Deactivate vendor' : 'Reactivate vendor'}
            size="sm"
            icon={<Power />}
            onClick={() => onToggleActive(vendor)}
          />
          <IconButton
            label={`Remove ${vendor.name}`}
            title="Remove vendor"
            variant="danger"
            size="sm"
            icon={<Trash2 />}
            onClick={() => onRemove(vendor.id)}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        {vendor.ratingCount > 0 ? (
          <>
            <StarRating value={vendor.rating} label={`${vendor.name} rating`} />
            <span className="font-medium text-foreground">{vendor.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({vendor.ratingCount} rating{vendor.ratingCount === 1 ? '' : 's'})
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No ratings yet</span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 tabular-nums">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dd className="text-sm font-semibold text-foreground">{stat.value}</dd>
            <dt className="text-[11px] text-muted-foreground">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {vendor.nextVisitAt && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-foreground">
          <CalendarClock className="w-3.5 h-3.5 text-primary" />
          Next visit {formatVisit(vendor.nextVisitAt)}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border text-sm text-muted-foreground">
        <Phone className="w-3.5 h-3.5" />
        {vendor.phone}
      </div>
    </motion.div>
  );
};
