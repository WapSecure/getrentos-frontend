'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminUnmatchedPaymentsService,
  type UnmatchedPayment,
} from '@/services/adminUnmatchedPaymentsService';

type Filter = 'OPEN' | 'RESOLVED';

const naira = (kobo: string) => formatCurrency(Number(kobo) / 100);

const KIND_LABEL: Record<string, string> = {
  RENT: 'Rent',
  ESCROW: 'Sale escrow',
  SHORTLET: 'Short-let',
  LAND: 'Land',
  FLEX: 'Flex installment',
  DUE: 'Estate due',
  SUBSCRIPTION: 'Subscription',
};

/**
 * Money the gateway confirmed, for an amount that did not match its charge.
 *
 * These used to be logged and dropped: the payer had paid and nothing on
 * GetRentos recorded it. Each one now waits here until finance refunds it or
 * applies it by hand, and records what was done.
 */
export default function UnmatchedPaymentsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canResolve = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const toast = useToast();

  const query = useQuery({
    queryKey: ['admin', 'unmatched-payments', filter],
    queryFn: () => unwrap(adminUnmatchedPaymentsService.list(filter)),
    placeholderData: keepPreviousData,
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      unwrap(adminUnmatchedPaymentsService.resolve(id, resolution)),
    onSuccess: (_r, { id }) => {
      setNotes((n) => ({ ...n, [id]: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin', 'unmatched-payments'] });
      toast.success('Marked resolved.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not resolve.'),
  });

  const items = query.data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <CircleAlert className="h-6 w-6 text-primary" aria-hidden />
          Unmatched payments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Payments the gateway confirmed for an amount that did not match what they were for. The
          payer has paid; refund it or apply it by hand, then record what you did.
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load unmatched payments"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CircleAlert}
          title={filter === 'OPEN' ? 'Nothing to review' : 'Nothing resolved yet'}
          description={
            filter === 'OPEN'
              ? 'Every confirmed payment matched its charge.'
              : 'Resolved payments appear here with what was done.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((p: UnmatchedPayment) => {
            const diff = Number(p.receivedAmountKobo) - Number(p.expectedAmountKobo);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {KIND_LABEL[p.kind] ?? p.kind} · received {naira(p.receivedAmountKobo)},
                      expected {naira(p.expectedAmountKobo)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(p.createdAt)} · reference {p.reference}
                      {p.entityId ? ` · charge ${p.entityId}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={diff < 0 ? 'warning' : 'info'}>
                      {diff < 0
                        ? `Short by ${naira(String(-diff))}`
                        : `Over by ${naira(String(diff))}`}
                    </Badge>
                    <Badge variant={p.status === 'OPEN' ? 'warning' : 'success'}>
                      {p.status === 'OPEN' ? 'Open' : 'Resolved'}
                    </Badge>
                  </div>
                </div>

                {p.status === 'RESOLVED' ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {p.resolution}
                    {p.resolvedAt ? ` · ${formatDate(p.resolvedAt)}` : ''}
                  </p>
                ) : canResolve ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
                    <Textarea
                      value={notes[p.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                      placeholder="What was done, e.g. Refunded in full on Paystack, ref RF-123"
                      className="min-h-[72px] flex-1"
                      aria-label={`Resolution for ${p.reference}`}
                    />
                    <Button
                      onClick={() => resolve.mutate({ id: p.id, resolution: notes[p.id] ?? '' })}
                      disabled={(notes[p.id] ?? '').trim().length < 10 || resolve.isPending}
                      isLoading={resolve.isPending && resolve.variables?.id === p.id}
                    >
                      Mark resolved
                    </Button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Resolving needs the rent-finance approval permission.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
