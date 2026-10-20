'use client';

import { ClipboardCheck, CloudOff, Cloud, Camera, UserCheck } from 'lucide-react';
import { Badge, Card, type BadgeVariant } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { PropertyInspection, RoomCondition, InspectionType } from '@/types/agent';

const conditionConfig: Record<RoomCondition, { label: string; variant: BadgeVariant }> = {
  excellent: { label: 'Excellent', variant: 'success' },
  good: { label: 'Good', variant: 'info' },
  fair: { label: 'Fair', variant: 'warning' },
  poor: { label: 'Poor', variant: 'danger' },
};

const syncConfig: Record<
  PropertyInspection['syncStatus'],
  { label: string; variant: BadgeVariant }
> = {
  synced: { label: 'Synced', variant: 'success' },
  pending: { label: 'Pending Sync', variant: 'warning' },
  failed: { label: 'Sync Failed', variant: 'danger' },
};

const typeConfig: Record<InspectionType, string> = {
  move_in: 'Move-in',
  move_out: 'Move-out',
  periodic: 'Periodic',
  other: 'Other',
};

interface InspectionCardProps {
  inspection: PropertyInspection;
  onClick: () => void;
  delay?: number;
}

export const InspectionCard = ({ inspection, onClick }: InspectionCardProps) => {
  const totalPhotos = inspection.rooms.reduce((sum, r) => sum + r.photoCount, 0);
  const condition = inspection.overallCondition
    ? conditionConfig[inspection.overallCondition]
    : null;
  const sync = syncConfig[inspection.syncStatus] ?? syncConfig.failed;

  return (
    <Card interactive className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <ClipboardCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              <button
                type="button"
                onClick={onClick}
                className="text-left after:absolute after:inset-0 focus:outline-none"
              >
                {inspection.propertyAddress}
              </button>
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {typeConfig[inspection.type]} · {inspection.clientName}
            </p>
          </div>
        </div>
        <Badge
          variant={sync.variant}
          icon={
            inspection.syncStatus === 'synced' ? (
              <Cloud className="w-3 h-3" />
            ) : (
              <CloudOff className="w-3 h-3" />
            )
          }
          className="shrink-0 whitespace-nowrap"
        >
          {sync.label}
        </Badge>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span>{inspection.rooms.length} rooms checked</span>
        <span className="flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" />
          {totalPhotos} photos
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">{formatDate(inspection.scheduledDate)}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {inspection.acknowledgedAt && (
            <Badge variant="success" icon={<UserCheck className="w-3 h-3" />}>
              Tenant signed off
            </Badge>
          )}
          {condition && (
            <Badge variant={condition.variant}>{condition.label}</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
