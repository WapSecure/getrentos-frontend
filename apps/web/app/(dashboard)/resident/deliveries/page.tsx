'use client';

import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { DeliveryLog } from '@/types/estate';

const statusVariant: Record<DeliveryLog['status'], 'warning' | 'success'> = {
  received: 'warning',
  collected: 'success',
};

const statusLabels: Record<DeliveryLog['status'], string> = {
  received: 'Awaiting Pickup',
  collected: 'Collected',
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export default function ResidentDeliveriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.deliveries(),
    queryFn: () => unwrap(estateResidentService.listMyDeliveries({ pageSize: 50 })),
  });
  const deliveries = data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Deliveries</h1>
        <p className="text-muted-foreground mt-1">
          {data?.total ?? 0} deliveries for your household
        </p>
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : deliveries.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Package}
            title="No deliveries yet"
            description="Packages logged at the gate for your household will show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {deliveries.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {log.courier || 'Package'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Received {formatDateTime(log.receivedAt)}
                  {log.collectedAt ? ` · Collected ${formatDateTime(log.collectedAt)}` : ''}
                </p>
              </div>
              <Badge variant={statusVariant[log.status]}>{statusLabels[log.status]}</Badge>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
