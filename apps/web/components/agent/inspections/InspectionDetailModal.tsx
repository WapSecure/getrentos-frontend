'use client';

import { Camera, RefreshCw, UserCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type BadgeVariant,
} from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { PropertyInspection, RoomCondition, InspectionType } from '@/types/agent';

const conditionConfig: Record<RoomCondition, BadgeVariant> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'danger',
};

const typeConfig: Record<InspectionType, string> = {
  move_in: 'Move-in',
  move_out: 'Move-out',
  periodic: 'Periodic',
  other: 'Other',
};

interface InspectionDetailModalProps {
  inspection: PropertyInspection | null;
  onClose: () => void;
  onSync: (inspectionId: string) => void;
}

export const InspectionDetailModal = ({
  inspection,
  onClose,
  onSync,
}: InspectionDetailModalProps) => {
  return (
    <Dialog open={Boolean(inspection)} onOpenChange={(open) => !open && onClose()}>
      {inspection && (
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg sm:p-0">
          <div className="p-4 pr-12 border-b border-border shrink-0">
            <DialogTitle className="font-semibold text-foreground">
              {inspection.propertyAddress}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {typeConfig[inspection.type]} · {inspection.clientName} ·{' '}
              {formatDate(inspection.scheduledDate)}
            </DialogDescription>
            {inspection.acknowledgedAt && (
              <Badge variant="success" icon={<UserCheck className="w-3 h-3" />} className="mt-1.5">
                Tenant signed off {formatDate(inspection.acknowledgedAt)}
              </Badge>
            )}
          </div>

          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {inspection.rooms.map((room, index) => (
              <div key={index} className="p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{room.room}</p>
                  <Badge variant={conditionConfig[room.condition]}>
                    {room.condition.charAt(0).toUpperCase() + room.condition.slice(1)}
                  </Badge>
                </div>
                {room.notes && <p className="text-xs text-muted-foreground mt-1">{room.notes}</p>}
                {(() => {
                  const roomPhotos = (inspection.photos ?? []).filter(
                    (p) => p.room === room.room
                  );
                  if (roomPhotos.length > 0) {
                    return (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {roomPhotos.map((photo) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ))}
                      </div>
                    );
                  }
                  if (room.photoCount > 0) {
                    return (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                        <Camera className="w-3 h-3" />
                        {room.photoCount} photo{room.photoCount === 1 ? '' : 's'}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border flex gap-3 shrink-0">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
            {inspection.syncStatus !== 'synced' && (
              <Button
                variant="primary"
                className="flex-1"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => onSync(inspection.id)}
              >
                Sync Now
              </Button>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
