'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from '@sureground/icons';
import { Badge, EmptyState, ListSkeleton, PageHeader, Pagination } from '@sureground/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { collectionSummary, formatClock } from '@sureground/shared';
import { estateResidentKeys } from '@/lib/queryKeys';
import { ExpectedDeliveriesPanel } from '@/components/estate/deliveries/ExpectedDeliveriesPanel';
import type { DeliveryLog } from '@/types/estate';

const statusVariant: Record<DeliveryLog['status'], 'warning' | 'success'> = {
  received: 'warning',
  collected: 'success',
};

const statusLabels: Record<DeliveryLog['status'], string> = {
  received: 'Awaiting pickup',
  collected: 'Collected',
};

const PAGE_SIZE = 10;

const formatDateTime = (value: string) =>
  formatClock(new Date(value), { day: 'numeric', month: 'short', minute: '2-digit' });

export default function ResidentDeliveriesPage() {
  const [collectedPage, setCollectedPage] = useState(1);
  // Parcels still at the gate are few and always shown; only the collected history is paged.
  const waiting = useQuery({
    queryKey: [...estateResidentKeys.deliveries(1), 'received'],
    queryFn: () =>
      unwrap(estateResidentService.listMyDeliveries({ status: 'received', pageSize: 50 })),
  });
  const collected = useQuery({
    queryKey: [...estateResidentKeys.deliveries(collectedPage), 'collected'],
    queryFn: () =>
      unwrap(
        estateResidentService.listMyDeliveries({
          status: 'collected',
          page: collectedPage,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const atGate = waiting.data?.items ?? [];
  const history = collected.data?.items ?? [];
  const collectedTotal = collected.data?.total ?? 0;
  const isLoading = waiting.isPending || collected.isPending;

  const renderDelivery = (log: DeliveryLog) => (
    <div key={log.id} className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{log.courier || 'Package'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Received {formatDateTime(log.receivedAt)}
          {collectionSummary(log) ? ` · ${collectionSummary(log)}` : ''}
        </p>
      </div>
      <Badge variant={statusVariant[log.status]}>{statusLabels[log.status]}</Badge>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Deliveries"
        description={
          isLoading
            ? 'Loading…'
            : atGate.length === 0
              ? 'Nothing waiting at the gate'
              : `${atGate.length} ${atGate.length === 1 ? 'parcel' : 'parcels'} waiting at the gate`
        }
      />

      <div className="mb-8">
        <ExpectedDeliveriesPanel />
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : atGate.length === 0 && collectedTotal === 0 ? (
        <EmptyState
          icon={Package}
          title="No deliveries yet"
          description="Packages logged at the gate for your household will show up here."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">At the gate</h2>
            {atGate.length === 0 ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Nothing is waiting for you at the gate.
              </p>
            ) : (
              <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
                {atGate.map(renderDelivery)}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Collected</h2>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="divide-y divide-border">{history.map(renderDelivery)}</div>
                {collectedTotal > PAGE_SIZE && (
                  <Pagination
                    page={collectedPage}
                    pageSize={PAGE_SIZE}
                    total={collectedTotal}
                    onPageChange={setCollectedPage}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
