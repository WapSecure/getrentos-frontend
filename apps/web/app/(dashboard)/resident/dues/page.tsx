'use client';

import { useQuery } from '@tanstack/react-query';
import { Receipt, Info } from 'lucide-react';
import { Badge, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { Due } from '@/types/estate';

const statusVariant: Record<Due['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
};

const categoryLabels: Record<Due['category'], string> = {
  rent: 'Rent',
  service_charge: 'Service Charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

export default function ResidentDuesPage() {
  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.dues(),
    queryFn: () => unwrap(estateResidentService.listMyDues({ pageSize: 50 })),
  });
  const dues = data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dues</h1>
        <p className="text-muted-foreground mt-1">{data?.total ?? 0} dues on your household</p>
      </div>

      <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-accent/50 text-sm text-muted-foreground">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        Online payment is coming soon. For now, pay your estate manager directly and they&apos;ll
        mark it as paid here.
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : dues.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={Receipt}
            title="No dues yet"
            description="Your estate manager hasn't charged any dues to your household."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {dues.map((due) => (
            <div key={due.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {categoryLabels[due.category]}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due {formatDate(due.dueDate)}
                  {due.description ? ` · ${due.description}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(due.amount)}
                </span>
                <Badge variant={statusVariant[due.status]}>
                  {due.status.charAt(0).toUpperCase() + due.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
