'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, PiggyBank, ShieldCheck } from 'lucide-react';
import { Badge } from '@getrentos/ui';

import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  disputeDeduction,
  myDeposits,
  type TenantDeduction,
  type TenantDeposit,
} from '@/services/renterDepositService';

const DEDUCTION: Record<
  TenantDeduction['status'],
  { label: string; variant: 'warning' | 'danger' | 'neutral' }
> = {
  PROPOSED: { label: 'Proposed, not agreed', variant: 'warning' },
  APPROVED: { label: 'Deducted', variant: 'danger' },
  REJECTED: { label: 'Dropped', variant: 'neutral' },
};

const DeductionItem = ({ d }: { d: TenantDeduction }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dispute = useMutation({
    mutationFn: () => unwrap(disputeDeduction(d.id, reason.trim())),
    onSuccess: () => {
      setOpen(false);
      setReason('');
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['renter', 'deposits'] });
    },
    onError: (err: Error) => setError(err.message || 'Could not send your dispute.'),
  });
  const status = DEDUCTION[d.status];

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(d.amount)} · {d.reason}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(d.createdAt)}
            {d.fromInspection && ' · from the move-out inspection (see Inspections)'}
          </p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      {d.decisionNote && d.status === 'REJECTED' && !d.disputeAnswer && (
        <p className="mt-1 text-xs text-muted-foreground">Why it was dropped: {d.decisionNote}</p>
      )}
      {d.disputedAt && (
        <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-foreground">
            <span className="font-medium">You disputed this:</span> {d.disputeReason}
          </p>
          <p className="mt-1 text-muted-foreground">
            {d.disputeAnswer ? (
              <>
                <span className="font-medium text-foreground">Owner’s answer:</span>{' '}
                {d.disputeAnswer}
              </>
            ) : (
              'Waiting for the owner’s answer. Your deposit cannot be returned until they answer.'
            )}
          </p>
        </div>
      )}
      {d.canDispute &&
        (open ? (
          <div className="mt-2 space-y-2">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why you disagree, e.g. the damage was there when you moved in"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={reason.trim().length < 10 || dispute.isPending}
                onClick={() => dispute.mutate()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {dispute.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Send dispute
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 text-sm font-medium text-primary hover:underline"
          >
            Dispute this
          </button>
        ))}
    </li>
  );
};

const DepositCard = ({ deposit }: { deposit: TenantDeposit }) => {
  const hold = deposit.hold;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{deposit.propertyTitle}</h3>
          <p className="text-sm text-muted-foreground">{deposit.unitName}</p>
        </div>
        {hold && (
          <Badge variant={hold.status === 'RETURNED' ? 'neutral' : 'success'}>
            {hold.status === 'RETURNED' ? 'Returned' : 'Held'}
          </Badge>
        )}
      </div>

      {!hold ? (
        <div className="mt-3 text-sm text-muted-foreground">
          <p>
            Your lease sets a deposit of{' '}
            <span className="font-medium text-foreground">
              {formatCurrency(deposit.agreedAmount)}
            </span>
            , but it is not recorded as held yet.
          </p>
          {deposit.paidThroughGetRentos?.paid && (
            <p className="mt-1">
              You paid it through GetRentos
              {deposit.paidThroughGetRentos.paidDate && (
                <> on {formatDate(deposit.paidThroughGetRentos.paidDate)}</>
              )}
              .
            </p>
          )}
          <p className="mt-1">
            If you paid it directly, ask your landlord or manager to record it.
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Deposit</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(hold.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Deducted</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(hold.summary.approvedDeductions)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {hold.status === 'RETURNED' ? 'Returned to you' : 'Due back to you'}
              </dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(
                  hold.status === 'RETURNED' ? (hold.returnedAmount ?? 0) : hold.summary.returnable
                )}
              </dd>
            </div>
          </dl>
          {hold.summary.proposedDeductions > 0 && hold.status !== 'RETURNED' && (
            <p className="mt-2 text-sm text-muted-foreground">
              {formatCurrency(hold.summary.proposedDeductions)} more is proposed but not agreed, so
              it is not counted yet.
            </p>
          )}
          <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            {hold.heldByGetRentos
              ? 'Held by GetRentos under GetRentos Payment Protection, not by your landlord. It is only paid out as recorded here.'
              : `Held by ${hold.heldBy ?? 'your landlord'}. GetRentos keeps the record of it, and every deduction shows here.`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Recorded {formatDate(hold.takenAt)}
            {hold.returnedAt && <> · returned {formatDate(hold.returnedAt)}</>}
          </p>

          <h4 className="mt-4 text-sm font-semibold text-foreground">Deductions</h4>
          {hold.deductions.length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              None. Your full deposit is due back to you.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {hold.deductions.map((d) => (
                <DeductionItem key={d.id} d={d} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

/**
 * The tenant's deposit: how much, who holds it, every claim on it and what
 * comes back. Claims the tenant disagrees with can be disputed here, and the
 * deposit is not returned until the owner has answered.
 */
export const DepositSection = () => {
  const deposits = useQuery({
    queryKey: ['renter', 'deposits'],
    queryFn: () => unwrap(myDeposits()),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <PiggyBank className="h-5 w-5 text-primary" aria-hidden />
          Your deposit
        </h2>
        <p className="text-sm text-muted-foreground">
          What you paid, who holds it, and anything taken from it, with the reason.
        </p>
      </div>
      {deposits.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : deposits.isError ? (
        <p className="text-sm text-destructive">
          {(deposits.error as Error).message || 'Could not load your deposit.'}
        </p>
      ) : (deposits.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No deposit on record for your tenancies.
        </div>
      ) : (
        (deposits.data ?? []).map((d) => <DepositCard key={d.leaseId} deposit={d} />)
      )}
    </div>
  );
};
