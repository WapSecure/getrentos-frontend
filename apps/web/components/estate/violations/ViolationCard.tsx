'use client';

import { Badge, Button } from '@getrentos/ui';
import type { Violation } from '@/types/estate';

const statusVariant: Record<Violation['status'], 'warning' | 'danger' | 'success' | 'neutral'> = {
  reported: 'warning',
  warning_issued: 'danger',
  resolved: 'success',
  dismissed: 'neutral',
};

const statusLabels: Record<Violation['status'], string> = {
  reported: 'Reported',
  warning_issued: 'Warning Issued',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const categoryLabels: Record<Violation['category'], string> = {
  noise: 'Noise',
  unauthorized_parking: 'Unauthorized Parking',
  pet_violation: 'Pet Violation',
  property_maintenance: 'Property Maintenance',
  other: 'Other',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface ViolationCardProps {
  violation: Violation;
  onWarn: () => void;
  onResolve: () => void;
  onDismiss: () => void;
  isUpdating?: boolean;
}

export const ViolationCard = ({
  violation,
  onWarn,
  onResolve,
  onDismiss,
  isUpdating,
}: ViolationCardProps) => {
  const isOpen = violation.status === 'reported' || violation.status === 'warning_issued';

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">
              {violation.unitLabel} — {violation.residentName}
            </p>
            <Badge variant={statusVariant[violation.status]}>
              {statusLabels[violation.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {categoryLabels[violation.category]} · Reported {formatDate(violation.createdAt)}
          </p>
        </div>
        {isOpen && (
          <div className="flex items-center gap-2 shrink-0">
            {violation.status === 'reported' && (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onWarn}>
                Issue Warning
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isUpdating} onClick={onResolve}>
              Resolve
            </Button>
            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-foreground mt-2">{violation.description}</p>
      {violation.resolutionNotes && (
        <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
          {statusLabels[violation.status]}: {violation.resolutionNotes}
        </p>
      )}
    </div>
  );
};
