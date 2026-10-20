'use client';

import { motion } from 'framer-motion';
import { CalendarClock, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { Badge, Button, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { ViewingRequest, ViewingRequestStatus } from '@/types/buyer';
import { VideoCallButton } from '@/components/shared/VideoCallButton';
import { buyerService } from '@/services/buyerService';

const statusConfig: Record<
  ViewingRequestStatus,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'warning',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CalendarClock,
    variant: 'info',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    variant: 'success',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'neutral',
  },
};

interface ViewingRequestCardProps {
  request: ViewingRequest;
  onCancel: () => void;
  delay?: number;
}

export const ViewingRequestCard = ({ request, onCancel, delay = 0 }: ViewingRequestCardProps) => {
  const status = statusConfig[request.status];
  const StatusIcon = status.icon;
  const canCancel = request.status === 'pending' || request.status === 'confirmed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{request.propertyTitle}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {request.scheduledAt
              ? new Date(request.scheduledAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : `${formatDate(request.requestedDate)} · ${request.requestedTime}`}
          </p>
          {request.mode === 'video' && (
            <p className="text-xs font-medium text-primary mt-0.5">Live video viewing</p>
          )}
        </div>
        <Badge variant={status.variant} icon={<StatusIcon className="w-3 h-3" />}>
          {status.label}
        </Badge>
      </div>

      {request.notes && <p className="text-xs text-muted-foreground mt-3">{request.notes}</p>}

      <div className="mt-3">
        <VideoCallButton viewing={request} join={() => buyerService.joinVideoCall(request.id)} />
      </div>

      {canCancel && (
        <div className="flex justify-end mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            icon={<X className="w-3.5 h-3.5" />}
            onClick={onCancel}
          >
            Cancel Request
          </Button>
        </div>
      )}
    </motion.div>
  );
};
