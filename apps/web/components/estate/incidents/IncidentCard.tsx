'use client';

import { ImageIcon } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import type { Incident } from '@/types/estate';

const statusVariant: Record<Incident['status'], 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  dismissed: 'neutral',
};

const statusLabels: Record<Incident['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const categoryLabels: Record<Incident['category'], string> = {
  security: 'Security',
  maintenance: 'Maintenance',
  safety: 'Safety',
  other: 'Other',
};

const priorityVariant: Record<Incident['priority'], 'neutral' | 'warning' | 'danger'> = {
  low: 'neutral',
  medium: 'neutral',
  high: 'warning',
  critical: 'danger',
};

const priorityLabels: Record<Incident['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface IncidentCardProps {
  incident: Incident;
  onResolve?: () => void;
  onDismiss?: () => void;
  isUpdating?: boolean;
}

export const IncidentCard = ({ incident, onResolve, onDismiss, isUpdating }: IncidentCardProps) => {
  const isOpen = incident.status === 'open' || incident.status === 'in_progress';

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={priorityVariant[incident.priority]}>
              {priorityLabels[incident.priority]}
            </Badge>
            <Badge variant={statusVariant[incident.status]}>{statusLabels[incident.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {categoryLabels[incident.category]} · Reported {formatDateTime(incident.createdAt)}
          </p>
        </div>
        {isOpen && (onResolve || onDismiss) && (
          <div className="flex items-center gap-2 shrink-0">
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
      <p className="text-sm text-foreground mt-2">{incident.description}</p>
      {incident.photoUrl && (
        <a
          href={incident.photoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          View photo
        </a>
      )}
      {incident.resolutionNotes && (
        <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
          {statusLabels[incident.status]}: {incident.resolutionNotes}
        </p>
      )}
    </div>
  );
};
