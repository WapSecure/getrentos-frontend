'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Coins } from '@sureground/icons';
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
  PageHeader,
} from '@sureground/ui';
import { FactGrid, IconTile } from '@/components/admin/ops/OpsParts';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
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
  FLEX: 'Flex instalment',
  DUE: 'Estate due',
  SUBSCRIPTION: 'Subscription',
  LAND_UNAPPLIED: 'Land (contract could not take it: refund)',
  VENDOR_TOP_UP: 'Vendor invoice top-up',
  UNKNOWN: 'Unknown reference',
};

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
      <PageHeader
        eyebrow="Money"
        title="Unmatched payments"
        description="Payments the gateway confirmed for an amount that did not match what they were for. The payer has paid; refund it or apply it by hand, then record what you did."
        meta={
          query.data ? (
            <Badge variant={filter === 'OPEN' && items.length > 0 ? 'warning' : 'neutral'} dot>
              {items.length} {filter === 'OPEN' ? 'open' : 'resolved'}
            </Badge>
          ) : undefined
        }
      />

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
              <Card key={p.id} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile tone={p.status === 'OPEN' ? 'primary' : 'neutral'}>
                      <Coins />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="font-semibold tracking-[-0.01em] text-foreground">
                        {KIND_LABEL[p.kind] ?? p.kind}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Confirmed {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={diff < 0 ? 'warning' : 'info'}>
                      {diff < 0
                        ? `Short by ${naira(String(-diff))}`
                        : `Over by ${naira(String(diff))}`}
                    </Badge>
                    <Badge variant={p.status === 'OPEN' ? 'warning' : 'success'} dot>
                      {p.status === 'OPEN' ? 'Open' : 'Resolved'}
                    </Badge>
                  </div>
                </div>

                <FactGrid
                  columns={4}
                  className="mx-5 mt-4 rounded-lg border border-border bg-secondary/30 p-3"
                  facts={[
                    {
                      label: 'Received',
                      value: <span className="tabular-nums">{naira(p.receivedAmountKobo)}</span>,
                    },
                    {
                      label: 'Expected',
                      value: <span className="tabular-nums">{naira(p.expectedAmountKobo)}</span>,
                    },
                    { label: 'Reference', value: p.reference, mono: true },
                    !!p.entityId && { label: 'Charge', value: p.entityId, mono: true },
                  ]}
                />

                <div className="px-5 pb-5">
                  {p.status === 'RESOLVED' ? (
                    <p className="mt-4 text-sm text-muted-foreground">
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
                    <p className="mt-4 text-xs text-muted-foreground">
                      Resolving needs the rent-finance approval permission.
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
