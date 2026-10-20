'use client';

import { Camera, UserCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type BadgeVariant,
} from '@getrentos/ui';
import type { RenterInspection, RenterRoomCondition } from '@/types/renter';

const conditionConfig: Record<RenterRoomCondition, BadgeVariant> = {
  excellent: 'success',
  good: 'info',
  fair: 'warning',
  poor: 'danger',
};

const typeLabels: Record<RenterInspection['type'], string> = {
  move_in: 'Move-in inspection',
  move_out: 'Move-out inspection',
  periodic: 'Periodic inspection',
  other: 'Inspection',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface InspectionAcknowledgeModalProps {
  inspection: RenterInspection | null;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  isAcknowledging?: boolean;
}

export const InspectionAcknowledgeModal = ({
  inspection,
  onClose,
  onAcknowledge,
  isAcknowledging,
}: InspectionAcknowledgeModalProps) => {
  return (
    <Dialog open={inspection !== null} onOpenChange={(next) => !next && onClose()}>
      {inspection && (
        <DialogContent size="md" padded={false} className="flex flex-col overflow-hidden">
          <div className="p-4 pr-12 border-b border-border shrink-0">
            <DialogTitle className="font-semibold text-foreground">
              {typeLabels[inspection.type]}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {inspection.propertyAddress} · {formatDate(inspection.scheduledDate)}
            </DialogDescription>
          </div>

          <div className="min-h-0 p-4 space-y-3 overflow-y-auto flex-1">
            {inspection.rooms.map((room, index) => (
              <div key={index} className="p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{room.room}</p>
                  <Badge variant={conditionConfig[room.condition]}>
                    {room.condition.charAt(0).toUpperCase() + room.condition.slice(1)}
                  </Badge>
                </div>
                {room.notes && <p className="text-xs text-muted-foreground mt-1">{room.notes}</p>}
                {!!room.photoCount && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                    <Camera className="w-3 h-3" />
                    {room.photoCount} photo{room.photoCount === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border shrink-0">
            {inspection.acknowledgedAt ? (
              <p className="flex items-center justify-center gap-1.5 text-sm text-success">
                <UserCheck className="w-4 h-4" />
                Acknowledged {formatDate(inspection.acknowledgedAt)}
              </p>
            ) : (
              <>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => onAcknowledge(inspection.id)}
                  isLoading={isAcknowledging}
                  loadingText="Saving…"
                  icon={<UserCheck className="h-4 w-4" />}
                >
                  Confirm I reviewed this record
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Acknowledging confirms you reviewed the recorded room conditions. It does not
                  waive your right to dispute any item.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};
