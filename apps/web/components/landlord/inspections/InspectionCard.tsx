'use client';

import { Badge, type BadgeVariant } from '@getrentos/ui';
import { ClipboardCheck, AlertTriangle } from 'lucide-react';
import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_TYPE_LABELS,
  type InspectionListItem,
  type InspectionStatus,
} from '@/services/inspectionService';

const STATUS_VARIANT: Record<InspectionStatus, BadgeVariant> = {
  DRAFT: 'neutral',
  COMPLETED: 'info',
  SHARED: 'success',
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

interface InspectionCardProps {
  inspection: InspectionListItem;
  onOpen: (id: string) => void;
}

export const InspectionCard = ({ inspection, onOpen }: InspectionCardProps) => {
  const hasRemedial = inspection.estimatedRemedialCost > 0;
  return (
    <button
      type="button"
      onClick={() => onOpen(inspection.id)}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ClipboardCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate font-semibold text-foreground">
            {inspection.propertyTitle ?? 'Property'}
          </span>
        </div>
        <Badge variant={STATUS_VARIANT[inspection.status]}>
          {INSPECTION_STATUS_LABELS[inspection.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="neutral">{INSPECTION_TYPE_LABELS[inspection.type]}</Badge>
        <span>
          {inspection.itemCount} area{inspection.itemCount === 1 ? '' : 's'}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatDate(inspection.conductedAt ?? inspection.createdAt)}</span>
      </div>

      {hasRemedial && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-warning">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {formatNaira(inspection.estimatedRemedialCost)} estimated remedial cost
        </div>
      )}
    </button>
  );
};
