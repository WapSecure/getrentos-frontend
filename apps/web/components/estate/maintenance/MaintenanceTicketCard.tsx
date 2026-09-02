'use client';

import { ImageIcon } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import type { MaintenanceTicket } from '@/types/estate';

const statusVariant: Record<
  MaintenanceTicket['status'],
  'warning' | 'info' | 'success' | 'neutral'
> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  dismissed: 'neutral',
};

const statusLabels: Record<MaintenanceTicket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const categoryLabels: Record<MaintenanceTicket['category'], string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  structural: 'Structural',
  common_area: 'Common Area',
  other: 'Other',
};

const priorityVariant: Record<MaintenanceTicket['priority'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'neutral',
  high: 'warning',
  urgent: 'danger',
};

const priorityLabels: Record<MaintenanceTicket['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface MaintenanceTicketCardProps {
  ticket: MaintenanceTicket;
  showHousehold?: boolean;
  onStart?: () => void;
  onResolve?: () => void;
  onDismiss?: () => void;
  isUpdating?: boolean;
}

export const MaintenanceTicketCard = ({
  ticket,
  showHousehold,
  onStart,
  onResolve,
  onDismiss,
  isUpdating,
}: MaintenanceTicketCardProps) => {
  const isOpen = ticket.status === 'open' || ticket.status === 'in_progress';

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {showHousehold && (
            <p className="text-sm font-semibold text-foreground truncate">
              {ticket.unitLabel} — {ticket.residentName}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={priorityVariant[ticket.priority]}>
              {priorityLabels[ticket.priority]}
            </Badge>
            <Badge variant={statusVariant[ticket.status]}>{statusLabels[ticket.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {categoryLabels[ticket.category]} · Reported {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        {isOpen && (onStart || onResolve || onDismiss) && (
          <div className="flex items-center gap-2 shrink-0">
            {onStart && ticket.status === 'open' && (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onStart}>
                Start
              </Button>
            )}
            {onResolve && (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onResolve}>
                Resolve
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" disabled={isUpdating} onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>
        )}
      </div>
      <p className="text-sm text-foreground mt-2">{ticket.description}</p>
      {ticket.photoUrl && (
        <a
          href={ticket.photoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          View photo
        </a>
      )}
      {ticket.resolutionNotes && (
        <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
          {statusLabels[ticket.status]}: {ticket.resolutionNotes}
        </p>
      )}
    </div>
  );
};
