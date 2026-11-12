'use client';

import { Car } from '@sureground/icons';
import { Badge, Button } from '@sureground/ui';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
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
  const who = [log.vehicleDescription, log.driverName, purposeLabels[log.purpose]]
    .filter(Boolean)
    .join(' · ');
  const when = [
    `Entered ${formatDateTime(log.enteredAt)}`,
    log.gateName,
    log.exitedAt ? `Exited ${formatDateTime(log.exitedAt)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <EstateRow
      leading={<RowAvatar icon={Car} tone={isInside ? 'primary' : 'neutral'} />}
      title={
        <>
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-foreground tabular-nums">
            {log.plateNumber}
          </p>
          <Badge variant={isInside ? 'success' : 'neutral'}>{isInside ? 'Inside' : 'Exited'}</Badge>
        </>
      }
      meta={
        <>
          <p className="truncate">{who}</p>
          <p className="tabular-nums">{when}</p>
        </>
      }
      actions={
        isInside ? (
          <Button variant="outline" size="sm" disabled={isMarkingExited} onClick={onMarkExited}>
            Mark exited
          </Button>
        ) : undefined
      }
    />
  );
};
