'use client';

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
  Sparkles,
} from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { formatRelativeTime } from '@/lib/format';
import { maintenancePriorityBadges, maintenanceStatusBadges } from '@/lib/statusBadge';
import { StarRating } from '@/components/landlord/vendors/StarRating';
import { formatVisit } from '@/components/landlord/vendors/VendorCard';
import type { LandlordMaintenanceRequest } from '@/types/landlord';
import type { MaintenanceCategory } from '@/types/maintenance';
import { RecordIconTile, recordCardClass } from '@/components/shared/records/RecordParts';

export const categoryIcons: Record<MaintenanceCategory, React.ElementType> = {
  plumbing: Droplets,
  electrical: Zap,
  internet: Wifi,
  security: ShieldAlert,
  appliances: Wrench,
  other: Wrench,
};

interface MaintenanceRequestCardProps {
  request: LandlordMaintenanceRequest;
  onAssignVendor: (request: LandlordMaintenanceRequest) => void;
  onScheduleVisit: (request: LandlordMaintenanceRequest) => void;
  onRateVendor: (id: string, rating: number) => void;
  isRatingVendor?: boolean;
  onMarkResolved: (id: string) => void;
  onEscalate: (id: string) => void;
  onTriage: (request: LandlordMaintenanceRequest) => void;
  isMarkingResolved?: boolean;
  isEscalating?: boolean;
  isTriaging?: boolean;
}

export const MaintenanceRequestCard = ({
  request,
  onAssignVendor,
  onScheduleVisit,
  onRateVendor,
  isRatingVendor = false,
  onMarkResolved,
  onEscalate,
  onTriage,
  isMarkingResolved = false,
  isEscalating = false,
  isTriaging = false,
}: MaintenanceRequestCardProps) => {
  const CategoryIcon = categoryIcons[request.category];
  const priority = maintenancePriorityBadges[request.priority];
  const status = maintenanceStatusBadges[request.status];
  const isResolved = request.status === 'resolved';
  const isClosed = isResolved || request.status === 'cancelled';
  const isBusy = isMarkingResolved || isEscalating;

  return (
    <article className={recordCardClass()}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <RecordIconTile icon={CategoryIcon} />
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
      {request.workOrderScope && (
        <p className="mt-2 rounded-xl bg-secondary/60 px-3.5 py-2.5 text-sm text-foreground line-clamp-3">
          <span className="font-medium">Agreed scope: </span>
          {request.workOrderScope}
        </p>
      )}

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
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onTriage(request)}
            isLoading={isTriaging}
            disabled={isBusy}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-triage
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onAssignVendor(request)}
            disabled={isBusy}
          >
            <UserCog className="w-3.5 h-3.5" />
            {request.assignedVendorName ? 'Reassign' : 'Assign vendor'}
          </Button>
          <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
            {request.assignedVendorName && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => onScheduleVisit(request)}
                disabled={isBusy}
              >
                <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
                {request.scheduledFor ? 'Move visit' : 'Book visit'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-warning hover:text-warning/80"
              onClick={() => onEscalate(request.id)}
              isLoading={isEscalating}
              disabled={isBusy}
            >
              <ArrowUpCircle className="w-4 h-4" aria-hidden="true" />
              Escalate
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-1.5"
              onClick={() => onMarkResolved(request.id)}
              isLoading={isMarkingResolved}
              disabled={isBusy}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Mark resolved
            </Button>
          </div>
        </div>
      )}
    </article>
  );
};
