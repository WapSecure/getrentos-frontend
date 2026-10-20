'use client';

import { Clock, CalendarClock, CheckCircle2, XCircle, Check, X } from 'lucide-react';
import { Badge, Button, Card, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { ViewingAppointment, ViewingStatus } from '@/types/realtor';

const statusConfig: Record<
  ViewingStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  pending: { label: 'Pending', icon: Clock, variant: 'warning' },
  confirmed: { label: 'Confirmed', icon: CalendarClock, variant: 'info' },
  completed: { label: 'Completed', icon: CheckCircle2, variant: 'success' },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'neutral' },
};

interface ViewingCardProps {
  viewing: ViewingAppointment;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  isUpdating?: boolean;
}

export const ViewingCard = ({
  viewing,
  onConfirm,
  onComplete,
  onCancel,
  isUpdating = false,
}: ViewingCardProps) => {
  const status = statusConfig[viewing.status];
  const StatusIcon = status.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{viewing.listingTitle}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            With {viewing.leadName} · {formatDate(viewing.scheduledDate)} · {viewing.scheduledTime}
          </p>
        </div>
        <Badge
          variant={status.variant}
          icon={<StatusIcon className="w-3 h-3" />}
          className="shrink-0 whitespace-nowrap"
        >
          {status.label}
        </Badge>
      </div>

      {viewing.notes && <p className="text-xs text-muted-foreground mt-3">{viewing.notes}</p>}

      {(viewing.status === 'pending' || viewing.status === 'confirmed') && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <div className="flex-1" />
          {viewing.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
              onClick={onConfirm}
              isLoading={isUpdating}
            >
              Confirm
            </Button>
          )}
          {viewing.status === 'confirmed' && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={onComplete}
              isLoading={isUpdating}
            >
              Mark Completed
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
