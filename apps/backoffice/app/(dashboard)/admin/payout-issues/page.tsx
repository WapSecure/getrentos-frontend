'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@getrentos/ui';
import { formatCurrency, formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminPayoutIssuesService,
  type PayoutIssue,
  type PayoutRail,
} from '@/services/adminPayoutIssuesService';

type View = 'failed' | 'stuck';

const RAIL: Record<PayoutRail, string> = {
  shortlet: 'Short-let host',
  realtor: 'Realtor commission',
  agency: 'Agency commission',
  agent: 'Agent share',
  partner: 'Delivery partner share',
  sale: 'Sale proceeds',
};

/**
 * Payouts that need a person, on every rail in one place.
 *
 * Failed: the bank refused or reversed the transfer. Retrying sends it again
 * under a fresh reference; the recipient's account must still be usable and
 * outside its change hold, and only one retry can go through.
 * Stuck: stopped before a transfer reference was saved, so no money was sent.
 * These need sorting out by hand.
 */
export default function PayoutIssuesPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canRetry = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [view, setView] = useState<View>('failed');
  const [confirming, setConfirming] = useState<PayoutIssue | null>(null);

  const query = useQuery({
    queryKey: ['admin', 'payout-issues'],
    queryFn: () => unwrap(adminPayoutIssuesService.list()),
  });

  const retry = useMutation({
    mutationFn: (p: PayoutIssue) => unwrap(adminPayoutIssuesService.retry(p.rail, p.id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-issues'] });
      setConfirming(null);
      toast.success(
        result.status === 'FAILED'
          ? 'Sent, and refused again. Check the recipient’s account.'
          : 'Sent. It shows as paid once the bank confirms.'
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Could not retry this payout.'),
  });

  const items = (view === 'failed' ? query.data?.failed : query.data?.stuck) ?? [];

  return (
    <>
      <PageHeader
        title="Payouts needing attention"
        description="Payouts the bank refused, and payouts that stopped before any money was sent, on every rail in one place. Retry a failed one once its account is right; sort a stuck one out by hand."
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-4">
          <TabsTrigger value="failed">Failed ({query.data?.failed.length ?? 0})</TabsTrigger>
          <TabsTrigger value="stuck">
            Stuck before sending ({query.data?.stuck.length ?? 0})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load payouts"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={view === 'failed' ? 'No failed payouts' : 'No stuck payouts'}
          description={
            view === 'failed'
              ? 'Every payout the bank answered went through.'
              : 'Every payout that started was sent.'
          }
        />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={`${p.rail}-${p.id}`} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {formatCurrency(p.amount)} · {p.beneficiary}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {RAIL[p.rail]} · started {formatDate(p.createdAt)} · {p.id}
                  </p>
                </div>
                <Badge variant={view === 'failed' ? 'danger' : 'warning'}>
                  {view === 'failed' ? 'Failed' : 'Not sent'}
                </Badge>
              </div>

              {p.failureReason ? (
                <p className="mt-3 text-sm text-destructive">{p.failureReason}</p>
              ) : null}

              {view === 'stuck' ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No money was sent. Release what it claimed, or send it again by hand.
                </p>
              ) : canRetry ? (
                <Button className="mt-4" variant="outline" onClick={() => setConfirming(p)}>
                  Retry
                </Button>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Retrying needs the rent-finance approval permission.
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Send this payout again?"
        description={
          confirming
            ? `${formatCurrency(confirming.amount)} to ${confirming.beneficiary} (${RAIL[confirming.rail]}). It goes to their current payout account under a new reference.`
            : ''
        }
        confirmLabel="Retry"
        isLoading={retry.isPending}
        onConfirm={() => confirming && retry.mutate(confirming)}
      />
    </>
  );
}
