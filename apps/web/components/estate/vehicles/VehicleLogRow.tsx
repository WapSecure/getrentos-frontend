'use client';

import { Badge, Button } from '@getrentos/ui';
import type { VehicleLog } from '@/types/estate';

const purposeLabels: Record<VehicleLog['purpose'], string> = {
  visitor: 'Visitor',
  resident: 'Resident',
  delivery: 'Delivery',
  staff: 'Staff',
  other: 'Other',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface VehicleLogRowProps {
  log: VehicleLog;
  onMarkExited: () => void;
  isMarkingExited?: boolean;
}

export const VehicleLogRow = ({ log, onMarkExited, isMarkingExited }: VehicleLogRowProps) => {
  const isInside = !log.exitedAt;

  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{log.plateNumber}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {log.vehicleDescription ? `${log.vehicleDescription} · ` : ''}
          {log.driverName ? `${log.driverName} · ` : ''}
          {purposeLabels[log.purpose]} · Entered {formatDateTime(log.enteredAt)}
          {log.gateName ? ` · ${log.gateName}` : ''}
          {log.exitedAt ? ` · Exited ${formatDateTime(log.exitedAt)}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={isInside ? 'success' : 'neutral'}>{isInside ? 'Inside' : 'Exited'}</Badge>
        {isInside && (
          <Button variant="outline" size="sm" disabled={isMarkingExited} onClick={onMarkExited}>
            Mark Exited
          </Button>
        )}
      </div>
    </div>
  );
};
