'use client';

import { motion } from 'framer-motion';
import {
  UserCog,
  CheckCircle2,
  ArrowUpCircle,
  Wrench,
  Zap,
  Wifi,
  ShieldAlert,
  Droplets,
  CalendarClock,
} from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatRelativeTime } from '@/lib/format';
import { maintenancePriorityBadges, maintenanceStatusBadges } from '@/lib/statusBadge';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import { formatVisit } from '@/components/landlord/vendors/VendorCard';
import type { LandlordMaintenanceRequest } from '@/types/landlord';
import type { MaintenanceCategory } from '@/types/maintenance';

const categoryIcons: Record<MaintenanceCategory, React.ElementType> = {
  plumbing: Droplets,
  electrical: Zap,
  internet: Wifi,
  security: ShieldAlert,
  appliances: Wrench,
  other: Wrench,
};

interface MaintenanceRequestCardProps {
  request: LandlordMaintenanceRequest;
  delay?: number;
  onAssignVendor: (request: LandlordMaintenanceRequest) => void;
  onScheduleVisit: (request: LandlordMaintenanceRequest) => void;
  onRateVendor: (id: string, rating: number) => void;
  isRatingVendor?: boolean;
  onMarkResolved: (id: string) => void;
  onEscalate: (id: string) => void;
  isMarkingResolved?: boolean;
  isEscalating?: boolean;
}

export const MaintenanceRequestCard = ({
  request,
  delay = 0,
  onAssignVendor,
  onScheduleVisit,
  onRateVendor,
  isRatingVendor = false,
  onMarkResolved,
  onEscalate,
  isMarkingResolved = false,
  isEscalating = false,
}: MaintenanceRequestCardProps) => {
  const CategoryIcon = categoryIcons[request.category];
  const priority = maintenancePriorityBadges[request.priority];
  const status = maintenanceStatusBadges[request.status];
  const isResolved = request.status === 'resolved';
  const isClosed = isResolved || request.status === 'cancelled';
  const isBusy = isMarkingResolved || isEscalating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-secondary shrink-0">
            <CategoryIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{request.issueTitle}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {request.tenantName} • {request.propertyName}, {request.unitName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <Badge
          variant={status.variant}
          icon={status.icon ? <status.icon className="w-3 h-3" /> : undefined}
        >
          {status.label}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{request.description}</p>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">
          Reported {formatRelativeTime(request.createdAt)}
        </p>
        {request.assignedVendorName && (
          <p className="text-xs text-muted-foreground">
            Vendor:{' '}
            <span className="font-medium text-foreground">{request.assignedVendorName}</span>
          </p>
        )}
      </div>

      {request.scheduledFor && !isClosed && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-foreground">
          <CalendarClock className="w-3.5 h-3.5 text-primary" />
          Visit {formatVisit(request.scheduledFor)}
        </p>
      )}

      {isResolved && request.assignedVendorName && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">
            {request.vendorRating ? 'Your rating for' : 'Rate'} {request.assignedVendorName}
          </p>
          <div className="flex items-center gap-3">
            <StarRating
              value={request.vendorRating ?? 0}
              onRate={(rating) => onRateVendor(request.id, rating)}
              disabled={isRatingVendor}
              size="md"
              label="Your rating"
            />
            {!request.vendorRating && request.tenantVendorRating && (
              <span className="text-xs text-muted-foreground">
                Tenant gave {request.tenantVendorRating}/5
              </span>
            )}
          </div>
        </div>
      )}

      {!isClosed && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            className="gap-1.5"
            onClick={() => onAssignVendor(request)}
            disabled={isBusy}
          >
            <UserCog className="w-3.5 h-3.5" />
            {request.assignedVendorName ? 'Reassign' : 'Assign Vendor'}
          </Button>
          {request.assignedVendorName && (
            <Button
              variant="outline"
              size="sm"
              className="px-2.5"
              title={request.scheduledFor ? 'Move visit' : 'Book visit'}
              onClick={() => onScheduleVisit(request)}
              disabled={isBusy}
            >
              <CalendarClock className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="px-2.5 text-warning hover:text-warning/80"
            title="Escalate"
            onClick={() => onEscalate(request.id)}
            isLoading={isEscalating}
            disabled={isBusy}
          >
            <ArrowUpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="px-2.5"
            title="Mark Resolved"
            onClick={() => onMarkResolved(request.id)}
            isLoading={isMarkingResolved}
            disabled={isBusy}
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
