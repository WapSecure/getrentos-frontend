'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, HandCoins, PauseCircle, XCircle } from '@sureground/icons';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  StatGroup,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { payoutAccountLabel, payoutDestinationSentence } from '@/lib/payoutDestination';
import {
  adminPayoutIssuesService,
  type PayoutIssue,
  type PayoutKind,
  type PayoutRail,
  type PayoutSource,
} from '@/services/adminPayoutIssuesService';
import { FactGrid, IconTile } from '@/components/admin/ops/OpsParts';

const sumOf = (rows: { amount: number }[] | undefined) =>
  (rows ?? []).reduce((total, row) => total + row.amount, 0);

const countFigure = (rows: { amount: number }[] | undefined, loaded: boolean) =>
  loaded ? (rows?.length ?? 0) : '–';

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

const SOURCE: Partial<Record<PayoutRail, { href: string; label: string }>> = {
  shortlet: { href: '/admin/shortlets', label: 'Open short-lets' },
  realtor: { href: '/admin/realtors', label: 'Open realtors' },
  agency: { href: '/admin/agencies', label: 'Open agencies' },
  agent: { href: '/admin/agents', label: 'Open agents' },
  partner: { href: '/admin/partner-commercials', label: 'Open partner commercials' },
};

const SOURCE_NOUN: Record<PayoutSource['kind'], string> = {
  booking: 'booking',
  realtorCommission: 'commission',
  agencyCommission: 'commission',
  partnerCommission: 'partner share',
};

const sourceHref = (s: PayoutSource): string | null =>
  s.kind === 'booking'
    ? `/admin/shortlets?tab=bookings&bookingId=${encodeURIComponent(s.id)}`
    : null;

const sourceText = (s: PayoutSource): string =>
  `${SOURCE_NOUN[s.kind]} ${s.id}${s.count > 1 ? ` and ${s.count - 1} more` : ''}`;

export default function PayoutIssuesPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canRetry = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [view, setView] = useState<View>('failed');
  const [confirming, setConfirming] = useState<PayoutIssue | null>(null);
  const [approving, setApproving] = useState<PayoutIssue | null>(null);
  const [approvedRefs, setApprovedRefs] = useState<ReadonlySet<string>>(() => new Set());

  const query = useQuery({
    queryKey: ['admin', 'payout-issues'],
    queryFn: () => unwrap(adminPayoutIssuesService.list()),
  });

  const retry = useMutation({
    mutationFn: (p: PayoutIssue) => unwrap(adminPayoutIssuesService.retry(p.rail, p.id)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-issues'] });
      setConfirming(null);
      if (result.status === 'FAILED') {
        toast.error('Sent, and refused again. Check the recipient’s account.');
      } else {
        toast.success('Sent. It shows as paid once the bank confirms.');
      }
    },
    onError: (e: Error) => toast.error(e.message || 'Could not retry this payout.'),
  });

  const approve = useMutation({
    mutationFn: (p: PayoutIssue) =>
      unwrap(adminPayoutIssuesService.approve(p.transferRef as string)),
    onSuccess: (_data, p) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-issues'] });
      if (p.transferRef) {
        const ref = p.transferRef;
        setApprovedRefs((prev) => new Set(prev).add(ref));
      }
      setApproving(null);
      toast.success('Approved. Now retry it to send it.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not approve this payout.'),
  });

  const isApproved = (p: PayoutIssue) =>
    p.held?.approved === true || Boolean(p.transferRef && approvedRefs.has(p.transferRef));

  const items =
    (view === 'failed' ? query.data?.failed : view === 'stuck' ? query.data?.stuck : []) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Money"
        title="Payouts needing attention"
        description="Payouts the bank refused, payouts that stopped before any money was sent, and transfers the bank has held for over a day, on every rail in one place. Retry a failed one once its account is right; sort a stuck one out by hand; check a waiting one with the payment company first."
      />

      <StatGroup
        title="Across every rail"
        className="mb-6"
        items={[
          {
            label: 'Failed',
            value: countFigure(query.data?.failed, !!query.data),
            subtitle: query.data
              ? `${formatCurrency(sumOf(query.data.failed))} refused by the bank`
              : 'Refused by the bank',
            icon: XCircle,
            attention: (query.data?.failed.length ?? 0) > 0,
          },
          {
            label: 'Stuck before sending',
            value: countFigure(query.data?.stuck, !!query.data),
            subtitle: query.data
              ? `${formatCurrency(sumOf(query.data.stuck))} not sent`
              : 'Stopped before any money was sent',
            icon: PauseCircle,
            attention: (query.data?.stuck.length ?? 0) > 0,
          },
          {
            label: 'Waiting on the bank',
            value: countFigure(query.data?.waiting, !!query.data),
            subtitle: query.data
              ? `${formatCurrency(sumOf(query.data.waiting))} held over a day`
              : 'Held for over a day',
            icon: Clock,
          },
        ]}
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
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile>
                      <Clock />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="font-semibold tracking-[-0.01em] text-foreground">
                        {w.beneficiary}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{RAIL[w.kind]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {formatCurrency(w.amount)}
                    </span>
                    <Badge variant="info" dot>
                      Waiting
                    </Badge>
                  </div>
                </div>
                <FactGrid
                  className="mt-4 rounded-lg border border-border bg-secondary/30 p-3"
                  facts={[
                    { label: 'With the bank since', value: formatDate(w.since) },
                    { label: 'Reference', value: w.reference, mono: true },
                  ]}
                />
                <p className="mt-3 text-xs text-muted-foreground">
                  Look this reference up on the payment company’s dashboard before doing anything:
                  it may still land, so sending it again could pay twice. If it is asking for an
                  OTP, approve it there.
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
                <div className="flex min-w-0 items-center gap-3">
                  <IconTile tone={view === 'failed' && !p.held ? 'danger' : 'warning'}>
                    {view === 'failed' ? <XCircle /> : <PauseCircle />}
                  </IconTile>
                  <div className="min-w-0">
                    <p className="font-semibold tracking-[-0.01em] text-foreground">
                      {p.beneficiary}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{RAIL[p.rail]}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(p.amount)}
                  </span>
                  <Badge
                    dot
                    variant={
                      p.held?.needsApproval && isApproved(p)
                        ? 'success'
                        : p.held
                          ? 'warning'
                          : view === 'failed'
                            ? 'danger'
                            : 'warning'
                    }
                  >
                    {p.held
                      ? p.held.needsApproval
                        ? isApproved(p)
                          ? 'Approved, ready to retry'
                          : 'Needs approval'
                        : 'Held by a limit'
                      : view === 'failed'
                        ? 'Failed'
                        : 'Not sent'}
                  </Badge>
                </div>
              </div>

              <FactGrid
                columns={3}
                className="mt-4 rounded-lg border border-border bg-secondary/30 p-3"
                facts={[
                  { label: 'Started', value: formatDate(p.createdAt) },
                  { label: 'Payout', value: p.id, mono: true },
                  p.destination !== undefined && {
                    label: 'Payout account',
                    value: (
                      <>
                        {payoutAccountLabel(p.destination) ?? 'No payout account on file'}
                        {p.destination?.accountChanged && (
                          <Badge variant="warning" className="ml-2">
                            Account changed
                          </Badge>
                        )}
                      </>
                    ),
                  },
                ]}
              />

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
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>No money was sent, so nothing can be paid twice. To sort it out:</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      {p.source
                        ? `It claimed ${sourceText(p.source)}. Check the amount is still owed.`
                        : `Find the record it came from using payout ${p.id} and check the amount is still owed.`}
                    </li>
                    <li>
                      If it is owed, pay it by hand and note the bank reference on the record. If it
                      is not, release what it claimed so it can be paid again later.
                    </li>
                  </ol>
                  {p.source && sourceHref(p.source) ? (
                    <Link
                      href={sourceHref(p.source)!}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Open the {SOURCE_NOUN[p.source.kind]}
                    </Link>
                  ) : (
                    SOURCE[p.rail] && (
                      <Link
                        href={SOURCE[p.rail]!.href}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        {SOURCE[p.rail]!.label}
                      </Link>
                    )
                  )}
                </div>
              ) : canRetry && p.held?.needsApproval && p.transferRef && !isApproved(p) ? (
                <Button className="mt-4" variant="primary" onClick={() => setApproving(p)}>
                  Approve
                </Button>
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
