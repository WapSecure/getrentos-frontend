'use client';

import { TriangleAlert } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { Violation } from '@/types/estate';

const statusVariant: Record<Violation['status'], 'warning' | 'danger' | 'success' | 'neutral'> = {
  reported: 'warning',
  warning_issued: 'danger',
  resolved: 'success',
  dismissed: 'neutral',
};

const statusLabels: Record<Violation['status'], string> = {
  reported: 'Reported',
  warning_issued: 'Warning issued',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const categoryLabels: Record<Violation['category'], string> = {
  noise: 'Noise',
  unauthorized_parking: 'Unauthorised parking',
  pet_violation: 'Pet violation',
  property_maintenance: 'Property maintenance',
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
    <EstateRow
      align="start"
      leading={
        <RowAvatar
          icon={TriangleAlert}
          tone={
            violation.status === 'warning_issued'
              ? 'danger'
              : violation.status === 'reported'
                ? 'warning'
                : 'neutral'
          }
        />
      }
      title={
        <>
          <p className="truncate text-sm font-semibold text-foreground">
            {violation.unitLabel}: {violation.residentName}
          </p>
          <Badge variant={statusVariant[violation.status]}>{statusLabels[violation.status]}</Badge>
        </>
      }
      meta={
        <p className="tabular-nums">
          {categoryLabels[violation.category]} · Reported {formatDate(violation.createdAt)}
        </p>
      }
      actions={
        isOpen ? (
          <>
            {violation.status === 'reported' && (
              <Button variant="outline" size="sm" disabled={isUpdating} onClick={onWarn}>
                Issue warning
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={isUpdating} onClick={onResolve}>
              Resolve
            </Button>
            <Button variant="ghost" size="sm" disabled={isUpdating} onClick={onDismiss}>
              Dismiss
            </Button>
          </>
        ) : undefined
      }
    >
      <p className="mt-2 max-w-prose text-sm leading-6 text-foreground/90">
        {violation.description}
      </p>
      {violation.resolutionNotes && (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
          {statusLabels[violation.status]}: {violation.resolutionNotes}
        </p>
      )}
    </EstateRow>
  );
};
