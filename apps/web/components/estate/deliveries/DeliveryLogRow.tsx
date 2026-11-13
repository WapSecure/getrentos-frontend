'use client';

import { Badge, Button } from '@sureground/ui';
import { collectionSummary } from '@sureground/shared';
import type { DeliveryLog } from '@/types/estate';

const statusVariant: Record<DeliveryLog['status'], 'warning' | 'success'> = {
  received: 'warning',
  collected: 'success',
};

const statusLabels: Record<DeliveryLog['status'], string> = {
  received: 'Awaiting pickup',
  collected: 'Collected',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface DeliveryLogRowProps {
  log: DeliveryLog;
  /** Omit to show the row read-only. */
  onMarkCollected?: () => void;
  isMarkingCollected?: boolean;
}

export const DeliveryLogRow = ({
  log,
  onMarkCollected,
  isMarkingCollected,
}: DeliveryLogRowProps) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {log.unitLabel}: {log.residentName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {log.courier ? `${log.courier} · ` : ''}
          {log.recipientName ? `${log.recipientName} · ` : ''}
          Received {formatDateTime(log.receivedAt)}
          {log.gateName ? ` · ${log.gateName}` : ''}
        </p>
        {log.status === 'collected' && collectionSummary(log) && (
          <p className="text-xs text-muted-foreground mt-0.5">{collectionSummary(log)}</p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={statusVariant[log.status]}>{statusLabels[log.status]}</Badge>
        {log.status === 'received' && onMarkCollected && (
          <Button
            variant="outline"
            size="sm"
            disabled={isMarkingCollected}
            onClick={onMarkCollected}
          >
            Mark collected
          </Button>
        )}
      </div>
    </div>
  );
};
