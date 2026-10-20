'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Skeleton } from '@getrentos/ui';
import { AlertTriangle } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency } from '@/lib/format';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';
import { LAND_PLOT_STATUSES } from '@/types/landDeveloper';
import { PLOT_STATUS } from './labels';

const STATUS_BAR: Record<string, string> = {
  AVAILABLE: 'bg-success',
  RESERVED: 'bg-info',
  UNDER_INSTALLMENT: 'bg-warning',
  SOLD: 'bg-primary',
  ALLOCATED: 'bg-primary/60',
  WITHHELD: 'bg-destructive/70',
};

const Figure = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <Card static className="p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
  </Card>
);

/** Plots by status, sell-through, inventory value and what buyers owe. */
export const InventoryDashboard = ({ propertyId }: { propertyId: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: landDeveloperKeys.dashboard(propertyId),
    queryFn: () => unwrap(landDeveloperService.getDashboard(propertyId)),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="danger" icon={AlertTriangle}>
        {error instanceof Error ? error.message : 'The inventory figures could not be loaded.'}
      </Alert>
    );
  }

  const { purchases } = data;
  const collectable = purchases.collected + purchases.outstanding;
  const collectedShare = collectable > 0 ? (purchases.collected / collectable) * 100 : 0;

  return (
    <section aria-labelledby="inventory-heading" className="space-y-4">
      <h2 id="inventory-heading" className="text-base font-semibold text-foreground">
        Inventory
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Figure
          label="Plots"
          value={data.totalPlots.toLocaleString('en-NG')}
          note={`${data.counts.AVAILABLE ?? 0} available`}
        />
        <Figure
          label="Sell-through"
          value={`${Number(data.sellThroughPercent.toFixed(1))}%`}
          note="Committed plots of those on sale"
        />
        <Figure
          label="Inventory value"
          value={formatCurrency(data.totalValue, { compact: true })}
          note={`${formatCurrency(data.availableValue, { compact: true })} still available`}
        />
        <Figure
          label="Value sold"
          value={formatCurrency(data.soldValue, { compact: true })}
          note="Under installment, sold or allocated"
        />
      </div>

      {data.totalPlots > 0 && (
        <Card static className="p-4">
          <p className="text-sm font-medium text-foreground">Plots by status</p>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-secondary">
            {LAND_PLOT_STATUSES.map((status) => {
              const count = data.counts[status] ?? 0;
              if (count === 0) return null;
              return (
                <div
                  key={status}
                  className={STATUS_BAR[status]}
                  style={{ width: `${(count / data.totalPlots) * 100}%` }}
                  title={`${PLOT_STATUS[status].label}: ${count}`}
                />
              );
            })}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
            {LAND_PLOT_STATUSES.map((status) => (
              <li key={status} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR[status]}`} aria-hidden />
                <span className="text-muted-foreground">{PLOT_STATUS[status].label}</span>
                <span className="ml-auto font-medium text-foreground">
                  {data.counts[status] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card static className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Collections</p>
          <p className="text-xs text-muted-foreground">
            {purchases.live} live contract{purchases.live === 1 ? '' : 's'}
            {purchases.defaulted > 0 && `, ${purchases.defaulted} defaulted`}
          </p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-success" style={{ width: `${collectedShare}%` }} />
        </div>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Collected</dt>
            <dd className="font-semibold text-foreground">{formatCurrency(purchases.collected)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Outstanding</dt>
            <dd className="font-semibold text-foreground">
              {formatCurrency(purchases.outstanding)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Overdue</dt>
            <dd
              className={`font-semibold ${purchases.overdueAmount > 0 ? 'text-destructive' : 'text-foreground'}`}
            >
              {formatCurrency(purchases.overdueAmount)}
            </dd>
          </div>
        </dl>
      </Card>
    </section>
  );
};
