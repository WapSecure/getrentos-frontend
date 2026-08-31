'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Receipt, Repeat } from 'lucide-react';
import { Badge, Button, EmptyState } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import type { Due } from '@/types/estate';

const statusVariant: Record<Due['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  processing: 'warning',
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
  const queryClient = useQueryClient();
  const [payError, setPayError] = useState<{ dueId: string; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: estateResidentKeys.dues(),
    queryFn: () => unwrap(estateResidentService.listMyDues({ pageSize: 50 })),
  });
  const dues = data?.items ?? [];

  const payMutation = useMutation({
    mutationFn: (dueId: string) => unwrap(estateResidentService.payMyDue(dueId)),
    onSuccess: (updated) => {
      setPayError(null);
      // A real gateway checkout was started — send the resident to Paystack to complete it.
      // The webhook confirms payment server-side once they finish there.
      if (updated.authorizationUrl) {
        window.location.href = updated.authorizationUrl;
        return;
      }
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.dues() });
    },
    onError: (err, dueId) => {
      setPayError({
        dueId,
        message: err instanceof Error ? err.message : 'Unable to start payment. Please try again.',
      });
    },
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dues</h1>
        <p className="text-muted-foreground mt-1">{data?.total ?? 0} dues on your household</p>
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
          {dues.map((due) => {
            const isPaying = payMutation.isPending && payMutation.variables === due.id;
            const canPay = due.status === 'pending' || due.status === 'overdue';
            return (
              <div key={due.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {categoryLabels[due.category]}
                      {due.isRecurring && (
                        <span title="Repeats automatically">
                          <Repeat className="w-3 h-3 text-muted-foreground shrink-0" />
                        </span>
                      )}
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
                    {canPay && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isPaying}
                        isLoading={isPaying}
                        onClick={() => {
                          setPayError(null);
                          payMutation.mutate(due.id);
                        }}
                      >
                        {isPaying ? 'Processing…' : 'Pay Now'}
                      </Button>
                    )}
                  </div>
                </div>
                {payError?.dueId === due.id && (
                  <p className="text-xs text-destructive mt-2">{payError.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
