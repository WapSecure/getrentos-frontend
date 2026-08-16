'use client';

import { motion } from 'framer-motion';
import { CalendarClock, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { ViewingRequest, ViewingRequestStatus } from '@/types/buyer';

const statusConfig: Record<
  ViewingRequestStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'text-yellow-700 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CalendarClock,
    className: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
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
            {formatDate(request.requestedDate)} · {request.requestedTime}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {request.notes && <p className="text-xs text-muted-foreground mt-3">{request.notes}</p>}

      {canCancel && (
        <div className="flex justify-end mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-600 dark:text-red-400"
            onClick={onCancel}
          >
            <X className="w-3.5 h-3.5" />
            Cancel Request
          </Button>
        </div>
      )}
    </motion.div>
  );
};
