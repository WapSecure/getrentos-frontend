'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminCreditRefundsService,
  type CreditRefund,
  type CreditRefundStatus,
} from '@/services/adminCreditRefundsService';

type Filter = 'ATTENTION' | 'ALL';

const NEEDS_ATTENTION: CreditRefundStatus[] = ['FAILED', 'PARTLY_REFUNDED', 'PROCESSING'];

const STATUS: Record<
  CreditRefundStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }
> = {
  REFUNDED: { label: 'Refunded', variant: 'success' },
  PARTLY_REFUNDED: { label: 'Partly refunded', variant: 'warning' },
  FAILED: { label: 'Failed', variant: 'danger' },
  PROCESSING: { label: 'Processing', variant: 'info' },
};

const REQUESTED_AS: Record<CreditRefund['requestedAs'], string> = {
  TENANT: 'the tenant',
  MANAGER: 'the owner or manager',
  ADMIN: 'GetRentos',
};

/**
 * Lease credit — a tenant's overpayment — paid back the way it was paid. Most
 * refunds complete on their own; the ones here that failed (the gateway
 * refused, often because the payment is too old to refund) went back into
 * the tenant's credit, and need a person to retry or settle by hand.
 */
export default function CreditRefundsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canRefund = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [filter, setFilter] = useState<Filter>('ATTENTION');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'credit-refunds'],
    queryFn: () => unwrap(adminCreditRefundsService.list()),
  });

  const retry = useMutation({
    mutationFn: ({ leaseId, reason }: { leaseId: string; reason: string }) =>
      unwrap(adminCreditRefundsService.refund(leaseId, reason)),
    onSuccess: (r, { leaseId }) => {
      setNotes((n) => ({ ...n, [leaseId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin', 'credit-refunds'] });
      setToast({
        message:
          r.status === 'REFUNDED'
            ? `${formatCurrency(r.refundedAmount)} refunded.`
            : `Refund ${STATUS[r.status].label.toLowerCase()}: ${r.lastError ?? 'see the record'}`,
        variant: r.status === 'REFUNDED' ? 'success' : 'error',
      });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Could not refund.', variant: 'error' }),
  });

  const all = query.data ?? [];
  const items =
    filter === 'ATTENTION' ? all.filter((r) => NEEDS_ATTENTION.includes(r.status)) : all;

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <RotateCcw className="h-6 w-6 text-primary" aria-hidden />
          Credit refunds
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tenants&apos; lease credit paid back to the card or account it came from. A refund the
          gateway refuses goes back into the tenant&apos;s credit; retry it, or settle it by hand
          and note what you did.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="ATTENTION">Needs attention</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isError ? (
        <PageErrorState
          title="Could not load credit refunds"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title={filter === 'ATTENTION' ? 'Nothing to review' : 'No refunds yet'}
          description={
            filter === 'ATTENTION'
              ? 'Every credit refund went through.'
              : 'Refunds of lease credit appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const status = STATUS[r.status];
            const failed = r.status === 'FAILED' || r.status === 'PARTLY_REFUNDED';
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {r.tenantName} · {formatCurrency(r.refundedAmount)} of{' '}
                      {formatCurrency(r.amount)} refunded
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.propertyName} • {r.unitName} · asked by {REQUESTED_AS[r.requestedAs]} on{' '}
                      {formatDate(r.createdAt)}
                      {r.tenantEmail ? ` · ${r.tenantEmail}` : ''}
                    </p>
                    {r.reason && <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>}
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>

                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {r.lines.map((l, i) => (
                    <li key={i}>
                      {formatCurrency(l.amount)} ·{' '}
                      {l.status === 'SUCCEEDED'
                        ? l.simulated
                          ? 'refunded (simulated, no gateway)'
                          : `refunded · ${l.providerReference ?? ''}`
                        : l.status === 'FAILED'
                          ? `failed: ${l.error ?? 'gateway refused'} (returned to credit)`
                          : 'waiting on the gateway'}
                    </li>
                  ))}
                </ul>

                {failed && canRefund && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <Textarea
                      value={notes[r.leaseId] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [r.leaseId]: e.target.value }))}
                      rows={2}
                      placeholder="Why you are retrying (at least 10 characters)"
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      disabled={(notes[r.leaseId] ?? '').trim().length < 10 || retry.isPending}
                      onClick={() =>
                        retry.mutate({ leaseId: r.leaseId, reason: notes[r.leaseId].trim() })
                      }
                    >
                      Retry refund
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
