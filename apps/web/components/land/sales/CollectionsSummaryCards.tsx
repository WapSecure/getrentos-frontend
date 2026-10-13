'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@getrentos/ui';
import { AlertTriangle, Banknote, Landmark, Lock, Wallet } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { landDeveloperKeys } from '@/lib/landDeveloperQueryKeys';
import { landDeveloperService } from '@/services/landDeveloperService';

/** Collected, held, released, outstanding and overdue across plot purchases. */
export const CollectionsSummaryCards = ({ layoutId }: { layoutId?: string }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: landDeveloperKeys.collections(layoutId),
    queryFn: () => unwrap(landDeveloperService.getCollections(layoutId)),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error instanceof Error ? error.message : 'Collections could not be loaded.'}
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        icon={Wallet}
        label="Collected"
        value={data.collected}
        isCurrency
        accent="emerald"
        subtitle={`${data.purchaseCount} purchase${data.purchaseCount === 1 ? '' : 's'}`}
      />
      <StatCard
        icon={Lock}
        label="Held until confirmed"
        value={data.heldInEscrow}
        isCurrency
        accent="blue"
        subtitle="Released as buyers confirm each step"
      />
      <StatCard
        icon={Banknote}
        label="Released to you"
        value={data.releasedToSeller}
        isCurrency
        accent="primary"
      />
      <StatCard
        icon={Landmark}
        label="Outstanding"
        value={data.outstanding}
        isCurrency
        accent="purple"
        subtitle={`${data.activeCount} paying now`}
      />
      <StatCard
        icon={AlertTriangle}
        label="Overdue"
        value={data.overdueAmount}
        isCurrency
        accent={data.overdueAmount > 0 ? 'red' : 'green'}
        subtitle={
          data.overdueInstallments > 0
            ? `${data.overdueInstallments} installment${data.overdueInstallments === 1 ? '' : 's'}${
                data.defaultedCount > 0 ? `, ${data.defaultedCount} defaulted` : ''
              }`
            : 'Nothing overdue'
        }
      />
    </div>
  );
};
