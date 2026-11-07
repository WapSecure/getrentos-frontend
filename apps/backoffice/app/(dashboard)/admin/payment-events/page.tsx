'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Webhook } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Pagination,
  SearchInput,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminPaymentEventsService,
  type PaymentEvent,
  type PaymentEventStatus,
} from '@/services/adminPaymentEventsService';

type Filter = PaymentEventStatus | 'ALL';
const PAGE_SIZE = 20;

const STATUS: Record<
  PaymentEventStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  PROCESSED: { label: 'Applied', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'danger' },
  RECEIVED: { label: 'Not processed yet', variant: 'warning' },
  IGNORED: { label: 'Not acted on', variant: 'neutral' },
};

/**
 * Every webhook the payment provider sent, and whether it was applied.
 *
 * Before this, a webhook was processed and forgotten. Now finance can find any
 * reference, see whether it landed and why one failed, and replay a failed one
 * once the cause is fixed. Replaying runs the same handling as a delivery and
 * never applies money twice.
 */
export default function PaymentEventsPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canReplay = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('FAILED');
  const [reference, setReference] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['admin', 'payment-events', filter, reference, page],
    queryFn: () =>
      unwrap(
        adminPaymentEventsService.list({
          status: filter,
          reference: reference.trim(),
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const replay = useMutation({
    mutationFn: (id: string) => unwrap(adminPaymentEventsService.replay(id)),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-events'] });
      if (event.status === 'PROCESSED') toast.success('Applied.');
      else toast.error(event.lastError || 'It failed again.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not replay it.'),
  });

  const items = query.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Payment events"
        description="Every webhook the payment provider sent and whether it was applied. Find a reference, see why one failed, and replay it once the cause is fixed: replaying never applies money twice."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(v as Filter);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="FAILED">Failed</TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PROCESSED">Applied</TabsTrigger>
            <TabsTrigger value="IGNORED">Not acted on</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput
          value={reference}
          onValueChange={(v) => {
            setReference(v);
            setPage(1);
          }}
          placeholder="Search a payment or transfer reference…"
          label="Search payment events by reference"
        />
      </div>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load payment events"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title={filter === 'FAILED' ? 'Nothing failed' : 'No events'}
          description={
            reference
              ? 'No event matches that reference.'
              : filter === 'FAILED'
                ? 'Every webhook received has been applied.'
                : 'Webhooks appear here as the payment provider sends them.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((e: PaymentEvent) => (
            <Card key={e.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {e.event}
                    {e.reference ? ` · ${e.reference}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Received {formatDate(e.receivedAt)} · sent {e.deliveries}{' '}
                    {e.deliveries === 1 ? 'time' : 'times'} · {e.attempts}{' '}
                    {e.attempts === 1 ? 'attempt' : 'attempts'}
                    {e.processedAt ? ` · applied ${formatDate(e.processedAt)}` : ''}
                  </p>
                </div>
                <Badge variant={STATUS[e.status].variant}>{STATUS[e.status].label}</Badge>
              </div>

              {e.lastError ? <p className="mt-3 text-sm text-destructive">{e.lastError}</p> : null}

              {(e.status === 'FAILED' || e.status === 'RECEIVED') &&
                (canReplay ? (
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => replay.mutate(e.id)}
                    isLoading={replay.isPending && replay.variables === e.id}
                    disabled={replay.isPending}
                  >
                    Replay
                  </Button>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Replaying needs the rent-finance approval permission.
                  </p>
                ))}
            </Card>
          ))}
        </div>
      )}

      {(query.data?.total ?? 0) > PAGE_SIZE ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={query.data?.total ?? 0}
          onPageChange={setPage}
          className="mt-7"
        />
      ) : null}
    </>
  );
}
