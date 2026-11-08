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
import { payoutAccountLabel, payoutDestinationSentence } from '@/lib/payoutDestination';
import {
  adminPayoutIssuesService,
  type PayoutIssue,
  type PayoutKind,
} from '@/services/adminPayoutIssuesService';

type View = 'failed' | 'stuck' | 'waiting';

const RAIL: Record<PayoutKind, string> = {
  shortlet: 'Short-let host',
  realtor: 'Realtor commission',
  agency: 'Agency commission',
  agent: 'Agent share',
  partner: 'Delivery partner share',
  sale: 'Sale proceeds',
  statement: 'Owner statement',
  disbursement: 'Scheduled owner payout',
  vendor: 'Vendor invoice',
  land: 'Land sale release',
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
  const [approving, setApproving] = useState<PayoutIssue | null>(null);

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

  const approve = useMutation({
    mutationFn: (p: PayoutIssue) =>
      unwrap(adminPayoutIssuesService.approve(p.transferRef as string)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-issues'] });
      setApproving(null);
      toast.success('Approved. Retry it to send it.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not approve this payout.'),
  });

  const items =
    (view === 'failed' ? query.data?.failed : view === 'stuck' ? query.data?.stuck : []) ?? [];

  return (
    <>
      <PageHeader
        title="Payouts needing attention"
        description="Payouts the bank refused, payouts that stopped before any money was sent, and transfers the bank has held for over a day, on every rail in one place. Retry a failed one once its account is right; sort a stuck one out by hand; check a waiting one on Paystack first."
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-4">
          <TabsTrigger value="failed">Failed ({query.data?.failed.length ?? 0})</TabsTrigger>
          <TabsTrigger value="stuck">
            Stuck before sending ({query.data?.stuck.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="waiting">
            Waiting on the bank ({query.data?.waiting.length ?? 0})
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
      ) : view === 'waiting' ? (
        (query.data?.waiting.length ?? 0) === 0 ? (
          <EmptyState
            icon={HandCoins}
            title="Nothing waiting on the bank"
            description="Every transfer sent in the last day has settled or is still within a day."
          />
        ) : (
          <div className="space-y-3">
            {query.data?.waiting.map((w) => (
              <Card key={`${w.kind}-${w.id}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {formatCurrency(w.amount)} · {w.beneficiary}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {RAIL[w.kind]} · with the bank since {formatDate(w.since)} · reference{' '}
                      {w.reference}
                    </p>
                  </div>
                  <Badge variant="info">Waiting</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Look this reference up on Paystack before doing anything: it may still land, so
                  sending it again could pay twice. If Paystack is asking for an OTP, approve it
                  there.
                </p>
              </Card>
            ))}
          </div>
        )
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
                  {p.destination !== undefined && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {payoutAccountLabel(p.destination) ?? 'No payout account on file'}
                      {p.destination?.accountChanged && (
                        <Badge variant="warning" className="ml-2">
                          Account changed
                        </Badge>
                      )}
                    </p>
                  )}
                </div>
                <Badge variant={p.held ? 'warning' : view === 'failed' ? 'danger' : 'warning'}>
                  {p.held
                    ? p.held.needsApproval
                      ? 'Needs approval'
                      : 'Held by a limit'
                    : view === 'failed'
                      ? 'Failed'
                      : 'Not sent'}
                </Badge>
              </div>

              {p.held ? (
                <p className="mt-3 text-sm text-foreground">
                  {p.held.message}{' '}
                  <span className="text-muted-foreground">
                    Nothing was sent, so it is safe to send later.
                  </span>
                </p>
              ) : p.failureReason ? (
                <p className="mt-3 text-sm text-destructive">{p.failureReason}</p>
              ) : null}

              {view === 'stuck' ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No money was sent. Release what it claimed, or send it again by hand.
                </p>
              ) : canRetry && p.held?.needsApproval && p.transferRef ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => setApproving(p)}>
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => setConfirming(p)}>
                    Retry
                  </Button>
                </div>
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
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve this payout?"
        description={
          approving
            ? `${formatCurrency(approving.amount)} to ${approving.beneficiary} (${RAIL[approving.rail]}). Payouts of ₦5,000,000 or more need a second officer. Approving does not send it: retry it afterwards.`
            : ''
        }
        tone="primary"
        confirmLabel="Approve"
        isLoading={approve.isPending}
        onConfirm={() => approving && approve.mutate(approving)}
      />

      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
        title={
          confirming
            ? `Send ${formatCurrency(confirming.amount)} to ${confirming.beneficiary} again?`
            : 'Send this payout again?'
        }
        description={
          confirming
            ? `${formatCurrency(confirming.amount)} to ${confirming.beneficiary} (${RAIL[confirming.rail]}), under a new reference, to their current payout account. ${
                confirming.destination !== undefined
                  ? payoutDestinationSentence(confirming.destination)
                  : 'If it changed after this payout failed, check the change was really theirs before you send.'
              }`
            : ''
        }
        confirmLabel={confirming ? `Send ${formatCurrency(confirming.amount)}` : 'Send'}
        isLoading={retry.isPending}
        onConfirm={() => confirming && retry.mutate(confirming)}
      />
    </>
  );
}
